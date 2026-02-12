import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { siteConfig } from '@/config/site';

const inter = Inter({ subsets: ['latin'] });

const defaultTitle = 'SnappArchive - AI-Powered Document Management';
const defaultDescription =
  'AI-powered document digitisation and intelligent archiving for modern businesses.';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: defaultTitle,
    template: '%s | SnappArchive',
  },
  description: defaultDescription,
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: '/Images/Websitelogo.png',
        width: 1200,
        height: 630,
        alt: 'SnappArchive',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: ['/Images/Websitelogo.png'],
  },
  icons: {
    icon: '/Images/Websitelogo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    email: siteConfig.email,
    logo: `${siteConfig.url}/Images/Websitelogo.png`,
    description: siteConfig.description,
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: siteConfig.url,
    description: siteConfig.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: '14-day free trial available',
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, softwareApplicationSchema]),
          }}
        />
        {/* Google Analytic */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-E3GS10K9S9"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-E3GS10K9S9');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
