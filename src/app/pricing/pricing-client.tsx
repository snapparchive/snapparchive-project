 
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Check, Loader2, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check if this is a welcome redirect
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
      loadUserName();
    }
  }, [searchParams]);

  const loadUserName = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setUserName(profile.full_name || 'there');
      }
    }
  };

  const plans = [
    {
      name: 'Core',
      price: '€29',
      priceId: 'price_1SmtzbBMb6Cwfb8eog2DUUx5',
      period: 'per month',
      description: 'Best for individuals and freelancers',
      features: [
        'Up to 200 documents processed per month across all dossiers',
        'OCR text extraction',
        'Basic auto-tagging',
        'Assisted folder organization',
        'Full-text search',
        '15 GB storage',
        'Email support',
      ],
    },
    {
      name: 'Pro',
      price: '€49',
      priceId: 'price_1Smu4HBMb6Cwfb8eUxrFwHDz',
      period: 'per month',
      description: 'Best for growing professionals and small businesses',
      features: [
        'Up to 400 documents processed per month across all dossiers',
        'Everything in Core, plus:',
        'Enhanced auto-tagging',
        'Advanced search & filters',
        '50 GB storage',
        'Priority support',
      ],
      popular: true,
    },
    {
      name: 'Business',
      price: '€79',
      priceId: 'price_1Smu6OBMb6Cwfb8eLFLYymnP',
      period: 'per month',
      description: 'For serious SMB usage',
      features: [
        'Up to 700 documents processed per month across all dossiers',
        'Everything in Pro, plus:',
        'Highest monthly processing limits',
        '100 GB storage',
        'Business-grade support',
      ],
    },
  ];

  const faqs = [
    {
      question: 'What happens after my free trial?',
      answer:
        'Your 14-day free trial gives you full access to your selected plan. After the trial ends, you can choose a paid plan to continue using SnappArchive.',
    },
    {
      question: 'Can I change plans later?',
      answer:
        "Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the end of the running billing period and billing is handled automatically.",
    },
    {
      question: 'Do you offer refunds?',
      answer:
        'You can cancel your subscription at any time. Refund requests are handled on a case-by-case basis in accordance with our terms.',
    },
    {
      question: 'What happens if I exceed my monthly document limit?',
      answer:
        'Additional documents are processed automatically and billed at €0.15 per document.',
    },
    {
      question: 'Is annual billing available?',
      answer: 'Annual plans are planned for a future release.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'Payments are securely processed via Stripe using major credit cards and SEPA direct debit (EU).',
    },
    {
      question: 'Is my payment information secure?',
      answer:
        'Yes. All payments are processed by Stripe, which is PCI-DSS Level 1 certified. We never store credit card details on our servers.',
    },
    {
      question: 'What happens to my documents if I cancel?',
      answer:
        'Your documents remain accessible for 30 days after cancellation. After that period, all data is permanently deleted in accordance with GDPR.',
    },
  ];

  const handleStartTrial = async (priceId: string) => {
    setLoadingPlan(priceId);

    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to start your free trial',
        });
        trackEvent('click Start Free Trial', {
              button_name:'Start Free Trial',
              button_location: 'Pricing Page',
            });
        router.push('/login?redirect=/pricing');
        return;
      }

      // Create checkout session via API route
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?trial_started=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start checkout process',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <div className="bg-gradient-to-br from-primary to-[#0891b2] text-white py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-4">
                Simple, Transparent Pricing
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto px-4">
  Simple pricing for managing your work per dossier. All plans include unlimited dossiers, with fair limits on document processing and storage.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-12 sm:py-16 lg:py-20">
          {/* Welcome Banner for New Users */}
          {showWelcome && (
            <Alert className="mb-8 border-2 border-primary bg-gradient-to-r from-blue-50 to-cyan-50">
              <Sparkles className="h-5 w-5 text-primary" />
              <AlertTitle className="text-xl font-bold text-gray-900">
                Welcome to SnappArchive, {userName}! 🎉
              </AlertTitle>
              <AlertDescription className="text-gray-700 mt-2">
                <p className="mb-2">
                  Your account has been created successfully! Now choose a plan to start your
                  <strong> 14-day free trial</strong> with full access to all features.
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Full feature access</span>
                  </div>
                </div>
              </AlertDescription>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWelcome(false)}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 bg-white rounded-2xl border-2 ${
                  plan.popular
                    ? 'border-[#04a3c3] shadow-2xl scale-105'
                    : 'border-gray-200'
                } transition-all hover:shadow-lg`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-3">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 text-lg">/{plan.period.split(' ')[1]}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <Button
                  className={`w-full mb-6 h-12 text-base font-semibold ${
                    plan.popular
                      ? 'bg-primary hover:bg-primary-hover text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                  onClick={() => handleStartTrial(plan.priceId)}
                  disabled={loadingPlan === plan.priceId}
                >
                  {loadingPlan === plan.priceId ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Start Free Trial'
                  )}
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 mb-20">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Important Billing Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>Additional documents are billed at €0.15 per document</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>All prices exclude VAT, which is added at checkout based on your location</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>14-day free trial on all plans with full feature access</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>Card details collected during trial, charged after 14 days</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>Cancel anytime with no penalties or cancellation fees</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>Manage your subscription easily through the customer portal</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to know about pricing and billing
              </p>
            </div>

            <Accordion type="single" collapsible className="bg-white rounded-2xl border border-gray-200 p-6">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-20 bg-gradient-to-br from-primary to-[#0891b2] rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-6">Still Have Questions?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Our team is here to help you choose the right plan for your business.
            </p>
            <Button
              className="bg-white text-primary text-lg px-8 py-6 hover:bg-gray-100"
              onClick={() => (window.location.href = 'mailto:support@snapparchive.eu')}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}