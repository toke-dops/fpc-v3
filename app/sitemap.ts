import { MetadataRoute } from 'next'
import { SITE_URL, generateClubSlug, generateCitySlug } from '@/lib/seo'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL
  const currentDate = new Date()
  
  // Static pages with high priority (excluding admin pages)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/clubs`,
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
    {
      url: `${baseUrl}/advertise`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/partner-programme`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/list-your-club`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Fetch clubs and cities from Convex
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      console.warn('NEXT_PUBLIC_CONVEX_URL not set, returning static pages only')
      return staticPages
    }

    const convex = new ConvexHttpClient(convexUrl)

    // Fetch all clubs (no filters = all clubs)
    const clubs = await convex.query(api.clubs.list, {})
    
    // Fetch all cities
    const cities = await convex.query(api.clubs.getCities, {})
    
    // Generate club pages - exclude admin-owned clubs
    const clubPages: MetadataRoute.Sitemap = clubs
      .filter((club) => {
        // Exclude clubs that are admin-only or have no slug
        if (!club.slug) return false
        // Include all clubs (they're already public-facing)
        return true
      })
      .map((club) => ({
        url: `${baseUrl}/clubs/${club.slug}`,
        lastModified: club._creationTime 
          ? new Date(club._creationTime)
          : currentDate,
        changeFrequency: 'weekly' as const,
        priority: club.is_featured ? 0.9 : 0.8,
      }))

    // Generate city pages
    const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
      url: `${baseUrl}/city/${generateCitySlug(city.city)}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Combine all pages (excluding admin pages)
    return [...staticPages, ...clubPages, ...cityPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages only if Convex query fails
    return staticPages
  }
}

