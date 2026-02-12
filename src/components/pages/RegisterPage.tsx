// app/register/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { LogCategory, logger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companySize: '',
    useCase: '',
  });

  const companySizes = t('auth.register.companySizes') as string[];

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: t('auth.register.errors.passwordMismatch'),
        variant: 'destructive',
      });
      logger.authFailed(formData.email, 'Password mismatch (client-side validation)');
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: t('auth.register.errors.passwordTooShort'),
        variant: 'destructive',
      });
      logger.authFailed(formData.email, 'Password too short (client-side validation)');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            company_size: formData.companySize,
            use_case: formData.useCase,
          },
        },
      });

       trackEvent('Click Request Beta Access', {
            button_name:'Request Beta Access',
            button_location: 'Register Page',
          });

      if (authError) {
        let errorMessage = t('auth.register.errors.genericError');

        if (authError.message.includes('User already registered') || 
            authError.message.includes('already registered')) {
          errorMessage = t('auth.register.errors.emailExists');
        } else if (authError.message.includes('invalid email')) {
          errorMessage = t('auth.register.errors.invalidEmail');
        } else if (authError.message.includes('network') || 
                   authError.message.includes('fetch')) {
          errorMessage = t('auth.register.errors.networkError');
        }

        toast({
          title: 'Registration Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        logger.authFailed(formData.email, authError);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast({
          title: 'Error',
          description: 'Failed to create user account',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const userId = authData.user.id;

      // Step 2: Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: formData.fullName,
        company_name: formData.companyName || null,
        company_size: formData.companySize || null,
        use_case: formData.useCase || null,
        language: 'en',
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        logger.error(LogCategory.DATABASE, 'Failed to create profile', profileError, { userId });
      }

      // Step 3: Create initial subscription record (no Stripe yet)
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'trial',
          status: 'expired',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          auto_renew: true,
        });

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError);
        logger.error(LogCategory.DATABASE, 'Failed to create subscription', subscriptionError, { userId });
      }

      // Step 4: Send welcome email (non-blocking)
      try {
        await fetch('/api/auth/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email,
            name: formData.fullName 
          }),
        });
      } catch (emailError) {
        console.error('Welcome email error:', emailError);
      }

      // Step 5: Log successful registration
      logger.userRegistered(userId, formData.email, {
        fullName: formData.fullName,
        companyName: formData.companyName,
        companySize: formData.companySize,
        useCase: formData.useCase,
      });

      // Step 6: Show success message
      toast({
        title: '🎉 Welcome to SnappArchive!',
        description: 'Choose your plan to start your 14-day free trial',
        variant: 'default',
      });

      // Step 7: Redirect to pricing page after short delay
      setTimeout(() => {
        router.push('/pricing?welcome=true');
      }, 1000);

    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMessage = t('auth.register.errors.genericError');
      if (error.message) {
        if (error.message.includes('User already registered') || 
            error.message.includes('already registered')) {
          errorMessage = t('auth.register.errors.emailExists');
        } else if (error.message.includes('network') || 
                   error.message.includes('fetch')) {
          errorMessage = t('auth.register.errors.networkError');
        }
      }

      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      logger.authFailed(formData.email, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('auth.register.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('auth.register.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="fullName" className="text-base font-semibold">
                {t('auth.register.fullName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                required
                disabled={isLoading}
                className="mt-2 h-12 text-base"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-base font-semibold">
                {t('auth.register.email')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                disabled={isLoading}
                className="mt-2 h-12 text-base"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-base font-semibold">
                {t('auth.register.password')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                disabled={isLoading}
                className="mt-2 h-12 text-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 characters
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-base font-semibold">
                {t('auth.register.confirmPassword')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                disabled={isLoading}
                className="mt-2 h-12 text-base"
              />
            </div>

            <div>
              <Label htmlFor="companyName" className="text-base font-semibold">
                {t('auth.register.companyName')}
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Your Company Inc."
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                disabled={isLoading}
                className="mt-2 h-12 text-base"
              />
            </div>

            <div>
              <Label htmlFor="companySize" className="text-base font-semibold">
                {t('auth.register.companySize')}
              </Label>
              <Select
                value={formData.companySize}
                onValueChange={(value) => handleChange('companySize', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="mt-2 h-12 text-base">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="useCase" className="text-base font-semibold">
                {t('auth.register.useCase')}
              </Label>
              <Textarea
                id="useCase"
                placeholder="Tell us about your document workflows, challenges, or specific needs..."
                value={formData.useCase}
                onChange={(e) => handleChange('useCase', e.target.value)}
                disabled={isLoading}
                className="mt-2 min-h-32 text-base"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-primary hover:bg-primary-hover text-white text-lg font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating your account...
                </>
              ) : (
                t('auth.register.submit')
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                disabled={isLoading}
                className="text-primary hover:underline font-medium"
              >
                {t('nav.login')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}