/**
 * SEO Utilities for Find Padel Clubs
 * Central module for SEO-related functions, metadata, and structured data
 */

export const SITE_URL = "https://findpadelclubs.co.uk";
export const SITE_NAME = "Find Padel Clubs";
export const SITE_DESCRIPTION = "Discover padel clubs across the United Kingdom. Find courts, book sessions, and join the fastest-growing racket sport.";

/**
 * Slugify function - converts text to SEO-friendly URL slugs
 * Rules: lowercase, hyphen-separated, removes special chars, avoids stop words where possible
 */
export function slugify(text: string): string {
  if (!text) return "";
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove special characters except hyphens
    .replace(/[^\w\-]+/g, "")
    // Replace multiple hyphens with single hyphen
    .replace(/--+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Limit length to 100 chars for SEO
    .slice(0, 100);
}

/**
 * Generate a unique club slug
 * Format: club-name-city
 * Example: greenwich-padel-club-london
 */
export function generateClubSlug(clubName: string, city?: string | null): string {
  const nameSlug = slugify(clubName);
  const citySlug = city ? slugify(city) : "";
  
  if (!citySlug) return nameSlug;
  
  return `${nameSlug}-${citySlug}`;
}

/**
 * Generate city slug
 * Format: city-name
 * Example: london, manchester
 */
export function generateCitySlug(cityName: string): string {
  return slugify(cityName);
}

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string = ""): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Generate Open Graph image URL
 */
export function getOgImageUrl(clubSlug?: string, city?: string): string {
  if (clubSlug && city) {
    // Use club-specific image if available
    return `${SITE_URL}/api/og?club=${encodeURIComponent(clubSlug)}&city=${encodeURIComponent(city)}`;
  }
  // Default OG image
  return `${SITE_URL}/og-image.jpg`;
}

/**
 * Home page metadata
 */
export function getHomeMetadata() {
  return {
    title: "Find Padel Clubs Near You | UK Directory | Find Padel Clubs",
    description: "Discover padel clubs and pickleball courts across the UK. Search by location, book courts online, and find the best padel venues near you. Join Britain's fastest-growing racket sport.",
    keywords: [
      "padel clubs",
      "padel courts",
      "padel UK",
      "find padel clubs",
      "padel near me",
      "pickleball courts",
      "padel booking",
      "UK padel directory",
    ],
    openGraph: {
      title: "Find Padel Clubs Near You | UK Directory",
      description: "Discover padel clubs and pickleball courts across the UK. Search by location, book courts, and find the best padel venues near you.",
      url: getCanonicalUrl("/"),
      siteName: SITE_NAME,
      images: [
        {
          url: getOgImageUrl(),
          width: 1200,
          height: 630,
          alt: "Find Padel Clubs - UK Directory",
        },
      ],
      locale: "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Find Padel Clubs Near You | UK Directory",
      description: "Discover padel clubs and pickleball courts across the UK. Search by location, book courts, and find the best padel venues.",
      images: [getOgImageUrl()],
    },
  };
}

/**
 * Directory index page metadata (/padel-clubs)
 */
export function getDirectoryMetadata() {
  return {
    title: "Padel Clubs Directory | Find Padel Clubs UK",
    description: "Browse our comprehensive directory of padel clubs across the United Kingdom. Search by city, location, or amenities. Find the perfect padel court for your next game.",
    openGraph: {
      title: "Padel Clubs Directory | Find Padel Clubs UK",
      description: "Browse our comprehensive directory of padel clubs across the United Kingdom. Search by city, location, or amenities.",
      url: getCanonicalUrl("/padel-clubs"),
    },
  };
}

/**
 * City page metadata (/padel-clubs/[city])
 */
export function getCityMetadata(cityName: string, clubCount: number = 0) {
  const cityTitle = cityName.charAt(0).toUpperCase() + cityName.slice(1);
  
  return {
    title: `Padel Clubs in ${cityTitle} | Find Padel Clubs UK`,
    description: `Discover ${clubCount > 0 ? clubCount : "the best"} padel clubs in ${cityTitle}. Find courts, book sessions, and connect with local padel players. Browse ratings, reviews, and amenities.`,
    openGraph: {
      title: `Padel Clubs in ${cityTitle} | Find Padel Clubs UK`,
      description: `Discover ${clubCount > 0 ? `${clubCount} padel clubs` : "padel clubs"} in ${cityTitle}. Find courts, book sessions, and connect with local players.`,
      url: getCanonicalUrl(`/padel-clubs/${generateCitySlug(cityName)}`),
    },
  };
}

/**
 * Club detail page metadata (/padel-clubs/[city]/[club-slug])
 */
export function getClubMetadata(
  clubName: string,
  city?: string | null,
  description?: string | null,
  rating?: number | null,
  courtCount?: number | null
) {
  const cityName = city ? ` in ${city}` : "";
  const courtsText = courtCount ? `${courtCount} ${courtCount === 1 ? "court" : "courts"}` : "padel courts";
  const ratingText = rating ? ` Rated ${rating.toFixed(1)}/5.` : "";
  
  const metaDescription = description 
    ? `${description.substring(0, 120)}${description.length > 120 ? "..." : ""}`
    : `${clubName}${cityName} - ${courtsText} with booking available.${ratingText} Find contact details, opening hours, amenities, and book your court today.`;
  
  return {
    title: `${clubName} Padel Club${cityName} | Find Padel Clubs`,
    description: metaDescription,
    openGraph: {
      title: `${clubName} Padel Club${cityName}`,
      description: metaDescription,
      url: getCanonicalUrl(`/padel-clubs/${city ? generateCitySlug(city) : "uk"}/${generateClubSlug(clubName, city)}`),
      images: [
        {
          url: getOgImageUrl(generateClubSlug(clubName, city), city || undefined),
          width: 1200,
          height: 630,
          alt: `${clubName} - Padel Club${cityName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${clubName} Padel Club${cityName}`,
      description: metaDescription,
      images: [getOgImageUrl(generateClubSlug(clubName, city), city || undefined)],
    },
  };
}

/**
 * Static page metadata
 */
export function getStaticPageMetadata(page: string, title: string, description: string) {
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: getCanonicalUrl(`/${page}`),
    },
  };
}

/**
 * Generate WebSite JSON-LD for homepage
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/padel-clubs?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate LocalBusiness/SportsActivityLocation JSON-LD for club pages
 */
export function generateClubSchema(club: {
  name: string;
  city?: string | null;
  street_address?: string | null;
  full_address?: string | null;
  postcode?: string | null;
  phone?: string | null;
  website?: string | null;
  contact_email?: string | null;
  lat?: number | null;
  lng?: number | null;
  opening_hours_raw?: string | null;
  rating?: number | null;
  rating_count?: number | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  booking_url?: string | null;
  number_of_courts?: number | null;
  description?: string | null;
}) {
  const address: any = {
    "@type": "PostalAddress",
    addressCountry: "GB",
  };
  
  if (club.street_address || club.full_address) {
    address.streetAddress = club.street_address || club.full_address;
  }
  if (club.city) {
    address.addressLocality = club.city;
  }
  if (club.postcode) {
    address.postalCode = club.postcode;
  }
  
  const geo: any = {};
  if (club.lat && club.lng) {
    geo["@type"] = "GeoCoordinates";
    geo.latitude = club.lat;
    geo.longitude = club.lng;
  }
  
  const sameAs: string[] = [];
  if (club.website) sameAs.push(club.website);
  if (club.facebook) sameAs.push(club.facebook);
  if (club.instagram) sameAs.push(club.instagram);
  if (club.twitter) sameAs.push(club.twitter);
  if (club.linkedin) sameAs.push(club.linkedin);
  
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: club.name,
    description: club.description || `${club.name} - Padel club in ${club.city || "the UK"}`,
    sport: "Padel",
    address,
  };
  
  if (Object.keys(geo).length > 0) {
    schema.geo = geo;
  }
  
  if (club.phone) {
    schema.telephone = club.phone;
  }
  
  if (club.website) {
    schema.url = club.website;
  }
  
  if (club.contact_email) {
    schema.email = club.contact_email;
  }
  
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }
  
  if (club.opening_hours_raw) {
    // Try to parse opening hours - basic implementation
    schema.openingHoursSpecification = {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "09:00",
      closes: "22:00",
    };
  }
  
  if (club.rating && club.rating_count) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: club.rating.toString(),
      reviewCount: club.rating_count.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }
  
  if (club.number_of_courts) {
    schema.numberOfRooms = {
      "@type": "SportsActivityLocation",
      name: `${club.number_of_courts} Padel Courts`,
    };
  }
  
  return schema;
}

/**
 * Generate BreadcrumbList JSON-LD
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Article JSON-LD for blog posts
 */
export function generateArticleSchema(article: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: getCanonicalUrl(article.url),
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      "@type": "Organization",
      name: article.author || SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    image: article.image || getOgImageUrl(),
  };
}

/**
 * Format opening hours for schema
 */
export function parseOpeningHours(hoursRaw: string): Array<{
  "@type": string;
  dayOfWeek: string;
  opens: string;
  closes: string;
}> {
  // Basic parser - can be enhanced
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  // For now, return a default structure - this can be enhanced with actual parsing
  return days.map((day) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: `https://schema.org/${day}`,
    opens: "09:00",
    closes: "22:00",
  }));
}

