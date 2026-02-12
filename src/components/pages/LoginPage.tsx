'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { logger, LogCategory } from '@/lib/logger';
import { AlertCircle } from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Check for lockout on component mount and when email changes
  useEffect(() => {
    checkLockoutStatus();
  }, [formData.email]);

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setShowResetSuccess(true);
      setTimeout(() => setShowResetSuccess(false), 5000);
    }
  }, [searchParams]);

  // Timer effect for countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLocked && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            setIsLocked(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLocked, remainingTime]);

  const checkLockoutStatus = () => {
    if (!formData.email) return;

    const lockoutKey = `login_lockout_${formData.email}`;
    const attemptsKey = `login_attempts_${formData.email}`;
    
    const lockoutData = localStorage.getItem(lockoutKey);
    
    if (lockoutData) {
      const { lockedUntil } = JSON.parse(lockoutData);
      const now = Date.now();
      
      if (now < lockedUntil) {
        setIsLocked(true);
        setRemainingTime(lockedUntil - now);
      } else {
        // Lockout expired, clear data
        localStorage.removeItem(lockoutKey);
        localStorage.removeItem(attemptsKey);
        setIsLocked(false);
        setRemainingTime(0);
      }
    }
  };

  const recordFailedAttempt = () => {
    const attemptsKey = `login_attempts_${formData.email}`;
    const lockoutKey = `login_lockout_${formData.email}`;
    
    let attempts = 0;
    const attemptsData = localStorage.getItem(attemptsKey);
    
    if (attemptsData) {
      const { count, firstAttempt } = JSON.parse(attemptsData);
      attempts = count + 1;
      
      // Store updated attempts
      localStorage.setItem(attemptsKey, JSON.stringify({
        count: attempts,
        firstAttempt: firstAttempt || Date.now()
      }));
    } else {
      attempts = 1;
      localStorage.setItem(attemptsKey, JSON.stringify({
        count: 1,
        firstAttempt: Date.now()
      }));
    }

    // Check if we've hit the max attempts
    if (attempts >= MAX_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCKOUT_DURATION;
      localStorage.setItem(lockoutKey, JSON.stringify({
        lockedUntil,
        attempts
      }));
      
      setIsLocked(true);
      setRemainingTime(LOCKOUT_DURATION);
      
      // Clear attempts after lockout
      localStorage.removeItem(attemptsKey);
      
      return true; // Account is now locked
    }

    return false; // Not locked yet
  };

  const clearLoginAttempts = () => {
    const attemptsKey = `login_attempts_${formData.email}`;
    const lockoutKey = `login_lockout_${formData.email}`;
    localStorage.removeItem(attemptsKey);
    localStorage.removeItem(lockoutKey);
  };

  const getRemainingAttempts = () => {
    const attemptsKey = `login_attempts_${formData.email}`;
    const attemptsData = localStorage.getItem(attemptsKey);
    
    if (attemptsData) {
      const { count } = JSON.parse(attemptsData);
      return MAX_ATTEMPTS - count;
    }
    
    return MAX_ATTEMPTS;
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if account is locked
    if (isLocked) {
      toast({
        title: 'Account Temporarily Locked',
        description: `Too many failed attempts. Try again in ${formatTime(remainingTime)}`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // Record failed attempt
        const isNowLocked = recordFailedAttempt();
        
        // Log authentication failure
        logger.authFailed(formData.email, error);
        
        let errorMessage = t('auth.login.errors.genericError');
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = t('auth.login.errors.invalidCredentials');
          
          if (!isNowLocked) {
            const remaining = getRemainingAttempts();
            errorMessage += ` (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)`;
          }
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = t('auth.login.errors.emailNotConfirmed');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = t('auth.login.errors.networkError');
        }

        if (isNowLocked) {
          errorMessage = `Account locked due to too many failed attempts. Try again in ${formatTime(LOCKOUT_DURATION)}`;
          // Log account lockout
          logger.accountLocked(formData.email, LOCKOUT_DURATION);
        }

        toast({
          title: 'Login Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      // Success - clear any failed attempts
      clearLoginAttempts();
      
      toast({
        title: 'Success!',
        description: t('auth.login.success'),
        variant: 'default',
      });

      // Log successful login
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (session) {
        logger.userLogin(session.user.id, formData.email);
        
        // Check subscription status after successful login
        try {
          const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', session.user.id)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle no record case

          // Check for redirect parameter in URL
          const redirectTo = searchParams.get('redirect');

          // If user has active subscription, redirect to dashboard (or redirect param if provided)
          // Otherwise, redirect to pricing page
          if (subscription && subscription.status === 'active') {
            // User has active subscription - go to dashboard or redirect param
            if (redirectTo) {
              router.push(redirectTo);
            } else {
              router.push('/dashboard');
            }
          } else {
            // No subscription record, subscription not active, or error occurred - redirect to pricing
            // If there's a redirect param, append it to pricing URL
            if (redirectTo) {
              router.push(`/pricing?redirect=${encodeURIComponent(redirectTo)}`);
            } else {
              router.push('/pricing');
            }
          }
        } catch (error) {
          // If subscription check fails, assume no subscription and redirect to pricing
          console.error('Error checking subscription:', error);
          const redirectTo = searchParams.get('redirect');
          if (redirectTo) {
            router.push(`/pricing?redirect=${encodeURIComponent(redirectTo)}`);
          } else {
            router.push('/pricing');
          }
        }
      } else {
        // Fallback if no session (shouldn't happen, but safety check)
        router.push('/pricing');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Record failed attempt
      const isNowLocked = recordFailedAttempt();
      
      // Log the error
      logger.error(LogCategory.AUTH, 'Login error occurred', error);
      
      let errorMessage = t('auth.login.errors.genericError');
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = t('auth.login.errors.invalidCredentials');
          
          if (!isNowLocked) {
            const remaining = getRemainingAttempts();
            errorMessage += ` (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)`;
          }
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = t('auth.login.errors.networkError');
        }
      }

      if (isNowLocked) {
        errorMessage = `Account locked due to too many failed attempts. Try again in ${formatTime(LOCKOUT_DURATION)}`;
        // Log account lockout
        logger.accountLocked(formData.email, LOCKOUT_DURATION);
      }

      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('auth.login.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('auth.login.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {showResetSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  Password reset successfully! You can now log in with your new password.
                </AlertDescription>
              </Alert>
            )}

            {isLocked && (
              <Alert variant="destructive" className="bg-red-50 border-red-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-semibold">
                  Account temporarily locked due to multiple failed login attempts. 
                  Please try again in {formatTime(remainingTime)}.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="email" className="text-base font-semibold">
                {t('auth.login.email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                disabled={isLocked}
                className="mt-2 h-12 text-base"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-base font-semibold">
                {t('auth.login.password')}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                disabled={isLocked}
                className="mt-2 h-12 text-base"
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-sm text-primary hover:underline"
                disabled={isLocked}
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full h-14 bg-primary hover:bg-primary-hover text-white text-lg font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : isLocked ? `Locked (${formatTime(remainingTime)})` : t('auth.login.submit')}
            </Button>

            <div className="text-center text-sm text-gray-600">
              {t('auth.login.noAccount')}{' '}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-primary hover:underline font-medium"
              >
                {t('auth.login.signUp')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}