import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-otp',
          '/api',
        ],
      },
      // Specific rules for search engines if needed
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/dashboard',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-otp',
          '/api',
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
