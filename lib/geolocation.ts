/**
 * Calculate distance between two lat/lng points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if a string looks like a UK postcode (full or partial)
 */
export function isUKPostcode(text: string): boolean {
  const trimmed = text.trim();
  // Full UK postcode pattern: e.g., SW1A 1AA, M1 1AA, B33 8TH
  const fullPostcodeRegex =
    /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
  if (fullPostcodeRegex.test(trimmed)) {
    return true;
  }
  
  // Partial postcode pattern: e.g., E1, SW1, M1, B33 (common UK postcode prefixes)
  const partialPostcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?$/i;
  return partialPostcodeRegex.test(trimmed) && trimmed.length <= 4;
}

/**
 * Check if a string might be a location (postcode, city, or location name)
 */
export function mightBeLocation(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  
  // Check for postcode patterns
  if (isUKPostcode(trimmed)) return true;
  
  // Check for common location indicators
  if (trimmed.includes(",")) return true;
  if (/^\d/.test(trimmed)) return true; // Starts with number
  
  // Short strings (2-4 chars) that look like postcode areas
  if (trimmed.length <= 4 && /^[A-Z]{1,2}\d{1,2}$/i.test(trimmed)) {
    return true;
  }
  
  return false;
}

/**
 * Geocode a UK postcode or location using postcodes.io (free, no API key)
 */
export async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const trimmed = location.trim().toUpperCase();
    
    // If it looks like a full postcode, try postcodes.io first
    const fullPostcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    if (fullPostcodeRegex.test(trimmed)) {
      const postcode = trimmed.replace(/\s+/g, " ");
      const response = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 200 && data.result) {
          return {
            lat: data.result.latitude,
            lng: data.result.longitude,
          };
        }
      }
    }

    // For partial postcodes (like "E1", "SW1"), try postcodes.io autocomplete
    const partialPostcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?$/i;
    if (partialPostcodeRegex.test(trimmed) && trimmed.length <= 4) {
      // Try postcodes.io autocomplete API
      try {
        const response = await fetch(
          `https://api.postcodes.io/postcodes/${encodeURIComponent(trimmed)}/autocomplete`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.status === 200 && data.result && data.result.length > 0) {
            // Use the first result
            const firstPostcode = data.result[0];
            const fullResponse = await fetch(
              `https://api.postcodes.io/postcodes/${encodeURIComponent(firstPostcode)}`
            );
            if (fullResponse.ok) {
              const fullData = await fullResponse.json();
              if (fullData.status === 200 && fullData.result) {
                return {
                  lat: fullData.result.latitude,
                  lng: fullData.result.longitude,
                };
              }
            }
          }
        }
      } catch (e) {
        // Fall through to Nominatim
      }
    }

    // Try as a general location search using Nominatim (OpenStreetMap)
    // For partial postcodes, append "UK" to help with geocoding
    const searchQuery = trimmed.length <= 4 && partialPostcodeRegex.test(trimmed)
      ? `${trimmed}, UK`
      : `${location}, UK`;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}&limit=1`,
      {
        headers: {
          "User-Agent": "UK-PadelFinder/1.0",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  return null;
}

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

/**
 * Convert miles to kilometers
 */
export function milesToKm(miles: number): number {
  return miles * 1.60934;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number, useMiles: boolean = true): string {
  const distance = useMiles ? kmToMiles(km) : km;
  const unit = useMiles ? "mi" : "km";
  
  if (distance < 1) {
    return `${Math.round(distance * 10) / 10} ${unit}`;
  }
  return `${Math.round(distance * 10) / 10} ${unit}`;
}

