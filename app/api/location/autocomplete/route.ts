import { NextRequest, NextResponse } from "next/server";

/**
 * Location autocomplete API
 * Uses Nominatim (OpenStreetMap) for UK location suggestions
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // Use Nominatim for location autocomplete
    // Focus on UK locations by appending "UK" and using country code
    const searchQuery = `${query.trim()}, UK`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}&limit=5&countrycodes=gb&addressdetails=1`,
      {
        headers: {
          "User-Agent": "UK-PadelFinder/1.0 (contact@ukpadelfinder.com)",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = await response.json();
    
    // Format suggestions for dropdown
    const suggestions = data.map((item: any) => {
      const address = item.address || {};
      const displayName = item.display_name
        .split(",")
        .slice(0, 2)
        .join(",")
        .trim();
      
      return {
        displayName,
        fullName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        city: address.city || address.town || address.village || address.suburb || "",
        postcode: address.postcode || "",
        type: item.type || "location",
      };
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Location autocomplete error:", error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}

