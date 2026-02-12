'use client';

import Link from 'next/link';
import { FileText, Linkedin, Instagram, Facebook, Music2 } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { siteConfig } from '@/config/site';
import { useState } from 'react';
import { CookiePreferencesModal } from '@/components/footerpages/CookiePreferencesModal';

export function Footer() {
  const { t } = useTranslation();
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);

  const handleCookieSettings = () => {
    setIsCookieModalOpen(true);
  };

  const quickLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.features'), href: '/features' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.pricing'), href: '/pricing' },
    { name: t('nav.faq'), href: '/faq' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  const legalLinks = [
    { name: t('footer.privacyPolicy'), href: '/privacy' },
    { name: t('footer.gdprCompliance'), href: '/gdpr-compliance' },
    { name: t('footer.terms'), href: '/termsofservice' },
    { name: t('footer.cookiePolicy'), href: '/cookiepolicy' },
    { name: t('footer.dataProcessing'), href: '/data-processing' },
    { name: t('footer.security'), href: '/security' },
    { 
      name: t('footer.cookieSettings'), 
      href: '#',
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        handleCookieSettings();
      }
    },
  ];

  const socialLinks = [
    { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/company/snapp-archive' },
    { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/snapparchive/' },
    { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61584163492881' },
    { name: 'TikTok', icon: Music2, href: 'https://www.tiktok.com/@snapparchive' },
  ];

  return (
    <>
      <footer className="border-t bg-[#1a202c] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold">{siteConfig.name}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">
                {t('footer.description')}
              </p>
              <div className="flex items-start space-x-2 text-xs sm:text-sm">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                <p className="text-gray-400">{t('footer.gdprStatement')}</p>
              </div>
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center space-x-2 text-primary hover:underline text-xs sm:text-sm"
              >
                <span>{siteConfig.email}</span>
              </a>
            </div>

            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t('footer.quickLinks')}</h3>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-gray-400 hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">{t('footer.legal')}</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    {link.onClick ? (
                      <button
                        onClick={link.onClick}
                        className="text-xs sm:text-sm text-gray-400 hover:text-primary transition-colors text-left w-full"
                      >
                        {link.name}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-xs sm:text-sm text-gray-400 hover:text-primary transition-colors block"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-700 flex flex-col lg:flex-row justify-between items-center gap-4 sm:gap-6">
            <p className="text-xs sm:text-sm text-gray-400 text-center lg:text-left">{t('footer.copyright')}</p>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
                <span className="text-xs sm:text-sm text-gray-400">{t('footer.followUs')}</span>
                <div className="flex gap-3 sm:gap-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      className="text-gray-400 hover:text-primary transition-colors"
                      aria-label={social.name}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Preferences Modal */}
      <CookiePreferencesModal 
        isOpen={isCookieModalOpen} 
        onClose={() => setIsCookieModalOpen(false)} 
      />
    </>
  );
}