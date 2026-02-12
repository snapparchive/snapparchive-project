// components/subscription/SubscriptionWarningBanner.tsx

'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSubscriptionAccess } from '@/lib/hooks/useSubscriptionAccess';
import { trackEvent } from '@/lib/analytics';

export function SubscriptionWarningBanner() {
  const router = useRouter();
  const { warningMessage, isActive, autoRenew, isLoading } = useSubscriptionAccess();

  // Don't show if loading or no warning
  if (isLoading || !warningMessage) {
    return null;
  }

  // Determine alert variant and color
  const isUrgent = !isActive || (!autoRenew && isActive);
  const manageSubscription = () => {
    trackEvent('click_manage_Subscription_banner', {
      button_name: 'Manage Subscription',
      button_location: 'manage_Subscription_banner',
    });
    router.push('/dashboard/settings');
  }

  return (
    <Alert
      className={
        isUrgent
          ? 'border-orange-500 bg-orange-50'
          : 'border-yellow-500 bg-yellow-50'
      }
    >
      <AlertCircle className={`h-5 w-5 ${isUrgent ? 'text-orange-600' : 'text-yellow-600'}`} />
      <AlertTitle className={`${isUrgent ? 'text-orange-800' : 'text-yellow-800'} font-semibold`}>
        {isActive && !autoRenew ? 'Limited Access Mode' : 'Subscription Required'}
      </AlertTitle>
      <AlertDescription className={`${isUrgent ? 'text-orange-700' : 'text-yellow-700'} flex items-start justify-between gap-4`}>
        <span>{warningMessage}</span>
        <Button
          size="sm"
          onClick={manageSubscription}
          className="flex-shrink-0 bg-primary hover:bg-primary-hover text-white"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Manage Subscription
        </Button>
      </AlertDescription>
    </Alert>
  );
}