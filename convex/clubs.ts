import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    userLat: v.optional(v.number()),
    userLng: v.optional(v.number()),
    radiusKm: v.optional(v.number()),
    searchCity: v.optional(v.string()), // City name from location search (for related city filtering)
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all clubs
    let clubs = await ctx.db.query("clubs").collect();

    // Apply text search if provided
    if (args.search && args.search.trim().length > 0) {
      const searchTerm = args.search.trim();
      
      // Filter and score clubs based on search term
      const scoredClubs = clubs
        .map((club) => ({
          club,
          score: calculateTextRelevance(club, searchTerm),
        }))
        .filter((item) => item.score > 0) // Only include clubs with some relevance
        .sort((a, b) => b.score - a.score); // Sort by relevance
      
      clubs = scoredClubs.map((item) => item.club);
    }

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

    // Calculate distances if user location provided
    if (args.userLat !== undefined && args.userLng !== undefined) {
      // Calculate distance for all clubs
      const clubsWithDistance = clubs.map((club) => {
        if (club.lat !== undefined && club.lng !== undefined) {
          const distance = calculateDistance(
            args.userLat!,
            args.userLng!,
            club.lat,
            club.lng
          );
          return { ...club, distance } as typeof club & { distance: number };
        }
        return { ...club, distance: null } as typeof club & { distance: null };
      });

      // If searchCity is provided, identify city-related clubs (for Featured/Business priority)
      const searchCityLower = args.searchCity?.toLowerCase().trim();
      const isCityRelated = (club: typeof clubsWithDistance[0]): boolean => {
        if (!searchCityLower) return false;
        const clubCityLower = club.city?.toLowerCase() || "";
        return clubCityLower.includes(searchCityLower) || searchCityLower.includes(clubCityLower);
      };

      // If radius is specified, filter first, otherwise show all with distances
      let filteredClubs = clubsWithDistance;
      if (args.radiusKm !== undefined && args.radiusKm > 0) {
        const radiusKm = args.radiusKm; // Capture for type narrowing
        filteredClubs = clubsWithDistance.filter((club) => {
          return club.distance !== null && club.distance <= radiusKm;
        });
      }

      // Sort: Featured (city-related) > Business (city-related) > Featured (other) > Business (other) > Basic (by proximity)
      filteredClubs.sort((a, b) => {
        const aIsFeatured = a.is_featured;
        const bIsFeatured = b.is_featured;
        const aIsBusiness = !aIsFeatured && a.plan === "business";
        const bIsBusiness = !bIsFeatured && b.plan === "business";
        const aIsCityRelated = isCityRelated(a);
        const bIsCityRelated = isCityRelated(b);

        // Priority 1: Featured clubs related to searched city
        if (aIsFeatured && aIsCityRelated && !(bIsFeatured && bIsCityRelated)) return -1;
        if (!(aIsFeatured && aIsCityRelated) && bIsFeatured && bIsCityRelated) return 1;
        
        // Priority 2: Business clubs related to searched city
        if (aIsBusiness && aIsCityRelated && !(bIsBusiness && bIsCityRelated)) return -1;
        if (!(aIsBusiness && aIsCityRelated) && bIsBusiness && bIsCityRelated) return 1;
        
        // Priority 3: Other Featured clubs
        if (aIsFeatured && !bIsFeatured) return -1;
        if (!aIsFeatured && bIsFeatured) return 1;
        
        // Priority 4: Other Business clubs
        if (aIsBusiness && !bIsBusiness) return -1;
        if (!aIsBusiness && bIsBusiness) return 1;
        
        // Priority 5: Within same plan tier, sort by distance (proximity)
        if (a.distance !== null && b.distance !== null) {
          if (a.distance !== b.distance) {
            return a.distance - b.distance;
          }
        } else if (a.distance !== null) {
          return -1;
        } else if (b.distance !== null) {
          return 1;
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

      // Apply limit
      if (args.limit) {
        return filteredClubs.slice(0, args.limit);
      }
      return filteredClubs;
    } else if (args.search && args.search.trim().length > 0) {
      // Text search without location - sort by plan priority then relevance
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
