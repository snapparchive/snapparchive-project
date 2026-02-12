import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export const revalidate = 86400; // Revalidate once per day (24 hours)

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  // Public pages that should be indexed
  const publicPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: '2026-02-12',
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: '2026-02-12',
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: '2026-02-12',
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: '2026-02-12',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: '2026-02-12',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: '2026-02-12',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/data-processing`,
      lastModified: '2026-02-12',
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/security`,
      lastModified: '2026-02-12',
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/gdpr-compliance`,
      lastModified: '2026-02-12',
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: '2026-02-12',
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/termsofservice`,
      lastModified: '2026-02-12',
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cookiepolicy`,
      lastModified: '2026-02-12',
      changeFrequency: 'yearly',
      priority: 0.6,
    },
  ];

  return publicPages;
}
