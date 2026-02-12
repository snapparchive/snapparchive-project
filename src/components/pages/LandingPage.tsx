'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, FileText, FolderOpen, Search, ArrowRight, Shield, Workflow, Tag, Mail, Clock, Users, Cookie, X, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { CookieConsentBanner } from '../cookie/CookieConsentBanner';
import { trackEvent } from '@/lib/analytics';


export function LandingPage() {
  const router = useRouter();
  const { t } = useTranslation();


  const getEarlyAccess = () => {
    trackEvent('click_get_early_access', {
      button_name: 'get early access',
      button_location: 'landing_page',
    });
    router.push('/register');
  };

  const whyChooseReasons = [
    {
      icon: FileText,
      title: 'Advanced OCR Technology',
      description: 'State-of-the-art OCR processing that accurately extracts text from any document type, making all your files fully searchable.',
    },
    {
      icon: Shield,
      title: 'GDPR Compliant & Secure',
      description: 'Built with European data protection standards. Your data is encrypted, secure, and never shared with third parties.',
    },
    {
      icon: Workflow,
      title: 'Automated Workflows',
      description: 'Set up intelligent workflows that automatically organize, categorize, and route documents without manual intervention.',
    },
    {
      icon: Tag,
      title: 'Smart Categorization',
      description: 'AI-powered classification automatically tags and categorizes your documents based on content and context.',
    },
    {
      icon: Mail,
      title: 'Email-to-Document',
      description: 'Forward emails directly to your SnappArchive inbox and they\'re automatically processed and archived.',
    },
    {
      icon: Clock,
      title: 'Lightning Fast Search',
      description: 'Find any document in seconds with our intelligent search that works across titles, tags, folders, and OCR content.',
    },
  ];

  const features = [
    {
      icon: FileText,
      title: 'OCR Processing',
      description: 'Automatic text extraction from images and PDFs with advanced OCR technology',
    },
    {
      icon: FolderOpen,
      title: 'Smart Organization',
      description: 'Organize documents with folders, tags, and AI-powered classification',
    },
    {
      icon: Search,
      title: 'Intelligent Search',
      description: 'Search across document titles, tags, folders, and extracted OCR text instantly',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and GDPR compliance to keep your documents safe',
    },
    {
      icon: Workflow,
      title: 'Workflow Automation',
      description: 'Automate repetitive tasks with custom workflows and rules',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share documents and collaborate with your team in real-time',
    },
  ];

  return (
    <>
      <CookieConsentBanner />

      <div className="min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-12 sm:py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div className="space-y-6 sm:space-y-8">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-light border border-primary/30 rounded-full text-primary text-xs sm:text-sm font-medium">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{t('hero.betaBanner')}</span>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-gray-900">
                    One place for every dossier
                  </h1>

                  {/* <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl">
                    {t('hero.subtitle')}
                  </p> */}
                  <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl">
                    Manage all documents, notes, emails, and statuses together per case, client, or project — with everything clearly structured in one dossier.
                  </p>
                  <ul className="space-y-2 text-gray-600 text-sm sm:text-base">
                    <li>• One dossier = one complete case overview</li>
                    <li>• Documents are always linked to context</li>
                    <li>• Status, phase, and actions visible at a glance</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    onClick={() => router.push('/register')}
                    size="lg"
                    className="bg-primary hover:bg-primary-hover text-white text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 group w-full sm:w-auto"
                  >
                    {t('hero.getStarted')}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    onClick={() => router.push('/features')}
                    size="lg"
                    variant="outline"
                    className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 w-full sm:w-auto"
                  >
                    {t('hero.learnMore')}
                  </Button>
                </div>
              </div>

              <div className="relative mt-8 lg:mt-0">
                <div className="relative rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary-hover p-4 sm:p-6 lg:p-8 shadow-2xl">
                  <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        <span className="font-semibold text-sm sm:text-base lg:text-lg">
                          SnappArchive Dashboard
                        </span>
                      </div>
                      <div className="flex gap-1.5 sm:gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-300"></div>
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-300"></div>
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-300"></div>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search documents..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                        readOnly
                      />
                    </div>

                    <div className="space-y-3 pt-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-300 rounded w-32 mb-2"></div>
                            <div className="h-2 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Done
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-300 rounded w-32 mb-2"></div>
                            <div className="h-2 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Processing
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                            <FolderOpen className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-300 rounded w-32 mb-2"></div>
                            <div className="h-2 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                          Folder
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="text-center mb-10 sm:mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Why Choose SnappArchive?
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Built for businesses that value efficiency, security, and intelligent automation
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {whyChooseReasons.map((reason, index) => {
                const IconComponent = reason.icon;
                return (
                  <div
                    key={index}
                    className="p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all bg-white"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      {reason.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">{reason.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
                Powerful Features for Modern Document Management
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Everything you need to digitise, organise, and automate your document workflows
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className="p-4 sm:p-6 rounded-lg sm:rounded-xl bg-white border border-gray-200 hover:border-primary hover:shadow-lg transition-all"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                      <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary to-primary-hover text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 px-4">
              Join the Beta Programme
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-white/90 max-w-2xl mx-auto px-4">
              Be among the first to experience SnappArchive. Limited spots available for our exclusive beta programme.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button
                onClick={getEarlyAccess}
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 group w-full sm:w-auto"
              >
                Get Early Access
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => router.push('/features')}
                size="lg"
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
