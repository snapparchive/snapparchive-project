import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch subscription from DB
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ invoice: null, latestPayment: null });
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id,
      {
        expand: [
          'latest_invoice.payment_intent', // expand latest invoice's payment intent
        ]
      }
    );

    // --- Latest Payment Info ---
    const latestInvoiceData = stripeSubscription.latest_invoice as any;
    const paymentIntentData = latestInvoiceData?.payment_intent as any;

    const latestPayment = paymentIntentData
      ? {
          amountPaid: paymentIntentData.amount_received / 100,
          currency: paymentIntentData.currency,
          paymentDate: paymentIntentData.created
            ? new Date(paymentIntentData.created * 1000).toISOString()
            : null,
          status: paymentIntentData.status,
        }
      : null;

    // --- Upcoming Invoice Preview ---
    let upcomingInvoice: any = null;

    const trialEnded = subscription.trial_ends_at
      ? new Date(subscription.trial_ends_at) <= new Date()
      : true;

    if (trialEnded && subscription.auto_renew) {
      try {
        const preview = await stripe.invoices.createPreview({
          customer: stripeSubscription.customer as string,
          subscription: subscription.stripe_subscription_id,
        });

        upcomingInvoice = preview?.amount_due != null
          ? {
              amount: preview.amount_due / 100,
              date: preview.period_end
                ? new Date(preview.period_end * 1000).toISOString()
                : null,
              currency: preview.currency,
              status: preview.status,
            }
          : null;
      } catch (stripeError: any) {
        // No preview available → skip silently
        upcomingInvoice = null;
      }
    }

    // Fallback: if no preview, show next billing date
    if (!upcomingInvoice && subscription.current_period_end) {
      upcomingInvoice = {
        amount: null,
        date: new Date(subscription.current_period_end).toISOString(),
        currency: null,
        status: null,
      };
    }

    return NextResponse.json({
      latestPayment,
      upcomingInvoice,
    });

  } catch (error: any) {
    console.error('Error in invoice summary API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
