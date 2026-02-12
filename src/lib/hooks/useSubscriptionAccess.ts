// // lib/hooks/useSubscriptionAccess.ts

// import { useEffect, useState } from 'react';
// import { supabase } from '@/lib/supabase';
// import { useToast } from '@/hooks/use-toast';

// export interface SubscriptionAccess {
//   canUpload: boolean;
//   canEdit: boolean;
//   canDelete: boolean;
//   canMove: boolean;
//   isActive: boolean;
//   autoRenew: boolean;
//   status: string;
//   plan: string;
//   isLoading: boolean;
//   warningMessage: string | null;
// }

// export function useSubscriptionAccess() {
//   const { toast } = useToast();
//   const [access, setAccess] = useState<SubscriptionAccess>({
//     canUpload: false,
//     canEdit: false,
//     canDelete: false,
//     canMove: false,
//     isActive: false,
//     autoRenew: false,
//     status: 'unknown',
//     plan: 'free',
//     isLoading: true,
//     warningMessage: null,
//   });

//   const checkAccess = async () => {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         setAccess(prev => ({ ...prev, isLoading: false }));
//         return;
//       }

//       const { data: subscription, error } = await supabase
//         .from('subscriptions')
//         .select('*')
//         .eq('user_id', session.user.id)
//         .maybeSingle();

//       if (error) {
//         console.error('Error fetching subscription:', error);
//         setAccess(prev => ({ ...prev, isLoading: false }));
//         return;
//       }

//       // No subscription = free tier (read-only)
//       if (!subscription) {
//         setAccess({
//           canUpload: false,
//           canEdit: false,
//           canDelete: false,
//           canMove: false,
//           isActive: false,
//           autoRenew: false,
//           status: 'none',
//           plan: 'free',
//           isLoading: false,
//           warningMessage: 'Please subscribe to a plan to upload and manage documents.',
//         });
//         return;
//       }

//       const today = new Date();
//       const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
//       const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
      
//       const isTrialActive = trialEndsAt ? today < trialEndsAt : false;
//       const isPeriodActive = currentPeriodEnd ? today < currentPeriodEnd : false;

//       const isActive = subscription.status === 'active';
//       const autoRenew = subscription.auto_renew === true;

//       // 🐛 DEBUG: Check subscription values
//       console.log('Subscription Debug:', {
//         status: subscription.status,
//         isActive,
//         trialEndsAt: trialEndsAt?.toISOString(),
//         currentPeriodEnd: currentPeriodEnd?.toISOString(),
//         isTrialActive,
//         isPeriodActive,
//         autoRenew,
//         today: today.toISOString()
//       });

//       let canPerformActions = false;
//       let warningMessage: string | null = null;

//       // ✅ DURING TRIAL: Full access regardless of toggle
//       if (isTrialActive) {
//         console.log('✅ Condition: DURING TRIAL');
//         canPerformActions = true;
//         if (!autoRenew) {
//           warningMessage = `You are on a free trial until ${trialEndsAt?.toDateString()}. Enable auto-renewal to continue access after trial ends.`;
//         } else {
//           warningMessage = `You are on a free trial until ${trialEndsAt?.toDateString()}. Full access is enabled.`;
//         }
//       }
//       // ✅ DURING ACTIVE PAID PERIOD: Full access regardless of toggle
//       else if (isPeriodActive && isActive) {
//         console.log('✅ Condition: DURING ACTIVE PAID PERIOD');
//         canPerformActions = true;
//         if (!autoRenew) {
//           warningMessage = `Your subscription is active until ${currentPeriodEnd?.toDateString()}. Enable auto-renewal to continue access after this period ends.`;
//         } else {
//           warningMessage = null; // No warning needed, everything is good
//         }
//       }
//       // ✅ ACTIVE SUBSCRIPTION without period end (newly subscribed or period not set)
//       else if (isActive && subscription.plan !== 'trial' && subscription.plan !== 'free') {
//         console.log('✅ Condition: ACTIVE PAID PLAN (no period end set)', subscription.plan);
//         // If subscription is active and it's a paid plan, grant access regardless of current_period_end
//         canPerformActions = true;
//         if (!autoRenew) {
//           warningMessage = 'Your subscription is active. Enable auto-renewal to ensure continued access.';
//         } else {
//           warningMessage = null;
//         }
//       }
//       // ❌ AFTER TRIAL/PERIOD ENDS: Toggle controls access
//       else {
//         console.log('❌ Condition: AFTER TRIAL/PERIOD ENDS');
//         if (isActive && autoRenew) {
//           // Grace period: they can re-enable and get access back
//           canPerformActions = true;
//           warningMessage = 'Your plan has ended but auto-renewal is enabled. Access restored.';
//         } else {
//           // No access - they need to enable auto-renewal
//           canPerformActions = false;
//           warningMessage = 'Your subscription has ended. Enable auto-renewal to regain full access.';
//         }
//       }

//       console.log('🎯 Final Access Decision:', {
//         canPerformActions,
//         warningMessage,
//         plan: subscription.plan
//       });

//       setAccess({
//         canUpload: canPerformActions,
//         canEdit: canPerformActions,
//         canDelete: canPerformActions,
//         canMove: canPerformActions,
//         isActive,
//         autoRenew,
//         status: subscription.status,
//         plan: subscription.plan,
//         isLoading: false,
//         warningMessage,
//       });
//     } catch (error) {
//       console.error('Error checking subscription access:', error);
//       setAccess(prev => ({ ...prev, isLoading: false }));
//     }
//   };

//   useEffect(() => {
//     checkAccess();

//     const channel = supabase
//       .channel('subscription-changes')
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'subscriptions',
//         },
//         () => {
//           checkAccess();
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   const showAccessDeniedToast = (action: string = 'perform this action') => {
//     toast({
//       title: 'Feature Restricted',
//       description: access.warningMessage || `You need an active subscription to ${action}.`,
//       variant: 'destructive',
//     });
//   };

//   return {
//     ...access,
//     refresh: checkAccess,
//     showAccessDeniedToast,
//   };
// }

// lib/hooks/useSubscriptionAccess.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionAccess {
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canMove: boolean;
  isActive: boolean;
  autoRenew: boolean;
  status: string;
  plan: string;
  isLoading: boolean;
  warningMessage: string | null;
  // Plan limits
  monthlyLimit?: number;
  documentsThisMonth?: number;
  documentsRemaining?: number;
  storageLimitGB?: number;
  storageUsedGB?: number;
  storageUsedPercent?: number;
  canUploadMore?: boolean;
}

export function useSubscriptionAccess() {
  const { toast } = useToast();
  const [access, setAccess] = useState<SubscriptionAccess>({
    canUpload: false,
    canEdit: false,
    canDelete: false,
    canMove: false,
    isActive: false,
    autoRenew: false,
    status: 'unknown',
    plan: 'free',
    isLoading: true,
    warningMessage: null,
  });

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAccess(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        setAccess(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // No subscription = free tier (read-only)
      if (!subscription) {
        setAccess({
          canUpload: false,
          canEdit: false,
          canDelete: false,
          canMove: false,
          isActive: false,
          autoRenew: false,
          status: 'none',
          plan: 'free',
          isLoading: false,
          warningMessage: 'Please subscribe to a plan to upload and manage documents.',
        });
        return;
      }

      const today = new Date();
      const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
      const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
      
      const isTrialActive = trialEndsAt ? today < trialEndsAt : false;
      const isPeriodActive = currentPeriodEnd ? today < currentPeriodEnd : false;

      const isActive = subscription.status === 'active';
      const autoRenew = subscription.auto_renew === true;

      // 🐛 DEBUG: Check subscription values
      console.log('Subscription Debug:', {
        status: subscription.status,
        isActive,
        trialEndsAt: trialEndsAt?.toISOString(),
        currentPeriodEnd: currentPeriodEnd?.toISOString(),
        isTrialActive,
        isPeriodActive,
        autoRenew,
        today: today.toISOString()
      });

      let canPerformActions = false;
      let warningMessage: string | null = null;

      // ✅ DURING TRIAL: Full access regardless of toggle
      if (isTrialActive) {
        console.log('✅ Condition: DURING TRIAL');
        canPerformActions = true;
        if (!autoRenew) {
          warningMessage = `You are on a free trial until ${trialEndsAt?.toDateString()}. Enable auto-renewal to continue access after trial ends.`;
        } else {
          warningMessage = `You are on a free trial until ${trialEndsAt?.toDateString()}. Full access is enabled.`;
        }
      }
      // ✅ DURING ACTIVE PAID PERIOD: Full access regardless of toggle
      else if (isPeriodActive && isActive) {
        console.log('✅ Condition: DURING ACTIVE PAID PERIOD');
        canPerformActions = true;
        if (!autoRenew) {
          warningMessage = `Your subscription is active until ${currentPeriodEnd?.toDateString()}. Enable auto-renewal to continue access after this period ends.`;
        } else {
          warningMessage = null; // No warning needed, everything is good
        }
      }
      // ✅ ACTIVE SUBSCRIPTION without period end (newly subscribed or period not set)
      else if (isActive && subscription.plan !== 'trial' && subscription.plan !== 'free') {
        console.log('✅ Condition: ACTIVE PAID PLAN (no period end set)', subscription.plan);
        // If subscription is active and it's a paid plan, grant access regardless of current_period_end
        canPerformActions = true;
        if (!autoRenew) {
          warningMessage = 'Your subscription is active. Enable auto-renewal to ensure continued access.';
        } else {
          warningMessage = null;
        }
      }
      // ❌ AFTER TRIAL/PERIOD ENDS: Toggle controls access
      else {
        console.log('❌ Condition: AFTER TRIAL/PERIOD ENDS');
        if (isActive && autoRenew) {
          // Grace period: they can re-enable and get access back
          canPerformActions = true;
          warningMessage = 'Your plan has ended but auto-renewal is enabled. Access restored.';
        } else {
          // No access - they need to enable auto-renewal
          canPerformActions = false;
          warningMessage = 'Your subscription has ended. Enable auto-renewal to regain full access.';
        }
      }

      console.log('🎯 Final Access Decision:', {
        canPerformActions,
        warningMessage,
        plan: subscription.plan
      });

      // Check upload limits via database function
      const { data: uploadCheck } = await supabase
        .rpc('can_user_upload_document', {
          user_id_param: session.user.id
        });

      const canUploadMore = uploadCheck?.canUpload || false;
      const limitWarning = !canUploadMore ? uploadCheck?.message : null;

      setAccess({
        canUpload: canPerformActions && canUploadMore,
        canEdit: canPerformActions,
        canDelete: canPerformActions,
        canMove: canPerformActions,
        isActive,
        autoRenew,
        status: subscription.status,
        plan: subscription.plan,
        isLoading: false,
        warningMessage: limitWarning || warningMessage,
        // Plan limits
        monthlyLimit: uploadCheck?.monthlyLimit || 0,
        documentsThisMonth: uploadCheck?.documentsThisMonth || 0,
        documentsRemaining: uploadCheck?.documentsRemainingThisMonth || 0,
        storageLimitGB: uploadCheck?.storageLimitGB || 0,
        storageUsedGB: uploadCheck?.currentStorageGB || 0,
        storageUsedPercent: uploadCheck?.storageUsedPercent || 0,
        canUploadMore,
      });
    } catch (error) {
      console.error('Error checking subscription access:', error);
      setAccess(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    checkAccess();

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
        },
        () => {
          checkAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showAccessDeniedToast = (action: string = 'perform this action') => {
    toast({
      title: 'Feature Restricted',
      description: access.warningMessage || `You need an active subscription to ${action}.`,
      variant: 'destructive',
    });
  };

  return {
    ...access,
    refresh: checkAccess,
    showAccessDeniedToast,
  };
}