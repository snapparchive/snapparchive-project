// lib/hooks/useSubscription.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired';
  trial_ends_at: string | null;
  current_period_end: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    checkSubscription();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      authListener.unsubscribe();
    };
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setSubscription(null);
        setHasActiveSubscription(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        setSubscription(null);
        setHasActiveSubscription(false);
      } else if (data) {
        setSubscription(data);
        setHasActiveSubscription(data.status === 'active');
      } else {
        setSubscription(null);
        setHasActiveSubscription(false);
      }
    } catch (error) {
      console.error('Subscription check error:', error);
      setSubscription(null);
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  return { subscription, loading, hasActiveSubscription, refetch: checkSubscription };
}