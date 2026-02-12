// app/api/billing/toggle-auto-renew/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { autoRenew } = await req.json();

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const now = new Date();
    
    // Determine if trial has ended
    const trialEnded = subscription.trial_ends_at 
      ? new Date(subscription.trial_ends_at) <= now
      : true;

    // Determine if we're in an active paid period
    const isActivePaidPlan = trialEnded && subscription.plan !== 'trial';

    let autoRenewOffAt = null;
    let message = '';

    if (autoRenew) {
      // TURNING ON: Clear the auto_renew_off_at timestamp
      autoRenewOffAt = null;
      message = 'Auto-renewal enabled. Your subscription will continue automatically.';
    } else {
      // TURNING OFF: Logic depends on trial vs paid plan status
      
      if (!trialEnded) {
        // DURING TRIAL: Set to trial end date
        // The 2-day countdown starts AFTER trial ends
        autoRenewOffAt = subscription.trial_ends_at;
        message = 'Auto-renewal disabled. After your trial ends, you will have 2 days to re-enable auto-renewal before cancellation.';
      } else if (isActivePaidPlan && subscription.current_period_end) {
        // DURING ACTIVE PAID PLAN: Set to current period end date
        // The 2-day countdown starts AFTER the plan period ends
        autoRenewOffAt = subscription.current_period_end;
        const periodEndDate = new Date(subscription.current_period_end).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        const cancellationDate = new Date(subscription.current_period_end);
        cancellationDate.setDate(cancellationDate.getDate() + 2);
        const cancelDate = cancellationDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        message = `Auto-renewal disabled. Your Pro plan will remain active until ${periodEndDate}. If not re-enabled, your subscription will be cancelled on ${cancelDate}.`;
      } else {
        // FALLBACK (shouldn't normally reach here): Set to NOW
        autoRenewOffAt = now.toISOString();
        message = 'Auto-renewal disabled. Your subscription will be cancelled in 2 days if not re-enabled.';
      }
    }

    // Update Stripe subscription
    if (subscription.stripe_subscription_id) {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: !autoRenew,
      });
    }

    // Update database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        auto_renew: autoRenew,
        cancel_at_period_end: !autoRenew,
        auto_renew_off_at: autoRenewOffAt,
        updated_at: now.toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      autoRenew,
      autoRenewOffAt,
      message,
    });

  } catch (error: any) {
    console.error('Error toggling auto-renew:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}