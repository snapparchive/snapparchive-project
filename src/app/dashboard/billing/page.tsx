// app/dashboard/billing/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { trackEvent } from '@/lib/analytics';

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_customer_id: string;
}

export default function BillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;

      setSubscription(data);
    } catch (error: any) {
      console.error('Error loading subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsProcessing(true);
    trackEvent('click_manage_Subscription_banner', {
      button_name: 'Manage Subscription',
      button_location: 'manage_Subscription_banner',
    });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/create-portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/billing`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = {
      trial: 'Free Trial',
      basic: 'Core',
      pro: 'Pro',
      enterprise: 'Business',
    };
    return names[plan] || plan;
  };

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      trial: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      pro: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-green-100 text-green-700',
    };
    return colors[plan] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-700">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Billing & Subscription
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your subscription and billing information
              </p>
            </div>

            {subscription && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge className={getPlanColor(subscription.plan)}>
                          {getPlanName(subscription.plan)}
                        </Badge>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>

                    {subscription.plan !== 'trial' && subscription.current_period_end && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {subscription.cancel_at_period_end
                            ? 'Cancels on '
                            : 'Renews on '}
                          {new Date(subscription.current_period_end).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {subscription.cancel_at_period_end && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Subscription Ending
                          </p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Your subscription will end on{' '}
                            {new Date(subscription.current_period_end).toLocaleDateString()}.
                            You can reactivate it anytime before then.
                          </p>
                        </div>
                      </div>
                    )}

                    {subscription.plan === 'trial' && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          You're currently on a free trial. Upgrade to continue using SnappArchive
                          after your trial ends.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Manage Subscription</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Use the Stripe Customer Portal to manage your subscription, update payment
                      methods, view invoices, and more.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {subscription.plan === 'trial' ? (
                        <Button
                          onClick={() => router.push('/pricing')}
                          className="bg-primary hover:bg-primary-hover"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Upgrade Now
                        </Button>
                      ) : (
                        <Button
                          onClick={handleManageSubscription}
                          disabled={isProcessing}
                          className="bg-primary hover:bg-primary-hover"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Opening...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Manage Subscription
                            </>
                          )}
                        </Button>
                      )}

                      {subscription.plan !== 'trial' && (
                        <Button
                          variant="outline"
                          onClick={() => router.push('/pricing')}
                        >
                          View All Plans
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usage & Limits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Documents This Month</span>
                          <span className="font-medium">Coming Soon</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Storage Used</span>
                          <span className="font-medium">Coming Soon</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }} />
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-4">
                        Usage tracking and overage billing will be available soon.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}