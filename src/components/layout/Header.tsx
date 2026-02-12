'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Globe, ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { siteConfig } from '@/config/site';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/lib/hooks/useSubscription';
import Image from 'next/image';
import { trackEvent } from '@/lib/analytics';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.features'), href: '/features' },
    { name: t('nav.about'), href: '/about' },
    { name: t('nav.pricing'), href: '/pricing' },
    { name: t('nav.faq'), href: '/faq' },
    { name: t('nav.contact'), href: '/contact' },
  ];

  const handleGetEarlyAccess = () => {
    trackEvent('click_get_early_access', {
      button_location: 'header',
      user_authenticated: isAuthenticated,
    });
    router.push('/register');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleChoosePlan = () => {
    router.push('/pricing');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang as any);
  };

  const handleMobileNavClick = (href: string) => {
    setMobileMenuOpen(false);
    router.push(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image src='/Images/Websitelogo.png' alt='SnappArchieve' width={80} height={20}
                className='ml-10' />
            </Link>

            <nav className="hidden lg:flex items-center space-x-12">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                     text-md font-medium transition-colors
                     hover:text-primary
                     ${pathname === item.href ? 'text-primary' : 'text-gray-700'}
                            `}
                >
                  {item.name}
                </Link>
              ))}
            </nav>


            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {
                        siteConfig.supportedLanguages.find(
                          (l) => l.code === language
                        )?.name
                      }
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {siteConfig.supportedLanguages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className="gap-2"
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                      {language === lang.code && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu> */}

              {!isAuthenticated ? (
                // State 1: Not logged in - Show "Get Early Access" and "Login"
                <>
                  <Button
                    onClick={handleLogin}
                    variant="ghost"
                    size="sm"
                    className="hidden md:inline-flex"
                  >
                    {t('nav.login')}
                  </Button>
                  <Button
                    onClick={handleGetEarlyAccess}
                    size="sm"
                    className="bg-primary bg-primary-hover text-white hidden sm:inline-flex"
                  >
                    {t('nav.getEarlyAccess')}
                  </Button>
                </>
              ) : subscriptionLoading ? (
                // Loading subscription status - show nothing to prevent flash
                null
              ) : hasActiveSubscription ? (
                // State 3: Logged in with subscription - Show "Dashboard" and "Login"
                <>
                  <Button
                    onClick={handleLogin}
                    variant="ghost"
                    size="sm"
                    className="hidden md:inline-flex"
                  >
                    {t('nav.login')}
                  </Button>
                  <Button
                    onClick={handleDashboard}
                    className="bg-primary bg-primary-hover text-white hidden sm:inline-flex"
                    size="sm"
                  >
                    {t('dashboard.title')}
                  </Button>
                </>
              ) : (
                // State 2: Logged in but no subscription - Show "Choose Plan" and "Login"
                <>
                  <Button
                    onClick={handleLogin}
                    variant="ghost"
                    size="sm"
                    className="hidden md:inline-flex"
                  >
                    {t('nav.login')}
                  </Button>
                  <Button
                    onClick={handleChoosePlan}
                    size="sm"
                    className="bg-primary bg-primary-hover text-white hidden sm:inline-flex"
                  >
                    {t('nav.choosePlan')}
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">{siteConfig.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-6 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.href}
                onClick={() => handleMobileNavClick(item.href)}
                className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-colors ${pathname === item.href
                  ? 'bg-blue-50 text-primary'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {item.name}
              </button>
            ))}

            {/* <div className="pt-6 border-t mt-6 space-y-3">
              <div className="px-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Language
                </p>
                <div className="space-y-2">
                  {siteConfig.supportedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${language === lang.code
                          ? 'bg-blue-50 text-primary'
                          : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                      {language === lang.code && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div> */}
          </nav>

          <div className="border-t p-4 space-y-2">
            {!isAuthenticated ? (
              // State 1: Not logged in - Show "Get Early Access" and "Login"
              <>
                <Button
                  onClick={() => handleMobileNavClick('/login')}
                  variant="outline"
                  className="w-full"
                >
                  {t('nav.login')}
                </Button>
                <Button
                  onClick={() => handleMobileNavClick('/register')}
                  className="w-full bg-primary hover:bg-primary-hover text-white"
                >
                  {t('nav.getEarlyAccess')}
                </Button>
              </>
            ) : subscriptionLoading ? (
              // Loading subscription status - show nothing to prevent flash
              null
            ) : hasActiveSubscription ? (
              // State 3: Logged in with subscription - Show "Dashboard" and "Login"
              <>
                <Button
                  onClick={() => handleMobileNavClick('/login')}
                  variant="outline"
                  className="w-full"
                >
                  {t('nav.login')}
                </Button>
                <Button
                  onClick={() => handleMobileNavClick('/dashboard')}
                  className="w-full bg-primary hover:bg-primary-hover text-white"
                >
                  {t('dashboard.title')}
                </Button>
              </>
            ) : (
              // State 2: Logged in but no subscription - Show "Choose Plan" and "Login"
              <>
                <Button
                  onClick={() => handleMobileNavClick('/login')}
                  variant="outline"
                  className="w-full"
                >
                  {t('nav.login')}
                </Button>
                <Button
                  onClick={() => handleMobileNavClick('/pricing')}
                  className="w-full bg-primary hover:bg-primary-hover text-white"
                >
                  {t('nav.choosePlan')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
