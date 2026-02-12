// app/api/subscription-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Subscription Status] No auth header');
      return NextResponse.json({ active: false }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('[Subscription Status] Auth error:', authError?.message);
      return NextResponse.json({ active: false }, { status: 401 });
    }

    console.log('[Subscription Status] Checking for user:', user.id);

    // Get subscription from database
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError) {
      console.log('[Subscription Status] Database error:', subError.message);
      return NextResponse.json({ active: false }, { status: 200 });
    }

    if (!subscription) {
      console.log('[Subscription Status] No subscription found');
      return NextResponse.json({ active: false }, { status: 200 });
    }

    console.log('[Subscription Status] Subscription found:', {
      plan: subscription.plan,
      status: subscription.status,
      trial_ends_at: subscription.trial_ends_at,
    });

    // Check if subscription is active
    // A subscription is active if:
    // 1. Status is 'active' 
    // 2. AND (it's a trial OR has Stripe subscription OR is within trial period)
    const isActive = subscription.status === 'active';

    console.log('[Subscription Status] Is active:', isActive);

    return NextResponse.json({ 
      active: isActive,
      plan: subscription.plan,
      status: subscription.status,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Subscription Status] Error:', error);
    return NextResponse.json({ active: false }, { status: 500 });
  }
}