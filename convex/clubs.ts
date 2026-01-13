import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Helper function to extract lat/lng from Google Maps URL
// Supports formats like:
// - https://maps.google.com/?q=51.5074,-0.1278
// - https://www.google.com/maps?q=51.5074,-0.1278
// - https://maps.google.com/maps?ll=51.5074,-0.1278
// - https://maps.google.com/maps?q=51.5074,-0.1278&z=14
// - https://www.google.com/maps/@51.5074,-0.1278,14z
// - https://www.google.com/maps/place/.../@51.5074,-0.1278,14z
// - https://goo.gl/maps/... (shortened URLs - will return null, need to resolve)
async function extractCoordsFromMapsUrl(mapsUrl: string | undefined | null): Promise<{ lat: number; lng: number } | null> {
  if (!mapsUrl) return null;
  
  try {
    // Try to extract coordinates from query parameters
    const url = new URL(mapsUrl);
    
    // Try ?q=lat,lng format (coordinates in q parameter)
    const qParam = url.searchParams.get("q");
    if (qParam) {
      // Check if q param contains coordinates (lat,lng format)
      const coordMatch = qParam.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    }
    
    // Try ?ll=lat,lng format
    const llParam = url.searchParams.get("ll");
    if (llParam) {
      const coords = llParam.split(",").map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        const lat = coords[0];
        const lng = coords[1];
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    }
    
    // Try to extract from URL path (e.g., /@51.5074,-0.1278,14z or /place/.../@51.5074,-0.1278,14z)
    // This is the most common format for modern Google Maps URLs
    const pathMatch = mapsUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (pathMatch) {
      const lat = parseFloat(pathMatch[1]);
      const lng = parseFloat(pathMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    
    // If URL doesn't have coordinates directly, try following redirects
    // This handles shortened URLs like goo.gl/maps/... and URLs that redirect
    try {
      const response = await fetch(mapsUrl, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent": "UK-PadelFinder/1.0",
        },
      });
      
      // Extract from final URL after redirect
      const finalUrl = response.url;
      if (finalUrl !== mapsUrl) {
        // Try extracting from redirected URL
        const redirectedUrl = new URL(finalUrl);
        
        // Try @lat,lng format in redirected URL pathname
        const redirectedAtMatch = redirectedUrl.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (redirectedAtMatch) {
          const lat = parseFloat(redirectedAtMatch[1]);
          const lng = parseFloat(redirectedAtMatch[2]);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
          }
        }
        
        // Try regex on full redirected URL
        const redirectedRegexMatch = finalUrl.match(/(-?\d{1,2}\.?\d*),(-?\d{1,3}\.?\d*)/);
        if (redirectedRegexMatch) {
          const lat = parseFloat(redirectedRegexMatch[1]);
          const lng = parseFloat(redirectedRegexMatch[2]);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
          }
        }
      }
    } catch (redirectError) {
      // If redirect following fails, continue to regex fallback
    }
  } catch (e) {
    // URL parsing failed, try regex fallback
  }
  
  // Fallback: try to find any lat,lng pattern in the URL
  const regexMatch = mapsUrl.match(/(-?\d{1,2}\.?\d*),(-?\d{1,3}\.?\d*)/);
  if (regexMatch) {
    const lat = parseFloat(regexMatch[1]);
    const lng = parseFloat(regexMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  
  return null;
}

// Helper function to geocode an address using Nominatim
// The address parameter can already include "UK" or be a full search query
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // If address already includes "UK", use it as-is; otherwise append ", UK"
    const searchQuery = address.includes("UK") || address.includes("United Kingdom")
      ? address
      : `${address}, UK`;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}&limit=1&countrycodes=gb`,
      {
        headers: {
          "User-Agent": "UK-PadelFinder/1.0",
        },
      }
    );

    if (response.ok) {
      const data: any = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  
  return null;
}

// Helper function to get club coordinates, extracting from maps_url or geocoding address if needed
async function getClubCoordinates(club: any): Promise<{ lat: number; lng: number } | null> {
  // First try direct lat/lng fields
  if (club.lat !== undefined && club.lat !== null && club.lng !== undefined && club.lng !== null) {
    return { lat: club.lat, lng: club.lng };
  }
  
  // Fallback to extracting from maps_url
  if (club.maps_url) {
    const coords = extractCoordsFromMapsUrl(club.maps_url);
    if (coords) return coords;
  }
  
  // Last resort: geocode full_address
  if (club.full_address) {
    return await geocodeAddress(club.full_address);
  }
  
  // Try street_address + city + postcode if full_address doesn't work
  if (club.street_address || club.city || club.postcode) {
    const addressParts = [
      club.street_address,
      club.city,
      club.postcode,
    ].filter(Boolean);
    
    if (addressParts.length > 0) {
      return await geocodeAddress(addressParts.join(", "));
    }
  }
  
  return null;
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to calculate Levenshtein distance (for fuzzy matching)
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
}

// Helper function to check if two strings are similar (fuzzy match)
function isSimilar(str1: string, str2: string, threshold: number = 0.7): boolean {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return true;
  
  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  const similarity = (longer.length - distance) / longer.length;
  return similarity >= threshold;
}

// Helper function to check if postcode matches (supports partial)
function postcodeMatches(clubPostcode: string | undefined, searchTerm: string): boolean {
  if (!clubPostcode) return false;
  const clubPostcodeUpper = clubPostcode.toUpperCase().replace(/\s+/g, "");
  const searchUpper = searchTerm.toUpperCase().replace(/\s+/g, "");
  
  // Exact match
  if (clubPostcodeUpper === searchUpper) return true;
  
  // Partial match - check if search term is a prefix
  if (clubPostcodeUpper.startsWith(searchUpper)) return true;
  
  // Check if it matches the outward code (first part before space)
  const clubOutward = clubPostcodeUpper.split(/\s/)[0];
  if (clubOutward.startsWith(searchUpper)) return true;
  
  return false;
}

// Helper function to calculate text relevance score
function calculateTextRelevance(club: any, searchTerm: string): number {
  const term = searchTerm.toLowerCase().trim();
  let score = 0;

  // Exact name match (highest weight)
  const clubNameLower = club.name?.toLowerCase() || "";
  if (clubNameLower.includes(term)) {
    score += 20;
    if (clubNameLower.startsWith(term)) {
      score += 10; // Bonus for starting with search term
    }
    if (clubNameLower === term) {
      score += 15; // Exact match bonus
    }
  } else {
    // Fuzzy name match
    const nameWords = clubNameLower.split(/\s+/);
    const searchWords = term.split(/\s+/);
    
    // Check if any search word matches any club name word (fuzzy)
    for (const searchWord of searchWords) {
      for (const nameWord of nameWords) {
        if (isSimilar(nameWord, searchWord, 0.6)) {
          score += 8;
        }
        if (nameWord.includes(searchWord) || searchWord.includes(nameWord)) {
          score += 5;
        }
      }
    }
  }

  // Postcode match (high weight)
  if (postcodeMatches(club.postcode, searchTerm)) {
    score += 15;
  }

  // City exact match
  const clubCityLower = club.city?.toLowerCase() || "";
  if (clubCityLower === term) {
    score += 12;
  } else if (clubCityLower.includes(term)) {
    score += 8;
  } else if (isSimilar(clubCityLower, term, 0.7)) {
    score += 6; // Fuzzy city match
  }

  // Full address match
  const fullAddressLower = club.full_address?.toLowerCase() || "";
  if (fullAddressLower.includes(term)) {
    score += 5;
  }

  // Street address match
  const streetAddressLower = club.street_address?.toLowerCase() || "";
  if (streetAddressLower.includes(term)) {
    score += 5;
  }

  // Description match
  if (club.description?.toLowerCase().includes(term)) {
    score += 3;
  }

  // Categories match
  if (club.categories?.some((cat: string) => cat.toLowerCase().includes(term))) {
    score += 2;
  }

  return score;
}

export const list = query({
  args: {
    search: v.optional(v.string()),
    minRating: v.optional(v.number()),
    hasBooking: v.optional(v.boolean()),
    categories: v.optional(v.array(v.string())),
    amenities: v.optional(v.array(v.string())),
    // Legacy parameters (kept for backward compatibility)
    userLat: v.optional(v.number()),
    userLng: v.optional(v.number()),
    radiusKm: v.optional(v.number()),
    searchCity: v.optional(v.string()),
    // New proximity search parameters
    searchLat: v.optional(v.number()), // Search location latitude
    searchLng: v.optional(v.number()), // Search location longitude
    maxDistanceKm: v.optional(v.number()), // Maximum distance in km (default: 50)
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all clubs
    let clubs = await ctx.db.query("clubs").collect();

    // Determine search location (prefer new searchLat/searchLng, fallback to userLat/userLng for backward compatibility)
    const searchLat = args.searchLat ?? args.userLat;
    const searchLng = args.searchLng ?? args.userLng;
    const hasLocation = searchLat !== undefined && searchLng !== undefined;
    
    // Default max distance is undefined (show all clubs) if not specified
    // Only filter by distance if explicitly provided (e.g., 5, 10, 20, 50 miles)
    const maxDistanceKm = args.maxDistanceKm ?? args.radiusKm ?? undefined;
    
    // Store searchCity for prioritization (don't filter - show all clubs, but prioritize searched city)
    // When a location is provided, we'll use city as a sorting factor, not a filter
    // This ensures we show ALL clubs (from all cities) sorted by proximity and priority
    let searchCityForPrioritization: string | undefined = undefined;
    if (args.searchCity && args.searchCity.trim().length > 0) {
      const searchCityLower = args.searchCity.trim().toLowerCase();
      
      // Extract main city name from variations like "City of London, Greater London" -> "london"
      let mainCity = searchCityLower;
      
      // Normalize London variations - "City of London", "Greater London", etc. -> "london"
      if (searchCityLower.includes("london")) {
        mainCity = "london";
      } else {
        // For other cities, remove common prefixes/suffixes
        mainCity = searchCityLower
          .replace(/^city of\s+/i, "")
          .replace(/\s*,?\s*greater\s+.+$/i, "")
          .split(",")[0] // Take only the part before the first comma
          .trim();
      }
      
      if (mainCity) {
        searchCityForPrioritization = mainCity;
      }
      
      // Only apply city filter if NO location is provided (text-only search)
      // When location is provided, we want to show ALL clubs sorted by proximity
      if (!hasLocation) {
        const filteredClubs = clubs.filter((club) => {
          const clubCityLower = club.city?.toLowerCase() || "";
          if (!clubCityLower) return false;
          
          // Handle London variations specially - any London variation matches any London club
          if (mainCity.includes("london") || searchCityLower.includes("london")) {
            if (clubCityLower.includes("london")) return true;
          }
          
          // Exact match
          if (clubCityLower === mainCity || clubCityLower === searchCityLower) return true;
          
          // Match if city name contains the main city (e.g., "London" matches "City of London")
          if (mainCity.length >= 3) {
            if (clubCityLower.includes(mainCity) || mainCity.includes(clubCityLower)) return true;
          }
          
          // Similar match with reasonable threshold
          if (isSimilar(clubCityLower, mainCity, 0.7) || isSimilar(clubCityLower, searchCityLower, 0.7)) return true;
          
          return false;
        });
        
        // If city filter resulted in no clubs, don't filter by city
        if (filteredClubs.length > 0) {
          clubs = filteredClubs;
        }
      }
    }

    // Apply text search if provided
    // IMPORTANT: When location is provided, ignore text search filtering and sorting
    // We want to show ALL nearby clubs sorted by proximity, not filtered by text relevance
    // BUT: If searchCity is set, we've already filtered by city, so text search should only refine within that city
    if (args.search && args.search.trim().length > 0 && !hasLocation) {
      // Only apply text search filtering when NO location is provided
      const searchTerm = args.search.trim();
      
      // If searchCity is set, prioritize city matches even more
      const searchCityLower = args.searchCity?.trim().toLowerCase();
      const isCitySearch = searchCityLower && searchTerm.toLowerCase() === searchCityLower;
      
      const scoredClubs = clubs
        .map((club) => {
          let score = calculateTextRelevance(club, searchTerm);
          
          // If this is a city search, heavily penalize clubs not in that city
          if (isCitySearch && searchCityLower) {
            const clubCityLower = club.city?.toLowerCase() || "";
            if (clubCityLower !== searchCityLower && !isSimilar(clubCityLower, searchCityLower, 0.85)) {
              score = 0; // Exclude clubs not in the searched city
            }
          }
          
          return { club, score };
        })
        .sort((a, b) => b.score - a.score); // Sort by relevance (highest first)
      
      // If no clubs have a score > 0, return ALL clubs (not "no matches")
      // This handles cases where user types a fake word or something that doesn't match
      if (scoredClubs.length === 0 || scoredClubs.every(item => item.score === 0)) {
        // Return all clubs, sorted by plan priority and rating
        clubs = clubs;
      } else {
        // Filter to only clubs with some relevance
        clubs = scoredClubs.filter((item) => item.score > 0).map((item) => item.club);
      }
    }
    // If location is provided, we skip text search filtering entirely
    // All clubs will be shown and sorted by proximity

    // Apply filters
    if (args.minRating !== undefined) {
      clubs = clubs.filter((club) => (club.rating ?? 0) >= args.minRating!);
    }

    if (args.hasBooking) {
      clubs = clubs.filter((club) => !!club.booking_url);
    }

    if (args.categories && args.categories.length > 0) {
      clubs = clubs.filter((club) =>
        args.categories!.some((cat) => club.categories.includes(cat))
      );
    }

    // Filter by amenities if provided
    if (args.amenities && args.amenities.length > 0) {
      clubs = clubs.filter((club) => {
        if (!club.amenities || club.amenities.length === 0) return false;
        // Check if club has at least one of the selected amenities
        return args.amenities!.some((amenity) =>
          club.amenities!.some((clubAmenity) =>
            clubAmenity.toLowerCase().trim() === amenity.toLowerCase().trim()
          )
        );
      });
    }

    // PROXIMITY-BASED SEARCH: When search location is provided, calculate distance for ALL clubs
    // This ensures proximity badges show for all clubs, even if they're outside the radius
    if (hasLocation && searchLat !== undefined && searchLng !== undefined) {
      // Calculate distance for ALL clubs (using getClubCoordinates to extract from maps_url or geocode address if needed)
      // This ensures we can show proximity badges even for clubs outside the radius
      const clubsWithDistancePromises = clubs.map(async (club) => {
        const coords = await getClubCoordinates(club);
        if (coords) {
          const distanceKm = calculateDistance(searchLat, searchLng, coords.lat, coords.lng);
          return { ...club, distanceKm, lat: coords.lat, lng: coords.lng } as typeof club & { distanceKm: number; lat: number; lng: number };
        }
        return { ...club, distanceKm: null } as typeof club & { distanceKm: null };
      });
      
      const clubsWithDistance = await Promise.all(clubsWithDistancePromises);
      
      // Filter clubs - prioritize clubs within radius, but include all clubs with coordinates for proximity display
      // If maxDistanceKm is set, filter by it, but still calculate distance for all clubs to show proximity badges
      // Helper function to check if club is in searched city (with London normalization)
      // Used by both filter and sort functions
      const isInSearchedCity = (club: typeof clubsWithDistance[0]): boolean => {
        if (!searchCityForPrioritization) return false;
        const searchCityLower = searchCityForPrioritization.toLowerCase();
        const clubCityLower = club.city?.toLowerCase() || "";
        if (!clubCityLower) return false;
        
        // Normalize London variations - all London variations match
        if (searchCityLower.includes("london")) {
          if (clubCityLower.includes("london")) return true;
        }
        
        // Exact match
        if (clubCityLower === searchCityLower) return true;
        
        // Similarity match
        if (isSimilar(clubCityLower, searchCityLower, 0.7)) return true;
        
        // Contains match (e.g., "City of London" contains "London")
        if (searchCityLower.length >= 3 && (clubCityLower.includes(searchCityLower) || searchCityLower.includes(clubCityLower))) {
          return true;
        }
        
        return false;
      };
      
      // Filter clubs by distance when maxDistanceKm is set
      // When maxDistanceKm is undefined (user selected "Any distance"), show ALL clubs
      // When maxDistanceKm is set (user selected 5, 10, 20, or 50 miles), filter to clubs within that radius
      const filteredClubs = clubsWithDistance.filter((club) => {
        // If maxDistanceKm is undefined (user selected "Any distance"), show ALL clubs
        if (maxDistanceKm === undefined) {
          // Include clubs even without coordinates (they'll be sorted to the end)
          return true; // Include all clubs
        }
        
        // When a specific distance is selected (e.g., 5, 10, 20, 50 miles):
        // STRICTLY filter by distance - only show clubs within the selected radius
        // No exceptions for clubs in searched city - distance filter takes precedence
        
        // Filter out clubs without coordinates (we can't calculate distance for them)
        if (club.distanceKm === null) {
          return false; // Filter out clubs without coordinates
        }
        
        // Filter by maxDistanceKm - only include clubs within the selected radius
        // This ensures when user selects "5 miles", only clubs within 5 miles are shown
        if (club.distanceKm > maxDistanceKm) {
          return false; // Filter out clubs outside the selected radius
        }
        
        return true; // Include clubs within the selected radius
      });

      // Sort: clubs in searched city first, then by plan priority (featured > business > basic), then by distance
      filteredClubs.sort((a, b) => {
        // PRIORITY 1: Clubs in the searched city come first (if city was searched)
        if (searchCityForPrioritization) {
          const aInCity = isInSearchedCity(a);
          const bInCity = isInSearchedCity(b);
          
          if (aInCity && !bInCity) return -1;
          if (!aInCity && bInCity) return 1;
        }
        
        // PRIORITY 2: Within the same city group (or if no city search), sort by plan priority
        // Featured clubs first
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        
        // Business clubs second
        if (a.plan === "business" && b.plan !== "business") return -1;
        if (a.plan !== "business" && b.plan === "business") return 1;
        
        // PRIORITY 3: Then sort by distance (closest first)
        // Since we've already filtered by distance above (or maxDistanceKm is undefined), 
        // all clubs here are either within the radius or maxDistanceKm is undefined (show all)
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1; // Clubs without distance go to end
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });

      // Apply limit
      if (args.limit) {
        return filteredClubs.slice(0, args.limit);
      }
      return filteredClubs;
    } else {
      // Text search without location OR default: sort by plan priority then relevance/rating
      if (args.search && args.search.trim().length > 0) {
        // Text search - sort by plan priority then relevance
        const searchTerm = args.search.trim();
        clubs.sort((a, b) => {
          // Featured clubs first
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          
          // Business clubs second
          if (a.plan === "business" && b.plan !== "business") return -1;
          if (a.plan !== "business" && b.plan === "business") return 1;
          
          // Then by text relevance
          const relevanceA = calculateTextRelevance(a, searchTerm);
          const relevanceB = calculateTextRelevance(b, searchTerm);

          if (relevanceB !== relevanceA) {
            return relevanceB - relevanceA;
          }

          // Then by rating
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          if (ratingB !== ratingA) return ratingB - ratingA;

          // Then by rating count
          const countA = a.rating_count ?? 0;
          const countB = b.rating_count ?? 0;
          return countB - countA;
        });
      } else {
        // Default: featured first, then business, then sort by rating (desc), then rating_count (desc)
        clubs.sort((a, b) => {
          // Featured clubs first
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          
          // Business clubs second
          if (a.plan === "business" && b.plan !== "business") return -1;
          if (a.plan !== "business" && b.plan === "business") return 1;
          
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          const countA = a.rating_count ?? 0;
          const countB = b.rating_count ?? 0;
          return countB - countA;
        });
      }

    }

    // Apply limit
    if (args.limit) {
      clubs = clubs.slice(0, args.limit);
    }

    return clubs;
  },
});

export const getById = query({
  args: { id: v.id("clubs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Helper query to get all clubs for coordinate population (used by action)
// Query to get all clubs for coordinate population
// Only returns clubs that don't have coordinates yet
export const getAllClubsForPopulation = query({
  args: {},
  handler: async (ctx) => {
    const allClubs = await ctx.db.query("clubs").collect();
    // Filter to only clubs without coordinates
    return allClubs.filter(club => 
      !club.lat || club.lat === null || !club.lng || club.lng === null
    );
  },
});

// Helper mutation to update club coordinates (called from action)
export const updateClubCoordinates = mutation({
  args: {
    clubId: v.id("clubs"),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clubId, {
      lat: args.lat,
      lng: args.lng,
    });
  },
});

// Helper to delay between requests (Nominatim rate limit: 1 request/second)
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Action to populate lat/lng fields from maps_url for all clubs
// Must be an action (not mutation) because it uses fetch() and setTimeout()
// Processes in batches to avoid timeout (600s limit)
export const populateCoordinatesFromMapsUrl = action({
  args: {
    batchSize: v.optional(v.number()), // Number of clubs to process per batch (default: 100)
    startIndex: v.optional(v.number()), // Start index for batch processing (default: 0)
  },
  handler: async (ctx, args): Promise<{
    total: number;
    updated: number;
    geocoded: number;
    errors: number;
    skipped: number;
    processed: number;
    hasMore: boolean;
    nextStartIndex: number;
    errorDetails: string[];
  }> => {
    const batchSize = args.batchSize ?? 100;
    const startIndex = args.startIndex ?? 0;
    
    // Actions need to use ctx.runQuery to access the database
    // Type assertion to break circular reference during type checking
    const allClubs = await ctx.runQuery((api as any).clubs.getAllClubsForPopulation);
    
    // Process only a batch to avoid timeout
    const clubs = allClubs.slice(startIndex, startIndex + batchSize);
    const hasMore = startIndex + batchSize < allClubs.length;
    let updated = 0;
    let geocoded = 0;
    let errors = 0;
    let skipped = 0;
    const errorDetails: string[] = [];
    let lastGeocodeTime = 0;

    for (let i = 0; i < clubs.length; i++) {
      const club = clubs[i];
      try {
        // Skip if already has coordinates
        if (club.lat !== undefined && club.lat !== null && club.lng !== undefined && club.lng !== null) {
          skipped++;
          continue;
        }

        let coords: { lat: number; lng: number } | null = null;
        let source = "";

        // Try extracting from maps_url first (may follow redirects)
        if (club.maps_url) {
          try {
            const mapsUrlResult = await extractCoordsFromMapsUrl(club.maps_url);
            if (mapsUrlResult) {
              coords = mapsUrlResult;
              source = "maps_url";
            }
          } catch (error: any) {
            console.error(`Error extracting from maps_url for ${club.name}:`, error.message || String(error));
          }
        }

        // If maps_url didn't work, try geocoding with club name + full address (best accuracy)
        // Add delay to respect Nominatim rate limit (1 request/second)
        if (!coords && club.name && club.full_address) {
          const now = Date.now();
          const timeSinceLastGeocode = now - lastGeocodeTime;
          if (timeSinceLastGeocode < 1100) {
            // Wait at least 1.1 seconds between geocoding requests
            await delay(1100 - timeSinceLastGeocode);
          }
          lastGeocodeTime = Date.now();
          
          // Combine club name and full address for better geocoding accuracy
          const searchQuery = `${club.name}, ${club.full_address}`;
          try {
            const geocodeResult = await geocodeAddress(searchQuery);
            if (geocodeResult) {
              coords = geocodeResult;
              source = "name_and_address";
            }
          } catch (error: any) {
            console.error(`Error geocoding name+address for ${club.name}:`, error.message || String(error));
          }
        }

        // If still no coords, try geocoding full_address alone
        if (!coords && club.full_address) {
          const now = Date.now();
          const timeSinceLastGeocode = now - lastGeocodeTime;
          if (timeSinceLastGeocode < 1100) {
            await delay(1100 - timeSinceLastGeocode);
          }
          lastGeocodeTime = Date.now();
          
          try {
            const geocodeResult = await geocodeAddress(club.full_address);
            if (geocodeResult) {
              coords = geocodeResult;
              source = "full_address";
            }
          } catch (error: any) {
            console.error(`Error geocoding full_address for ${club.name}:`, error.message || String(error));
          }
        }

        // If still no coords, try geocoding street_address + city + postcode
        if (!coords && (club.street_address || club.city || club.postcode)) {
          const addressParts = [
            club.street_address,
            club.city,
            club.postcode,
          ].filter(Boolean);
          
          if (addressParts.length > 0) {
            const address = addressParts.join(", ");
            const now = Date.now();
            const timeSinceLastGeocode = now - lastGeocodeTime;
            if (timeSinceLastGeocode < 1100) {
              await delay(1100 - timeSinceLastGeocode);
            }
            lastGeocodeTime = Date.now();
            
            try {
              const geocodeResult = await geocodeAddress(address);
              if (geocodeResult) {
                coords = geocodeResult;
                source = "address_parts";
              }
            } catch (error: any) {
              console.error(`Error geocoding address_parts for ${club.name}:`, error.message || String(error));
            }
          }
        }

        if (coords) {
          // Actions need to use ctx.runMutation to update the database
          // Type assertion to break circular reference during type checking
          await ctx.runMutation((api as any).clubs.updateClubCoordinates, {
            clubId: club._id,
            lat: coords.lat,
            lng: coords.lng,
          });
          
          if (source === "maps_url") {
            updated++;
          } else {
            geocoded++;
          }
        } else {
          // Log why it failed with more detail
          const reasons: string[] = [];
          if (club.maps_url) {
            reasons.push(`maps_url exists but couldn't extract coords`);
          } else {
            reasons.push("no maps_url");
          }
          if (!club.name) reasons.push("no club name");
          if (!club.full_address) reasons.push("no full_address");
          if (!club.street_address && !club.city && !club.postcode) reasons.push("no address parts");
          
          const errorMsg = `${club.name || "Unknown club"}: ${reasons.join(", ")}`;
          errorDetails.push(errorMsg);
          console.error(`❌ Failed to get coordinates for: ${errorMsg}`);
          errors++;
        }
      } catch (error: any) {
        errorDetails.push(`${club.name}: ${error.message || String(error)}`);
        errors++;
      }
      
      // Log progress every 25 clubs
      if ((i + 1) % 25 === 0) {
        console.log(`Progress: ${startIndex + i + 1}/${allClubs.length} clubs processed (${updated} from maps_url, ${geocoded} geocoded, ${errors} errors)`);
      }
    }

    // Log first 10 errors for debugging
    if (errorDetails.length > 0) {
      console.log("\n⚠️  Sample errors (first 10):");
      errorDetails.slice(0, 10).forEach((err) => console.log(`   ${err}`));
      if (errorDetails.length > 10) {
        console.log(`   ... and ${errorDetails.length - 10} more`);
      }
    }

    return {
      total: allClubs.length,
      updated,
      geocoded,
      errors,
      skipped,
      processed: startIndex + clubs.length,
      hasMore,
      nextStartIndex: hasMore ? startIndex + batchSize : startIndex + clubs.length,
      errorDetails: errorDetails.slice(0, 20), // Return first 20 for debugging
    };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clubs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getCityBySlug = query({
  args: { citySlug: v.string() },
  handler: async (ctx, args) => {
    // Convert slug back to city name (replace hyphens with spaces, capitalize)
    const cityName = args.citySlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const clubs = await ctx.db
      .query("clubs")
      .withIndex("by_city", (q) => q.eq("city", cityName))
      .collect();

    // Sort: featured first, then by rating
    clubs.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      const countA = a.rating_count ?? 0;
      const countB = b.rating_count ?? 0;
      return countB - countA;
    });

    return {
      city: cityName,
      clubs,
    };
  },
});

export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const clubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("is_featured"), true))
      .collect();

    // Sort by rating
    clubs.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    if (args.limit) {
      return clubs.slice(0, args.limit);
    }

    return clubs;
  },
});

export const getFeaturedByCity = query({
  args: { 
    city: v.string(),
    excludeSlug: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let clubs = await ctx.db
      .query("clubs")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .filter((q) => q.eq(q.field("is_featured"), true))
      .collect();

    // Exclude the current club if excludeSlug is provided
    if (args.excludeSlug) {
      clubs = clubs.filter((club) => club.slug !== args.excludeSlug);
    }

    // Sort by rating (descending)
    clubs.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    if (args.limit) {
      return clubs.slice(0, args.limit);
    }

    return clubs;
  },
});

export const fixClubPlans = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all clubs
    const allClubs = await ctx.db.query("clubs").collect();
    
    let updated = 0;
    let fixed = 0;
    
    for (const club of allClubs) {
      const updates: any = {};
      
      // If club doesn't have a plan, set it to basic
      if (!club.plan) {
        updates.plan = "basic";
        updates.is_featured = false;
        fixed++;
      } else {
        // Sync is_featured based on plan
        const shouldBeFeatured = club.plan === "featured";
        if (club.is_featured !== shouldBeFeatured) {
          updates.is_featured = shouldBeFeatured;
          updated++;
        }
      }
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(club._id, updates);
      }
    }
    
    return {
      success: true,
      totalClubs: allClubs.length,
      fixed: fixed, // Clubs that had no plan
      updated: updated, // Clubs where is_featured was out of sync
    };
  },
});

/**
 * Clear all image_url and logo_url fields from clubs
 * This ensures we only use Pexels images to avoid copyright infringement
 */
export const clearAllImageUrls = mutation({
  args: {},
  handler: async (ctx) => {
    const allClubs = await ctx.db.query("clubs").collect();
    
    let cleared = 0;
    
    for (const club of allClubs) {
      const updates: any = {};
      
      // Clear image URLs to ensure we only use Pexels
      if (club.image_url) {
        updates.image_url = undefined;
        cleared++;
      }
      if (club.logo_url) {
        updates.logo_url = undefined;
        cleared++;
      }
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(club._id, updates);
      }
    }
    
    return {
      success: true,
      totalClubs: allClubs.length,
      cleared: cleared, // Number of clubs that had image URLs cleared
    };
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const clubs = await ctx.db.query("clubs").collect();
    const cities = new Set(clubs.map((c) => c.city).filter(Boolean));
    const totalReviews = clubs.reduce(
      (sum, c) => sum + (c.rating_count ?? 0),
      0
    );

    return {
      totalClubs: clubs.length,
      totalCities: cities.size,
      totalReviews,
      averageRating:
        clubs.reduce((sum, c) => sum + (c.rating ?? 0), 0) /
        clubs.filter((c) => c.rating).length,
    };
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const clubs = await ctx.db.query("clubs").collect();
    const categorySet = new Set<string>();
    
    clubs.forEach((club) => {
      club.categories.forEach((cat) => categorySet.add(cat));
    });

    return Array.from(categorySet).sort();
  },
});

export const getAmenities = query({
  args: {},
  handler: async (ctx) => {
    const clubs = await ctx.db.query("clubs").collect();
    const amenitySet = new Set<string>();
    
    clubs.forEach((club) => {
      if (club.amenities && club.amenities.length > 0) {
        club.amenities.forEach((amenity) => {
          if (amenity && amenity.trim()) {
            amenitySet.add(amenity.trim());
          }
        });
      }
    });

    return Array.from(amenitySet).sort();
  },
});

export const getCities = query({
  args: {
    sortBy: v.optional(v.union(v.literal("alphabetical"), v.literal("count"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const clubs = await ctx.db.query("clubs").collect();
    const cityMap = new Map<string, number>();

    clubs.forEach((club) => {
      if (club.city) {
        const count = cityMap.get(club.city) || 0;
        cityMap.set(club.city, count + 1);
      }
    });

    let cities = Array.from(cityMap.entries()).map(([city, count]) => ({
      city,
      count,
    }));

    if (args.sortBy === "count") {
      cities.sort((a, b) => b.count - a.count);
    } else {
      cities.sort((a, b) => a.city.localeCompare(b.city));
    }

    if (args.limit) {
      cities = cities.slice(0, args.limit);
    }

    return cities;
  },
});
