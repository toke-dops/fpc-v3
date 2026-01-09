import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// This will be enhanced to dynamically fetch clubs and cities from Convex
// For now, this is a basic structure that will work with static generation

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL
  const currentDate = new Date()
  
  // Static pages with high priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/padel-clubs`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for-club-owners`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ]
  
  // Dynamic pages will be added via API route or build-time generation
  // For production, you would fetch all clubs and cities from Convex here
  // Example:
  // const clubs = await fetchAllClubs()
  // const clubPages = clubs.map(club => ({
  //   url: `${baseUrl}/padel-clubs/${club.citySlug}/${club.slug}`,
  //   lastModified: club.updated_at,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.8,
  // }))
  
  return staticPages
}

