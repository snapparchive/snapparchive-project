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

    // Get subscription from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ invoice: null });
    }

    // Only fetch upcoming invoice if trial has ended and auto‑renew is on
    const trialEnded = subscription.trial_ends_at
      ? new Date(subscription.trial_ends_at) <= new Date()
      : true;

    if (!trialEnded || !subscription.auto_renew) {
      return NextResponse.json({ invoice: null });
    }

    try {
      // Fetch Stripe subscription to get the Stripe customer
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      // Try previewing the upcoming invoice
      const upcomingInvoice = await stripe.invoices.createPreview({
        customer: stripeSubscription.customer as string,
        subscription: subscription.stripe_subscription_id,
      });

      return NextResponse.json({
        invoice: {
          amount: upcomingInvoice.amount_due != null
            ? upcomingInvoice.amount_due / 100
            : null,
          date: upcomingInvoice.period_end
            ? new Date(upcomingInvoice.period_end * 1000).toISOString()
            : null,
          currency: upcomingInvoice.currency || null,
          status: upcomingInvoice.status || null,
        },
      });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);

      // Fallback to subscription.current_period_end if preview not available
      return NextResponse.json({
        invoice: subscription.current_period_end
          ? {
              amount: null,
              date: new Date(subscription.current_period_end).toISOString(),
              currency: null,
              status: null,
            }
          : null,
      });
    }
  } catch (error: any) {
    console.error('Error fetching upcoming invoice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
