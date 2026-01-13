import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://findpadelclubs.co.uk'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/owner/',
          '/api/',
          '/dashboard/',
          '/billing/',
          '/sign-in/',
          '/sign-up/',
          '/sign-up-club-owner/',
          '/_next/',
          '/static/',
        ],
      },
      // Allow Googlebot and Bingbot full access
      {
        userAgent: ['Googlebot', 'Bingbot'],
        allow: '/',
        disallow: [
          '/admin/',
          '/owner/',
          '/api/',
          '/dashboard/',
          '/billing/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

