'use client';

import { useState, useEffect } from 'react';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CookiePreferencesModal } from '@/components/footerpages/CookiePreferencesModal';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  timestamp: number;
}

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    timestamp: 0,
  });

  useEffect(() => {
    const checkConsent = () => {
      try {
        const storedConsent = localStorage.getItem('cookie_consent');
        
        if (!storedConsent) {
          setShowBanner(true);
          return;
        }

        const consent: CookiePreferences = JSON.parse(storedConsent);
        const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);

        if (consent.timestamp < oneYearAgo) {
          setShowBanner(true);
          return;
        }

        setPreferences(consent);
        
        if (consent.analytics) {
          initializeAnalytics();
        }
      } catch (error) {
        console.error('Error checking cookie consent:', error);
        setShowBanner(true);
      }
    };

    checkConsent();
  }, []);

  const initializeAnalytics = () => {
    console.log('Analytics initialized with user consent');
    // Add your analytics initialization here
    // Example: window.gtag?.('config', 'GA_MEASUREMENT_ID');
  };

  const saveConsent = (prefs: Partial<CookiePreferences>) => {
    const newPreferences: CookiePreferences = {
      essential: true,
      analytics: prefs.analytics ?? false,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('cookie_consent', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      setShowBanner(false);
      setShowModal(false);

      if (newPreferences.analytics) {
        initializeAnalytics();
      }
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    }
  };

  const handleAcceptAll = () => {
    saveConsent({ analytics: true });
  };

  const handleAcceptEssential = () => {
    saveConsent({ analytics: false });
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {showBanner && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />

          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border-2 border-gray-200">
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Cookie className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                      We Value Your Privacy
                    </h3>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                      SnappArchive uses essential cookies to provide secure authentication and core functionality. 
                      We'd also like to use optional analytics cookies to improve our services. You can choose which 
                      cookies to accept below.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Essential Cookies (Always Active)</p>
                      <p className="text-gray-600 text-xs mt-1">
                        Required for login, security, and core functionality. These cannot be disabled.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Cookie className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Analytics Cookies (Optional)</p>
                      <p className="text-gray-600 text-xs mt-1">
                        Help us understand usage patterns and improve the service. All data is anonymized and GDPR-compliant.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 text-base font-medium"
                  >
                    Accept All Cookies
                  </Button>
                  <Button
                    onClick={handleAcceptEssential}
                    variant="outline"
                    className="flex-1 border-2 py-3 text-base font-medium"
                  >
                    Essential Only
                  </Button>
                  <Button
                    onClick={handleOpenModal}
                    variant="ghost"
                    className="sm:w-auto py-3 text-base font-medium"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Customize
                  </Button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  By using our services, you agree to our{' '}
                  <a href="/cookiepolicy" className="text-primary hover:underline">
                    Cookie Policy
                  </a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cookie Preferences Modal */}
      <CookiePreferencesModal 
        isOpen={showModal} 
        onClose={handleCloseModal} 
      />
    </>
  );
}