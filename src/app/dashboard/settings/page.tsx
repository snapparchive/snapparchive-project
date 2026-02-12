'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, User, Bell, Trash2, Key, AlertCircle,
  CheckCircle, XCircle, Calendar, DollarSign
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Toaster } from '@/components/ui/toaster';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import UniversalLoader from '@/components/ui/universal-loader';
import { logger, LogCategory, PerformanceLogger } from '@/lib/logger';
import { UsageStatsCard } from '@/components/subscription/UsageStatsCard';
import { trackEvent } from '@/lib/analytics';

interface Profile {
  id: string;
  full_name: string;
  company_name: string | null;
  company_size: string | null;
  language: string;
  notify_upload?: boolean;
  notify_ocr_complete?: boolean;
  notify_ocr_failed?: boolean;
}

interface Subscription {
  plan: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
  auto_renew_off_at: string | null;
  payment_failed_at: string | null;
  payment_failure_reason: string | null;
  last_payment_at: string | null;
  amount_paid: number | null;
  stripe_customer_id: string;
  stripe_subscription_id: string;
}

interface UpcomingInvoice {
  amount: number;
  date: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [upcomingInvoice, setUpcomingInvoice] = useState<UpcomingInvoice | null>(null);
  const [latestPayment, setLatestPayment] = useState<{
    amount: number | null;
    date: string | null;
    currency: string | null;
    status: string | null;
  } | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [storageUsed, setStorageUsed] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const perfLogger = new PerformanceLogger('Load settings page');
    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        logger.warn(LogCategory.AUTH, 'Unauthorized access attempt to settings page');
        router.push('/login');
        return;
      }

      const userId = session.user.id;
      setEmail(session.user.email || '');

      logger.info(LogCategory.USER_ACTION, 'User accessed settings page', {
        userId,
        email: session.user.email,
      });

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        logger.error(LogCategory.DATABASE, 'Failed to load user profile', profileError, {
          userId,
        });
      } else if (profileData) {
        setProfile(profileData);
        logger.debug(LogCategory.USER_ACTION, 'User profile loaded successfully', {
          userId,
        });
      }

      // Load subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (subError) {
        logger.error(LogCategory.DATABASE, 'Failed to load subscription data', subError, {
          userId,
        });
      } else if (subData) {
        setSubscription(subData);
        logger.debug(LogCategory.SUBSCRIPTION, 'Subscription data loaded', {
          userId,
          plan: subData.plan,
          status: subData.status,
        });

        // Load invoice summary from Stripe if subscription exists
        if (subData.stripe_subscription_id) {
          await loadInvoiceSummary(session.access_token);
        }
      }

      // Load storage info
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('file_size')
        .eq('user_id', userId);

      if (docsError) {
        logger.error(LogCategory.DATABASE, 'Failed to load storage data', docsError, {
          userId,
        });
      } else if (docsData) {
        const totalSize = docsData.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
        setStorageUsed(totalSize);
        setDocumentCount(docsData.length);

        logger.storageQuotaChecked(userId, totalSize, 10 * 1024 * 1024 * 1024);
        logger.debug(LogCategory.STORAGE, 'Storage information loaded', {
          userId,
          totalSize,
          documentCount: docsData.length,
        });
      }

      perfLogger.end({ userId });
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Unexpected error loading settings', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvoiceSummary = async (accessToken: string) => {
    try {
      const response = await fetch('/api/billing/invoice-summary', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Latest payment (from Stripe)
        if (data.latestPayment) {
          setLatestPayment({
            amount: data.latestPayment.amountPaid,
            date: data.latestPayment.paymentDate,
            currency: data.latestPayment.currency,
            status: data.latestPayment.status,
          });
        }

        // Upcoming invoice
        if (data.upcomingInvoice) {
          setUpcomingInvoice({
            amount: data.upcomingInvoice.amount,
            date: data.upcomingInvoice.date,
          });
        }
      }
    } catch (error) {
      console.error('Error loading invoice summary:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const perfLogger = new PerformanceLogger('Save profile', profile.id);
    setIsSaving(true);

    try {
      logger.info(LogCategory.USER_ACTION, 'User initiated profile update', {
        userId: profile.id,
        changes: {
          full_name: profile.full_name,
          company_name: profile.company_name,
          company_size: profile.company_size,
        },
      });

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          company_name: profile.company_name,
          company_size: profile.company_size,
        })
        .eq('id', profile.id);

      if (error) {
        logger.error(LogCategory.DATABASE, 'Failed to update profile', error, {
          userId: profile.id,
        });
        toast({
          title: 'Error',
          description: 'Failed to update profile',
          variant: 'destructive',
        });
        perfLogger.error(error);
      } else {
        logger.info(LogCategory.USER_ACTION, 'Profile updated successfully', {
          userId: profile.id,
          full_name: profile.full_name,
        });
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
        perfLogger.end();
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Unexpected error updating profile', error, {
        userId: profile.id,
      });
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      perfLogger.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    trackEvent('click_change_password', {
      button_name: 'Change Password',
      button_location: 'security_change_password',
    });

    if (newPassword !== confirmPassword) {
      logger.warn(LogCategory.AUTH, 'Password change failed: passwords do not match', {
        userId,
      });
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      logger.warn(LogCategory.AUTH, 'Password change failed: password too short', {
        userId,
      });
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    const perfLogger = new PerformanceLogger('Change password', userId);

    try {
      logger.info(LogCategory.USER_ACTION, 'User initiated password change', {
        userId,
      });

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        logger.error(LogCategory.AUTH, 'Password change failed', error, {
          userId,
        });
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        perfLogger.error(error);
      } else {
        logger.passwordChanged(userId!);
        toast({
          title: 'Success',
          description: 'Password changed successfully',
        });
        setIsPasswordOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        perfLogger.end();
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Unexpected error changing password', error, {
        userId,
      });
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      perfLogger.error(error);
    }
  };

  const handleDeleteAccount = async () => {
    trackEvent('click_delete_account', {
      button_name: 'Delete Account',
      button_location: 'setting_danger_zone_section',
    });
    if (deleteConfirmation !== 'DELETE') {
      logger.warn(LogCategory.SECURITY, 'Account deletion attempt with incorrect confirmation');
      toast({
        title: 'Error',
        description: 'Please type DELETE to confirm',
        variant: 'destructive',
      });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const perfLogger = new PerformanceLogger('Delete account', userId);

    try {
      logger.warn(LogCategory.SECURITY, 'User initiated account deletion', {
        userId,
        email: session.user.email,
      });

      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      logger.info(LogCategory.SECURITY, 'Account deleted successfully', {
        userId,
        email: session.user.email,
      });

      await supabase.auth.signOut();
      logger.userLogout(userId);

      toast({
        title: 'Success',
        description: 'Account deleted successfully',
      });

      perfLogger.end();

      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error: any) {
      logger.error(LogCategory.SECURITY, 'Account deletion failed', error, {
        userId,
        errorMessage: error.message,
      });

      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });

      perfLogger.error(error);
    }
  };

  const handleToggleAutoRenew = async (enabled: boolean) => {
    if (!subscription) return;

    setIsTogglingAutoRenew(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/billing/toggle-auto-renew', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ autoRenew: enabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update auto-renewal');
      }

      const result = await response.json();

      setSubscription({
        ...subscription,
        auto_renew: enabled,
        cancel_at_period_end: !enabled,
        auto_renew_off_at: result.autoRenewOffAt,
      });

      toast({
        title: enabled ? 'Auto-Renewal Enabled' : 'Auto-Renewal Disabled',
        description: result.message,
      });

      // Reload invoice data
      await loadInvoiceSummary(session.access_token);

    } catch (error: any) {
      console.error('Error toggling auto-renew:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update auto-renewal settings',
        variant: 'destructive',
      });
    } finally {
      setIsTogglingAutoRenew(false);
    }
  };

  const handleManageBilling = async () => {
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
          returnUrl: `${window.location.origin}/dashboard/settings`,
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
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        variant: 'destructive',
      });
    }
  };

  // Check if user is in trial
  const isInTrial = () => {
    if (!subscription?.trial_ends_at) return false;
    return new Date(subscription.trial_ends_at) > new Date();
  };

  // Check if trial has ended
  const hasTrialEnded = () => {
    if (!subscription?.trial_ends_at) return true;
    return new Date(subscription.trial_ends_at) <= new Date();
  };

  // Check if user is on an active paid plan (trial ended, not a trial plan)
  const isActivePaidPlan = () => {
    return hasTrialEnded() && subscription?.plan !== 'trial';
  };

  // Get the reference point for cancellation calculation
  // - During trial: trial_ends_at
  // - After trial (paid plan): current_period_end
  const getReferencePoint = () => {
    if (isInTrial() && subscription?.trial_ends_at) {
      return new Date(subscription.trial_ends_at);
    }
    if (subscription?.current_period_end) {
      return new Date(subscription.current_period_end);
    }
    return null;
  };

  // Check if we're past the reference point (trial end or period end)
  const isPastReferencePoint = () => {
    const refPoint = getReferencePoint();
    if (!refPoint) return false;
    return new Date() > refPoint;
  };

  // Get days remaining until cancellation (2 days after reference point)
  const getCancellationDaysRemaining = () => {
    const refPoint = getReferencePoint();
    if (!refPoint) return 0;

    const cancellationDate = new Date(refPoint);
    cancellationDate.setDate(cancellationDate.getDate() + 2);

    const today = new Date();
    const diffTime = cancellationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  // Get formatted cancellation date (reference point + 2 days)
  const getFormattedCancellationDate = () => {
    const refPoint = getReferencePoint();
    if (!refPoint) return '';

    const cancellationDate = new Date(refPoint);
    cancellationDate.setDate(cancellationDate.getDate() + 2);

    return cancellationDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get formatted period end date
  const getFormattedPeriodEndDate = () => {
    if (!subscription?.current_period_end) return '';
    return new Date(subscription.current_period_end).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get formatted trial end date
  const getFormattedTrialEndDate = () => {
    if (!subscription?.trial_ends_at) return '';
    return new Date(subscription.trial_ends_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get trial days remaining
  const getTrialDaysRemaining = () => {
    if (!subscription?.trial_ends_at) return 0;
    const endDate = new Date(subscription.trial_ends_at);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const storageLimit = 10 * 1024 * 1024 * 1024;
  const storagePercent = (storageUsed / storageLimit) * 100;

   const handleChangePlan = () => {
      trackEvent('click_change_plan', {
        button_name: 'Change Plan',
        button_location: 'Setting billing section',
      });
      router.push('/pricing');
    }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <UniversalLoader fullScreen={false} message="" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-auto">
          <div className="p-8 space-y-6 max-w-5xl">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">
                Manage your account settings and preferences
              </p>
            </div>

            <Tabs
              defaultValue="account"
              className="space-y-6"
              onValueChange={(value) => {
                logger.info(LogCategory.USER_ACTION, 'Settings tab changed', {
                  userId: profile.id,
                  tab: value,
                });
              }}
            >
              <TabsList>
                <TabsTrigger value="account">
                  <User className="h-4 w-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger value="billing">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </TabsTrigger>
                <TabsTrigger value="preferences">
                  <Bell className="h-4 w-4 mr-2" />
                  Preferences
                </TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="mt-2 bg-gray-50"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={profile.full_name}
                        onChange={(e) =>
                          setProfile({ ...profile, full_name: e.target.value })
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        type="text"
                        value={profile.company_name || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, company_name: e.target.value })
                        }
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companySize">Company Size</Label>
                      <Input
                        id="companySize"
                        type="text"
                        value={profile.company_size || ''}
                        onChange={(e) =>
                          setProfile({ ...profile, company_size: e.target.value })
                        }
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary-hover text-white"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your password and security settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsPasswordOpen(true);
                        logger.info(LogCategory.USER_ACTION, 'User opened password change dialog', {
                          userId: profile.id,
                        });
                      }}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>
                      Permanently delete your account and all data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeleteOpen(true);
                        logger.warn(LogCategory.USER_ACTION, 'User opened account deletion dialog', {
                          userId: profile.id,
                        });
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                {/* Payment Failure Alert */}
                {subscription?.payment_failed_at && (
                  <Alert variant="destructive" className="border-red-500 bg-red-50">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-red-800 font-semibold">
                      Payment Failed
                    </AlertTitle>
                    <AlertDescription className="text-red-700">
                      <p className="mb-2">
                        We couldn't process your payment. {subscription.payment_failure_reason}
                      </p>
                      <Button
                        onClick={handleManageBilling}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white mt-2"
                      >
                        Update Payment Method
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Trial Ending Soon Alert */}
                {isInTrial() && getTrialDaysRemaining() <= 3 && (
                  <Alert className="border-blue-500 bg-blue-50">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <AlertTitle className="text-blue-800 font-semibold">
                      Trial Ending Soon
                    </AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Your trial ends in {getTrialDaysRemaining()} day{getTrialDaysRemaining() !== 1 ? 's' : ''}.
                      {subscription?.auto_renew
                        ? ' Your subscription will auto-renew and you will be charged automatically.'
                        : ' Please enable auto-renewal to continue using the service.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* DURING TRIAL - Auto-Renewal OFF */}
                {!subscription?.auto_renew && isInTrial() && (
                  <Alert className="border-gray-400 bg-gray-50">
                    <AlertCircle className="h-5 w-5 text-gray-600" />
                    <AlertTitle className="text-gray-800 font-semibold">
                      Auto-Renewal Disabled
                    </AlertTitle>
                    <AlertDescription className="text-gray-700">
                      Auto-renewal is currently disabled. After your trial ends on {getFormattedTrialEndDate()}, you'll have 2 days to enable auto-renewal before your subscription is cancelled on {getFormattedCancellationDate()}.
                    </AlertDescription>
                  </Alert>
                )}

                {/* ACTIVE PAID PLAN - Auto-Renewal OFF - BEFORE period end */}
                {!subscription?.auto_renew && isActivePaidPlan() && !isPastReferencePoint() && subscription?.current_period_end && (
                  <Alert className="border-blue-500 bg-blue-50">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <AlertTitle className="text-blue-800 font-semibold">
                      Auto-Renewal Disabled
                    </AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Your Pro plan will remain active until {getFormattedPeriodEndDate()}.
                      After that, you'll have 2 days to re-enable auto-renewal before your subscription is cancelled
                      on {getFormattedCancellationDate()}.
                    </AlertDescription>
                  </Alert>
                )}

                {/* ACTIVE PAID PLAN - Auto-Renewal OFF - AFTER period end (Grace Period) */}
                {!subscription?.auto_renew && isPastReferencePoint() && getCancellationDaysRemaining() > 0 && (
                  <Alert className="border-orange-500 bg-orange-50">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <AlertTitle className="text-orange-800 font-semibold">
                      Plan Ended - Grace Period
                    </AlertTitle>
                    <AlertDescription className="text-orange-700">
                      Your Pro plan has ended. Please enable auto-renewal within{' '}
                      <strong>
                        {getCancellationDaysRemaining()} day
                        {getCancellationDaysRemaining() !== 1 ? 's' : ''}
                      </strong>{' '}
                      to avoid cancellation on {getFormattedCancellationDate()}.
                    </AlertDescription>
                  </Alert>
                )}

                {/* FINAL DAY WARNING */}
                {!subscription?.auto_renew && isPastReferencePoint() && getCancellationDaysRemaining() === 0 && (
                  <Alert variant="destructive" className="border-red-500 bg-red-50">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="text-red-800 font-semibold">
                      Subscription Cancelling Today
                    </AlertTitle>
                    <AlertDescription className="text-red-700">
                      Your subscription is scheduled to be cancelled today. Turn on auto-renewal now to prevent cancellation.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Current Plan Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Manage your subscription</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900 capitalize text-lg">
                          {subscription?.plan === 'basic' ? 'Core' :
                            subscription?.plan === 'enterprise' ? 'Business' :
                              subscription?.plan || 'Trial'} Plan
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            className={
                              subscription?.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : subscription?.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                            }
                          >
                            {subscription?.status || 'Active'}
                          </Badge>
                          {isInTrial() && (
                            <Badge className="bg-blue-100 text-blue-700">
                              {getTrialDaysRemaining()} days trial remaining
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        className="bg-primary hover:bg-primary-hover text-white"
                        onClick={handleChangePlan}
                      >
                        Change Plan
                      </Button>
                    </div>

                    {/* Upcoming Invoice Section - Only show AFTER trial ends */}
                    {upcomingInvoice && hasTrialEnded() && subscription?.auto_renew && (
                      <div className="border-t pt-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Next Invoice</h4>
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div>
                            <p className="text-sm text-blue-600">Your first payment</p>
                            <p className="font-semibold text-blue-900 text-lg">
                              {formatCurrency(upcomingInvoice.amount)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-600">Due date</p>
                            <p className="font-medium text-blue-900">
                              {new Date(upcomingInvoice.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Auto-Renewal Toggle */}
                    {subscription?.plan !== 'trial' && (
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">
                                Auto-Renewal
                              </h4>
                              {subscription?.auto_renew ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {subscription?.auto_renew ? (
                                'Your subscription will automatically renew at the end of the billing period.'
                              ) : isInTrial() ? (
                                <>
                                  Auto-renewal is disabled. After your trial ends on {getFormattedTrialEndDate()},
                                  you'll have 2 days to enable it before cancellation on {getFormattedCancellationDate()}.
                                </>
                              ) : isActivePaidPlan() && !isPastReferencePoint() ? (
                                <>
                                  Your Pro plan remains active until {getFormattedPeriodEndDate()}.
                                  After that, you'll have 2 days to re-enable auto-renewal before cancellation on {getFormattedCancellationDate()}.
                                </>
                              ) : isPastReferencePoint() && getCancellationDaysRemaining() > 0 ? (
                                <>
                                  Your plan has ended. Your subscription will be cancelled in{' '}
                                  <strong className="text-orange-600">
                                    {getCancellationDaysRemaining()} day{getCancellationDaysRemaining() !== 1 ? 's' : ''}
                                  </strong>{' '}
                                  if not turned back on.
                                </>
                              ) : (
                                'Auto-renewal is disabled. Your subscription will be cancelled today if not enabled.'
                              )}
                            </p>
                          </div>
                          <Switch
                            checked={subscription?.auto_renew || false}
                            onCheckedChange={handleToggleAutoRenew}
                            disabled={isTogglingAutoRenew}
                            className="ml-4"
                          />
                        </div>
                      </div>
                    )}

                    {/* Billing Details */}
                    {subscription && (
                      <div className="border-t pt-6 space-y-4">
                        <h4 className="font-semibold text-gray-900">Billing Details</h4>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Next billing date */}
                          {subscription.current_period_end && (
                            <div>
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {subscription.auto_renew ? 'Next Billing Date' : 'Subscription Ends'}
                              </p>
                              <p className="font-medium text-gray-900 mt-1">
                                {new Date(subscription.current_period_end).toLocaleDateString()}
                              </p>
                            </div>
                          )}

                          {/* Latest payment from Stripe API */}
                          {latestPayment && latestPayment.amount !== null ? (
                            <div>
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Last Payment
                              </p>
                              <p className="font-medium text-gray-900 mt-1">
                                {formatCurrency(latestPayment.amount)}{' '}
                                {latestPayment.date && `on ${new Date(latestPayment.date).toLocaleDateString()}`}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                Last Payment
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                No payments recorded yet
                              </p>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          onClick={handleManageBilling}
                          className="w-full"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Manage Payment Methods & Invoices
                        </Button>
                      </div>
                    )}

                    {/* Storage Usage */}
                    <UsageStatsCard />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>
                      Manage your email notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Document Upload Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Receive email when you upload a new document
                        </p>
                      </div>
                      <Switch
                        checked={profile.notify_upload ?? true}
                        onCheckedChange={async (checked) => {
                          setProfile({ ...profile, notify_upload: checked });

                          const { error } = await supabase
                            .from('profiles')
                            .update({ notify_upload: checked })
                            .eq('id', profile.id);

                          if (error) {
                            logger.error(LogCategory.DATABASE, 'Failed to update notification preference', error, {
                              userId: profile.id,
                            });
                            toast({
                              title: 'Error',
                              description: 'Failed to update notification preference',
                              variant: 'destructive',
                            });
                          } else {
                            logger.info(LogCategory.USER_ACTION, 'User toggled upload notifications', {
                              userId: profile.id,
                              enabled: checked,
                            });
                            toast({
                              title: 'Success',
                              description: `Upload notifications ${checked ? 'enabled' : 'disabled'}`,
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          OCR Complete Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Receive email when OCR processing is complete
                        </p>
                      </div>
                      <Switch
                        checked={profile.notify_ocr_complete ?? true}
                        onCheckedChange={async (checked) => {
                          setProfile({ ...profile, notify_ocr_complete: checked });

                          const { error } = await supabase
                            .from('profiles')
                            .update({ notify_ocr_complete: checked })
                            .eq('id', profile.id);

                          if (error) {
                            logger.error(LogCategory.DATABASE, 'Failed to update notification preference', error, {
                              userId: profile.id,
                            });
                            toast({
                              title: 'Error',
                              description: 'Failed to update notification preference',
                              variant: 'destructive',
                            });
                          } else {
                            logger.info(LogCategory.USER_ACTION, 'User toggled OCR complete notifications', {
                              userId: profile.id,
                              enabled: checked,
                            });
                            toast({
                              title: 'Success',
                              description: `OCR complete notifications ${checked ? 'enabled' : 'disabled'}`,
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          OCR Failed Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Receive email when OCR processing fails
                        </p>
                      </div>
                      <Switch
                        checked={profile.notify_ocr_failed ?? true}
                        onCheckedChange={async (checked) => {
                          setProfile({ ...profile, notify_ocr_failed: checked });

                          const { error } = await supabase
                            .from('profiles')
                            .update({ notify_ocr_failed: checked })
                            .eq('id', profile.id);

                          if (error) {
                            logger.error(LogCategory.DATABASE, 'Failed to update notification preference', error, {
                              userId: profile.id,
                            });
                            toast({
                              title: 'Error',
                              description: 'Failed to update notification preference',
                              variant: 'destructive',
                            });
                          } else {
                            logger.info(LogCategory.USER_ACTION, 'User toggled OCR failed notifications', {
                              userId: profile.id,
                              enabled: checked,
                            });
                            toast({
                              title: 'Success',
                              description: `OCR failed notifications ${checked ? 'enabled' : 'disabled'}`,
                            });
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your new password below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPasswordOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                className="bg-primary hover:bg-primary-hover text-white"
              >
                Change Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">Delete Account</DialogTitle>
              <DialogDescription>
                This action cannot be undone. All your documents and data will be
                permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="deleteConfirm">
                Type DELETE to confirm
              </Label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </div>
  );
}