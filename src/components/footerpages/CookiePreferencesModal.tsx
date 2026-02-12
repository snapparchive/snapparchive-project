'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, CheckCircle, Shield, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CookiePreferences {
  essential: boolean;
  security: boolean;
  analytics: boolean;
  timestamp: number;
}

export function CookiePreferencesModal({ isOpen, onClose }: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    security: true,
    analytics: false,
    timestamp: 0,
  });

  useEffect(() => {
    if (isOpen) {
      try {
        const storedConsent = localStorage.getItem('cookie_consent');
        if (storedConsent) {
          const consent = JSON.parse(storedConsent);
          setPreferences({
            essential: true,
            security: consent.security ?? true,
            analytics: consent.analytics ?? false,
            timestamp: consent.timestamp || 0,
          });
        }
      } catch (error) {
        console.error('Error loading cookie preferences:', error);
      }
    }
  }, [isOpen]);

  const handleToggle = (key: 'security' | 'analytics') => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const savePreferences = (prefs: CookiePreferences) => {
    try {
      const consentData = {
        essential: true,
        security: prefs.security,
        analytics: prefs.analytics,
        timestamp: Date.now(),
      };
      
      localStorage.setItem('cookie_consent', JSON.stringify(consentData));
      console.log('Cookie preferences saved:', consentData);
      
      // Initialize analytics if enabled
      if (consentData.analytics) {
        console.log('Analytics initialized with user consent');
        // Add your analytics initialization here
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving cookie preferences:', error);
    }
  };

  const handleSave = () => {
    savePreferences(preferences);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      security: true,
      analytics: true,
      timestamp: Date.now(),
    };
    savePreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      security: false,
      analytics: false,
      timestamp: Date.now(),
    };
    savePreferences(essentialOnly);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Cookie className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">Cookie Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 sm:p-2 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Introduction */}
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            We use cookies to ensure the platform works properly and to improve your experience. You can choose which categories of cookies to enable. Essential cookies are required for core functionality and cannot be disabled.{' '}
            <a href="/cookiepolicy" className="text-blue-600 hover:text-blue-700 underline">
              Read our full Cookie Policy
            </a>
          </p>

          {/* Essential Cookies */}
          <div className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 bg-gray-50">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="bg-blue-100 rounded-lg p-1.5 sm:p-2 flex-shrink-0">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Essential Cookies</h3>
                    <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                      Always Active
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative inline-block w-11 h-6 sm:w-12 bg-blue-600 rounded-full cursor-not-allowed opacity-60 flex-shrink-0">
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform translate-x-5 sm:translate-x-6" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 ml-0 sm:ml-11">
              Required for login, authentication, security (CSRF protection), session management, and core platform functionality. These cookies cannot be disabled as the Services would not function without them.
            </p>
            <p className="text-xs text-gray-500 ml-0 sm:ml-11">
              <span className="font-semibold">Legal Basis:</span> GDPR Art. 6(1)(b) — Necessary for contract performance
            </p>
          </div>

          {/* Security Cookies */}
          <div className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 bg-white">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="bg-gray-100 rounded-lg p-1.5 sm:p-2 flex-shrink-0">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Security Cookies</h3>
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                      Recommended
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('security')}
                className="relative inline-block w-11 h-6 sm:w-12 flex-shrink-0"
                aria-label="Toggle security cookies"
              >
                <div className={`absolute inset-0 rounded-full transition-colors ${
                  preferences.security ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  preferences.security ? 'transform translate-x-5 sm:translate-x-6' : ''
                }`} />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 ml-0 sm:ml-11">
              Detect and prevent fraudulent activity, brute-force attacks, unauthorized access, and security threats. These cookies help protect your account and our platform from malicious activity.
            </p>
            <p className="text-xs text-gray-500 ml-0 sm:ml-11">
              <span className="font-semibold">Legal Basis:</span> GDPR Art. 6(1)(f) — Legitimate interests in security
            </p>
          </div>

          {/* Analytics Cookies */}
          <div className="border-2 border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-5 bg-purple-50">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="bg-purple-100 rounded-lg p-1.5 sm:p-2 flex-shrink-0">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Analytics Cookies</h3>
                    <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                      <span className="inline-block w-2 h-2 rounded-full bg-purple-600" />
                      Requires Consent
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('analytics')}
                className="relative inline-block w-11 h-6 sm:w-12 flex-shrink-0"
                aria-label="Toggle analytics cookies"
              >
                <div className={`absolute inset-0 rounded-full transition-colors ${
                  preferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  preferences.analytics ? 'transform translate-x-5 sm:translate-x-6' : ''
                }`} />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 ml-0 sm:ml-11">
              Help us understand how users interact with our Services through privacy-friendly, anonymized analytics. We measure page views, feature usage, and performance to improve your experience. No cross-site tracking or advertising. Data stored exclusively in the EU.
            </p>
            <p className="text-xs text-gray-500 ml-0 sm:ml-11">
              <span className="font-semibold">Legal Basis:</span> GDPR Art. 6(1)(a) — Consent (required)
            </p>
          </div>

          {/* Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold">Note:</span> Your consent is valid for 6 months. After this period, we will ask for your consent again. You can change your preferences at any time via the "Cookie Settings" link in the footer or by contacting us at hello@snapparchive.eu.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={handleRejectAll}
            variant="outline"
            className="w-full sm:w-auto sm:flex-none text-sm"
          >
            Reject All
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:ml-auto">
            <Button
              onClick={handleSave}
              variant="outline"
              className="w-full sm:w-auto sm:flex-none text-sm"
            >
              Save Preferences
            </Button>
            <Button
              onClick={handleAcceptAll}
              className="w-full sm:w-auto sm:flex-none bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}