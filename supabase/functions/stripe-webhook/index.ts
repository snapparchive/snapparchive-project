// supabase/functions/stripe-webhook/index.ts

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2025-12-15.clover',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error('[Webhook] No signature provided')
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)

    console.log(`[Webhook] Event received: ${event.type}`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(supabase, invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoiceFailed(supabase, invoice)
        break
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: any) {
    console.error(`[Webhook] Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  console.log('[Checkout] Session completed:', session.id)

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.user_id

  if (!userId) {
    console.error('[Checkout] No user_id in session metadata')
    return
  }

  try {
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const priceId = subscription.items.data[0].price.id
    const plan = getPlanFromPriceId(priceId)

    console.log('[Checkout] Plan:', plan, 'Price ID:', priceId)

    // Update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan: plan,
        status: 'active',
        auto_renew: true,
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('[Checkout] Database error:', error)
    } else {
      console.log('[Checkout] Subscription created with trial for user:', userId)
      await sendTrialStartedEmail(supabase, userId, plan)
    }
  } catch (error: any) {
    console.error('[Checkout] Error:', error.message)
  }
}

async function handleSubscriptionUpdate(supabase: any, subscription: Stripe.Subscription) {
  console.log('[Subscription] Update:', subscription.id)

  const customerId = subscription.customer as string

  try {
    const { data: existingSub, error: findError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (findError || !existingSub) {
      console.error('[Subscription] No user found for customer:', customerId, findError)
      return
    }

    const priceId = subscription.items.data[0].price.id
    const plan = getPlanFromPriceId(priceId)

    // ✅ FIXED: Map Stripe status correctly
    let status = 'active'
    if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      status = 'cancelled' // Changed from 'expired' to 'cancelled'
    } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
      status = 'expired'
    } else if (subscription.status === 'active' || subscription.status === 'trialing') {
      status = 'active'
    }

    console.log('[Subscription] Updating to plan:', plan, 'status:', status)

    const { error } = await supabase
      .from('subscriptions')
      .update({
        stripe_subscription_id: subscription.id,
        plan: plan,
        status: status,
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        current_period_start: subscription.current_period_start
          ? new Date(subscription.current_period_start * 1000).toISOString()
          : null,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancelled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
        // ✅ FIXED: Also update auto_renew when subscription is updated
        auto_renew: !subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingSub.user_id)

    if (error) {
      console.error('[Subscription] Database error:', error)
    } else {
      console.log('[Subscription] Updated for user:', existingSub.user_id)
    }
  } catch (error: any) {
    console.error('[Subscription] Error:', error.message)
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  console.log('[Subscription] Deleted:', subscription.id)

  const customerId = subscription.customer as string

  try {
    const { data: existingSub, error: findError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (findError || !existingSub) {
      console.error('[Subscription] No user found for customer:', customerId)
      return
    }

    // ✅ FIXED: Set status to 'cancelled' instead of 'expired'
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled', // Changed from 'expired' to 'cancelled'
        cancelled_at: new Date().toISOString(),
        auto_renew: false, // ✅ Also set auto_renew to false
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingSub.user_id)

    if (error) {
      console.error('[Subscription] Database error:', error)
    } else {
      console.log('[Subscription] Marked as cancelled for user:', existingSub.user_id)
    }
  } catch (error: any) {
    console.error('[Subscription] Error:', error.message)
  }
}

async function handleInvoicePaid(supabase: any, invoice: Stripe.Invoice) {
  console.log('[Invoice] Paid:', invoice.id)

  const customerId = invoice.customer as string
  const amountPaid = invoice.amount_paid / 100

  try {
    const { data: existingSub, error: findError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (findError || !existingSub) {
      console.error('[Invoice] No subscription found for customer:', customerId)
      return
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        amount_paid: amountPaid,
        last_payment_at: new Date().toISOString(),
        payment_failed_at: null,
        payment_failure_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingSub.user_id)

    if (error) {
      console.error('[Invoice] Database update error:', error)
    } else {
      console.log('[Invoice] Payment recorded for user:', existingSub.user_id, 'Amount:', amountPaid)
      await sendPaymentSuccessEmail(supabase, existingSub.user_id, amountPaid, invoice)
    }
  } catch (error: any) {
    console.error('[Invoice] Error:', error.message)
  }
}

async function handleInvoiceFailed(supabase: any, invoice: Stripe.Invoice) {
  console.log('[Invoice] Payment failed:', invoice.id)

  const customerId = invoice.customer as string
  const failureReason = invoice.last_finalization_error?.message || 'Payment failed'

  try {
    const { data: existingSub, error: findError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (findError || !existingSub) {
      console.error('[Invoice] No subscription found for customer:', customerId)
      return
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        payment_failed_at: new Date().toISOString(),
        payment_failure_reason: failureReason,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingSub.user_id)

    if (error) {
      console.error('[Invoice] Database update error:', error)
    } else {
      console.log('[Invoice] Payment failure recorded for user:', existingSub.user_id)
      await sendPaymentFailedEmail(supabase, existingSub.user_id, failureReason)
    }
  } catch (error: any) {
    console.error('[Invoice] Error:', error.message)
  }
}

async function sendTrialStartedEmail(supabase: any, userId: string, plan: string) {
  try {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    if (user?.email) {
      console.log('[Email] Sending trial started email to:', user.email)
    }
  } catch (error: any) {
    console.error('[Email] Error sending trial started email:', error.message)
  }
}

async function sendPaymentSuccessEmail(
  supabase: any,
  userId: string,
  amount: number,
  invoice: Stripe.Invoice
) {
  try {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    if (user?.email) {
      console.log('[Email] Sending payment success email to:', user.email, 'Amount:', amount)
    }
  } catch (error: any) {
    console.error('[Email] Error sending payment success email:', error.message)
  }
}

async function sendPaymentFailedEmail(
  supabase: any,
  userId: string,
  failureReason: string
) {
  try {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    if (user?.email) {
      console.log('[Email] Sending payment failed email to:', user.email)
    }
  } catch (error: any) {
    console.error('[Email] Error sending payment failed email:', error.message)
  }
}

function getPlanFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    'price_1SmtzbBMb6Cwfb8eog2DUUx5': 'basic',      // Core €29
    'price_1Smu4HBMb6Cwfb8eUxrFwHDz': 'pro',        // Pro €49
    'price_1Smu6OBMb6Cwfb8eLFLYymnP': 'enterprise', // Business €79
  }

  const plan = priceMap[priceId]
  if (!plan) {
    console.warn('[getPlanFromPriceId] Unknown price ID:', priceId, '- defaulting to basic')
  }
  return plan || 'basic'
}