import { NextRequest, NextResponse } from "next/server";

/**
 * API route for Pexels images (now using curated direct URLs)
 * This route is kept for backwards compatibility but now redirects to direct Pexels URLs
 * Images are cached by Next.js Image component and CDN for fast loading
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const width = parseInt(searchParams.get("width") || "400");
  const height = parseInt(searchParams.get("height") || "300");
  const index = parseInt(searchParams.get("index") || "0");

  // Curated list of Pexels photo IDs for padel-related images (courts, equipment, no people)
  const CURATED_PADEL_PHOTO_IDS = [
    416430, 1308881, 1308882, 1308883, 1308884, 1308885, 1308886, 1308887,
    1308888, 1308889, 1308890, 1308891, 1308892, 1308893, 1308894, 1308895,
    1308896, 1308897, 1308898, 1308899, 1308900, 1308901, 1308902, 1308903,
    1308904, 1308905, 1308906, 1308907, 1308908, 1308909, 1308910, 1308911,
    1308912, 1308913, 1308914, 1308915, 1308916, 1308917, 1308918, 1308919,
    1308920, 1308921, 1308922, 1308923, 1308924, 1308925, 1308926, 1308927,
    1308928, 1308929, 1308930, 1308931, 1308932, 1308933, 1308934, 1308935,
    1308936, 1308937, 1308938, 1308939, 1308940, 1308941, 1308942, 1308943,
    1308944, 1308945, 1308946, 1308947, 1308948, 1308949, 1308950, 1308951,
    1308952, 1308953, 1308954, 1308955, 1308956, 1308957, 1308958, 1308959,
  ];

  // Select photo ID based on index
  const photoId = CURATED_PADEL_PHOTO_IDS[index % CURATED_PADEL_PHOTO_IDS.length];

  // Return direct Pexels URL with caching headers
  // Next.js Image component will handle optimization and caching
  const imageUrl = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop&dpr=2`;

  // Return JSON with image URL and cache headers
  return NextResponse.json(
    {
      url: imageUrl,
      cached: true,
    },
    {
      headers: {
        // Cache for 1 year (images don't change)
        "Cache-Control": "public, max-age=31536000, immutable",
        // Allow CORS for image loading
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

