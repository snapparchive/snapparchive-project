// app/api/cron/cancel-subscriptions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Get subscriptions where:
    // 1. auto_renew is OFF
    // 2. status is active
    // 3. auto_renew_off_at is set
    // 4. auto_renew_off_at + 2 days has passed
    const { data: subscriptionsToCancel, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('auto_renew', false)
      .eq('status', 'active')
      .not('auto_renew_off_at', 'is', null)
      .lt('auto_renew_off_at', twoDaysAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const results = {
      processed: 0,
      cancelled: 0,
      skipped: 0,
      errors: [] as any[],
    };

    // Cancel each subscription
    for (const subscription of subscriptionsToCancel || []) {
      results.processed++;

      try {
        // Additional check: Ensure we're past the reference point + 2 days
        const autoRenewOffDate = new Date(subscription.auto_renew_off_at);
        const cancellationDate = new Date(autoRenewOffDate);
        cancellationDate.setDate(cancellationDate.getDate() + 2);

        if (now < cancellationDate) {
          // Not yet time to cancel
          results.skipped++;
          console.log(`Skipping subscription ${subscription.id}: cancellation date not reached yet`);
          continue;
        }

        // Cancel in Stripe if subscription exists
        if (subscription.stripe_subscription_id) {
          await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        }

        // Update database
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', subscription.id);

        if (updateError) {
          throw updateError;
        }

        results.cancelled++;
        console.log(`Cancelled subscription for user: ${subscription.user_id}`);
      } catch (error: any) {
        console.error(`Error cancelling subscription ${subscription.id}:`, error);
        results.errors.push({
          subscription_id: subscription.id,
          user_id: subscription.user_id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} subscriptions, cancelled ${results.cancelled}, skipped ${results.skipped}`,
      results,
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}