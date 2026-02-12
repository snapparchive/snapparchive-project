// app/api/create-checkout/route.ts

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
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId: string;
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || undefined,
        metadata: { user_id: user.id },
      });

      customerId = customer.id;

      await supabase.from('subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: 'trial',
        status: 'active',
        auto_renew: true, // Default to auto-renew
      }, { onConflict: 'user_id' });
    }

    // Create checkout session with card collection during trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      
      // ✅ CRITICAL: Collect card details during trial
      payment_method_collection: 'always',
      
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      
      subscription_data: {
        trial_period_days: 14,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel', // Cancel if no card
          },
        },
        metadata: {
          user_id: user.id,
        },
      },
      
      success_url: successUrl || `${req.headers.get('origin')}/dashboard?trial_started=true`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing?canceled=true`,
      
      metadata: {
        user_id: user.id,
      },
      
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 400 }
    );
  }
}