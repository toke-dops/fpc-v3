/**
 * Pexels API utility for fetching royalty-free images
 * API Documentation: https://www.pexels.com/api/documentation/
 * 
 * Using a curated list of specific padel images without people/faces
 * These images are cached by Next.js Image component for fast loading
 */

/**
 * Curated list of Pexels photo IDs for padel-related images without people
 * These are specific images that match the user's requirements:
 * - Padel courts, equipment, and facilities
 * - No faces or people visible
 * - High quality, professional images
 * 
 * Note: These are example IDs - you'll need to replace them with actual Pexels photo IDs
 * that match the images you want to use. You can find photo IDs by:
 * 1. Searching Pexels for "padel court equipment" (no people)
 * 2. Clicking on an image and checking the URL: pexels.com/photo/[ID]/
 * 3. Adding the ID to this array
 */
const CURATED_PADEL_PHOTO_IDS = [
  // Curated list of specific Pexels photo IDs for padel-related images
  // These are direct image IDs that will load fast via Pexels CDN
  1103829,
  1103833,
  35525977,
  31012869,
  34079416,
  34079415,
  4536850,
  30864597,
  32896990,
  32896996,
  33226056,
  32474981,
  10926534,
  32896991,
  35214843,
  32234837,
];

/**
 * Get a direct Pexels image URL from the curated list
 * Uses deterministic hash based on club slug for consistent image assignment
 * Images are cached by Next.js Image component automatically
 */
export function getPexelsImageDirect(slug: string, width: number = 400, height: number = 300): string {
  // Create a hash from the slug for deterministic selection
  const hash = slug.split('').reduce((acc, char) => {
    const hash = ((acc << 5) - acc) + char.charCodeAt(0);
    return hash & hash;
  }, 0);
  
  // Use the hash to create a seed for image selection
  const seed = Math.abs(hash);
  
  // Select a photo ID from the curated list
  // If list is small, cycle through it; if large, use modulo
  const photoId = CURATED_PADEL_PHOTO_IDS[seed % CURATED_PADEL_PHOTO_IDS.length] || CURATED_PADEL_PHOTO_IDS[0];
  
  // Return direct Pexels URL - Next.js Image component will cache this
  // Using the optimized URL format for better caching
  return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop&dpr=2`;
}

/**
 * Get a deterministic Pexels image URL based on club slug
 * This is an alias for getPexelsImageDirect for consistency
 */
export function getDeterministicPexelsImage(slug: string, width: number = 400, height: number = 300): string {
  return getPexelsImageDirect(slug, width, height);
}

/**
 * Fetch the actual Pexels image URL from the API route
 * This should be called client-side to get the real image URL
 * NOTE: With curated list, this is no longer needed, but kept for backward compatibility
 */
export async function fetchPexelsImageUrl(apiRouteUrl: string): Promise<string> {
  try {
    const response = await fetch(apiRouteUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image URL: ${response.status}`);
    }
    const data = await response.json();
    return data.url || apiRouteUrl;
  } catch (error) {
    console.error("Error fetching Pexels image URL:", error);
    // Fallback to first curated photo ID
    return `https://images.pexels.com/photos/${CURATED_PADEL_PHOTO_IDS[0]}/pexels-photo-${CURATED_PADEL_PHOTO_IDS[0]}.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop`;
  }
}

/**
 * Server-side function to fetch a Pexels image URL
 * This should be called from an API route or server component
 * RECOMMENDED: Use this with a Pexels API key for best results
 */
export async function fetchPexelsImage(searchQuery: string = "padel court equipment racket facility", width: number = 400, height: number = 300): Promise<string> {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
  const PEXELS_API_URL = "https://api.pexels.com/v1";

  if (!PEXELS_API_KEY) {
    // Fallback to direct image URL from curated list
    return getPexelsImageDirect("padel", width, height);
  }

  try {
    const response = await fetch(
      `${PEXELS_API_URL}/search?query=${encodeURIComponent(searchQuery)}&per_page=80&orientation=landscape`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      // Return the medium-sized image URL
      const photo = data.photos[0];
      return photo.src.medium || photo.src.large || photo.src.original;
    }

    // Fallback if no results
    return getPexelsImageDirect("padel", width, height);
  } catch (error) {
    console.error("Error fetching Pexels image:", error);
    // Fallback image
    return getPexelsImageDirect("padel", width, height);
  }
}
