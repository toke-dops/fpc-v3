"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ClubCard } from "@/components/club-card";
import { ClubFilters } from "@/components/club-filters";
import { Search, Loader2, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistance, geocodeLocation, isUKPostcode, mightBeLocation } from "@/lib/geolocation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClubsPage() {
  const [searchInput, setSearchInput] = useState(""); // What user types
  const [searchTerm, setSearchTerm] = useState(""); // What we actually search for
  const [minRating, setMinRating] = useState(0);
  const [mustHaveBooking, setMustHaveBooking] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    city?: string;
  } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGeocodingSearch, setIsGeocodingSearch] = useState(false);
  const [searchRadius, setSearchRadius] = useState(0); // in miles, default 0 = "Any distance"
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Show location prompt on page load
  useEffect(() => {
    // Check if user has already dismissed the prompt
    const hasSeenPrompt = sessionStorage.getItem("locationPromptDismissed");
    if (!hasSeenPrompt && !userLocation && !searchTerm) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowLocationPrompt(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Extract city name from search term if it looks like a city name
  // This helps when user searches for "Gloucester" or "City of London, Greater London" - we want to filter by city
  const extractedCity = useMemo(() => {
    // ALWAYS check searchTerm FIRST for London variations - this ensures "City of London, Greater London" is normalized to "London"
    // BEFORE checking userLocation.city, which might come from geocoding and be different
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      
      // Handle London variations FIRST - normalize all London variations to "London"
      // This handles "City of London", "Greater London", "City of London, Greater London", etc.
      if (searchLower.includes("london")) {
        return "London"; // Always return "London" for any London variation in search term
      }
      
      // For other cities, try to extract from search term
      let extracted = searchTerm.trim();
      
      // Split by comma and take first part
      const parts = extracted.split(",");
      extracted = parts[0].trim();
      
      // Remove "City of " prefix if present
      extracted = extracted.replace(/^city of\s+/i, "").trim();
      
      // Remove "Greater " prefix if present
      extracted = extracted.replace(/^greater\s+/i, "").trim();
      
      // If it's a single word or two words, it might be a city name
      const words = extracted.split(/\s+/);
      if (words.length <= 3 && words.length > 0) {
        // Capitalize first letter of each word (e.g., "gloucester" -> "Gloucester")
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    }
    
    // Fallback to userLocation city if available (from geocoding), but normalize London
    if (userLocation?.city) {
      // Normalize London variations
      if (userLocation.city.toLowerCase().includes("london")) {
        return "London";
      }
      return userLocation.city;
    }
    
    return undefined;
  }, [searchTerm, userLocation?.city]);

  // Fetch clubs with filters
  // When userLocation is set, use proximity search (searchLat/searchLng)
  // Otherwise, use regular search without location
  const clubs = useQuery(api.clubs.list, {
    search: searchTerm || undefined,
    minRating: minRating > 0 ? minRating : undefined,
    hasBooking: mustHaveBooking || undefined,
    amenities:
      selectedAmenities.length > 0 ? selectedAmenities : undefined,
    // Use new proximity search parameters when location is selected
    searchLat: userLocation?.lat,
    searchLng: userLocation?.lng,
    maxDistanceKm: userLocation && searchRadius > 0 ? searchRadius * 1.60934 : undefined, // If searchRadius is 0 (Any distance) or no location, don't filter by distance. Convert miles to km: 1 mile = 1.60934 km
    // Legacy parameters (kept for backward compatibility, but searchLat/searchLng take precedence)
    userLat: userLocation?.lat,
    userLng: userLocation?.lng,
    radiusKm: searchRadius > 0 && userLocation ? searchRadius * 1.60934 : undefined,
    // Use extracted city from search term, or city from geocoded location
    searchCity: extractedCity,
  });

  // Debug: Log when location is set
  useEffect(() => {
    if (userLocation) {
      console.log("[ClubsPage] User location set:", userLocation);
    }
  }, [userLocation]);

  // Fetch cities and amenities for filters
  const cities = useQuery(api.clubs.getCities, { sortBy: "alphabetical" });
  const allAmenities = useQuery(api.clubs.getAmenities, {});

  // Handle search button click
  const handleSearch = async (location?: { lat: number; lng: number; city?: string }) => {
    const trimmed = searchInput.trim();
    setSearchTerm(trimmed);
    setCurrentPage(1);
    
    // If location is provided from autocomplete, use it directly
    if (location) {
      setUserLocation(location);
      setLocationError(null);
      return;
    }
    
    // Always try to geocode if search term exists - this enables distance calculation for all location searches
    if (trimmed) {
      setIsGeocodingSearch(true);
      setLocationError(null);
      
      try {
        const geocodedLocation = await geocodeLocation(trimmed);
        
        if (geocodedLocation) {
          // Try to get city name from geocoding for better search results
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${geocodedLocation.lat}&lon=${geocodedLocation.lng}&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "UK-PadelFinder/1.0",
                },
              }
            );
            if (response.ok) {
              const data = await response.json();
              const address = data.address || {};
              // Try to get a meaningful city name - prioritize city/town, fallback to borough/district
              const city = address.city || address.town || address.village || 
                          address.suburb || address.borough || address.district || 
                          address.county || address.state || "London";
              setUserLocation({ ...geocodedLocation, city: city || "London" });
            } else {
              // Default to London if reverse geocoding fails (most UK searches are in London)
              setUserLocation({ ...geocodedLocation, city: "London" });
            }
          } catch (e) {
            // Default to London if reverse geocoding fails
            setUserLocation({ ...geocodedLocation, city: "London" });
          }
          setLocationError(null);
        } else {
          // No exact location found - search will still work with text search
          // but without distance calculation
          setUserLocation(null);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setUserLocation(null);
      } finally {
        setIsGeocodingSearch(false);
      }
    } else {
      setUserLocation(null);
    }
  };


  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported by your browser. Please use the search box instead."
      );
      return;
    }

    setIsLocationLoading(true);
    setLocationError(null);

      navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        // Try to get city name from reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`,
            {
              headers: {
                "User-Agent": "UK-PadelFinder/1.0",
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            const city = address.city || address.town || address.village || address.suburb || "";
            setUserLocation({ ...coords, city });
          } else {
            setUserLocation(coords);
          }
        } catch (e) {
          setUserLocation(coords);
        }
        
        setIsLocationLoading(false);
        setLocationError(null);
      },
      (error) => {
        setIsLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location access denied. Please enable location permissions or use the search box."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "Location information unavailable. Please try the search box instead."
            );
            break;
          case error.TIMEOUT:
            setLocationError(
              "Location request timed out. Please try again or use the search box."
            );
            break;
          default:
            setLocationError(
              "Unable to get your location. Please use the search box instead."
            );
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setMinRating(0);
    setMustHaveBooking(false);
    setSelectedAmenities([]);
    setUserLocation(null);
    setLocationError(null);
    setSearchRadius(0);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, minRating, mustHaveBooking, selectedAmenities, userLocation, searchRadius]);

  const isLoading = clubs === undefined;

  // Use clubs directly from query - they're already sorted by distance when location search is active
  // The backend returns distanceKm field when proximity search is used
  const clubsWithDistance = useMemo(() => {
    if (!clubs) return [];
    // Trust the server sort order - do NOT re-sort on client
    return clubs.map((club) => {
      // Backend returns distanceKm when proximity search is active
      const distanceKm = (club as any).distanceKm ?? (club as any).distance ?? null;
      return {
        ...club,
        distanceKm: distanceKm !== undefined && distanceKm !== null ? distanceKm : null,
        // Keep legacy distance field for backward compatibility
        distance: distanceKm,
      };
    });
  }, [clubs]);

  // Paginate clubs: when location search is active, preserve strict distance sort from backend
  // Otherwise, separate featured/regular and paginate
  const { paginatedClubs, totalPages, totalClubs, regularClubsCount } = useMemo(() => {
    if (!clubsWithDistance || clubsWithDistance.length === 0) {
      return { paginatedClubs: { featured: [], regular: [] }, totalPages: 0, totalClubs: 0, regularClubsCount: 0 };
    }

    // When location search is active, backend already sorted by distance - preserve that order
    if (userLocation) {
      // All clubs are already sorted by distance - just paginate them
      const totalClubsCount = clubsWithDistance.length;
      const totalPages = Math.max(1, Math.ceil(totalClubsCount / itemsPerPage));
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedClubs = clubsWithDistance.slice(startIndex, endIndex);
      
      return {
        paginatedClubs: { featured: [], regular: paginatedClubs },
        totalPages,
        totalClubs: totalClubsCount,
        regularClubsCount: totalClubsCount,
      };
    }

    // No location search - use default featured/regular separation
    const featuredClubs = clubsWithDistance.filter((club) => club.is_featured);
    const regularClubs = clubsWithDistance.filter((club) => !club.is_featured);

    // Sort regular clubs by popularity (rating * rating_count)
    const sortedRegularClubs = [...regularClubs].sort((a, b) => {
      const scoreA = (a.rating || 0) * (a.rating_count || 0);
      const scoreB = (b.rating || 0) * (b.rating_count || 0);
      return scoreB - scoreA;
    });

    // Calculate pagination for regular clubs only
    const totalRegularClubs = sortedRegularClubs.length;
    const totalClubsCount = featuredClubs.length + totalRegularClubs;
    const totalPages = Math.max(1, Math.ceil(totalRegularClubs / itemsPerPage));

    // Get paginated regular clubs
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRegularClubs = sortedRegularClubs.slice(startIndex, endIndex);

    return {
      paginatedClubs: {
        featured: featuredClubs,
        regular: paginatedRegularClubs,
      },
      totalPages,
      totalClubs: totalClubsCount,
      regularClubsCount: totalRegularClubs,
    };
  }, [clubsWithDistance, currentPage, itemsPerPage]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-black text-slate-900 mb-4">
            Padel Clubs Directory
          </h1>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Discover padel clubs across the United Kingdom. Search by location, city, postcode, or club name. Browse ratings, read reviews, and find the perfect court for your next game.
          </p>
          <p className="text-muted-foreground text-sm">
            {isLoading
              ? "Loading clubs..."
              : isGeocodingSearch
                ? "Finding location..."
                : userLocation
                  ? `Showing ${totalClubs} clubs near "${searchTerm}"`
                  : searchTerm
                    ? `Found ${totalClubs} clubs matching "${searchTerm}"`
                    : `Showing ${totalClubs} padel clubs across the UK`}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <ClubFilters
            searchTerm={searchInput}
            onSearchChange={setSearchInput}
            onSearch={handleSearch}
            minRating={minRating}
            onMinRatingChange={setMinRating}
            mustHaveBooking={mustHaveBooking}
            onMustHaveBookingChange={setMustHaveBooking}
            selectedAmenities={selectedAmenities}
            onAmenitiesChange={setSelectedAmenities}
            searchRadius={searchRadius}
            onSearchRadiusChange={setSearchRadius}
            showRadiusFilter={true}
            cities={cities ?? []}
            amenities={allAmenities ?? []}
            onClearFilters={handleClearFilters}
            onUseLocation={handleUseLocation}
            isLocationLoading={isLocationLoading}
            locationError={locationError}
          />
        </div>

        {/* Location Prompt */}
        {showLocationPrompt && (
          <div className="mb-6 bg-primary/10 border border-primary/20 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MapPin className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Find clubs near you
                </h3>
                <p className="text-sm text-muted-foreground">
                  Share your location to see clubs in your area, or search for a city or postcode.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLocationPrompt(false);
                  sessionStorage.setItem("locationPromptDismissed", "true");
                }}
              >
                Dismiss
              </Button>
              <Button onClick={handleUseLocation} disabled={isLocationLoading}>
                {isLocationLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Locating...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Use my location
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : clubsWithDistance && clubsWithDistance.length > 0 ? (
          <>
            {/* Items per page selector and pagination info */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm text-muted-foreground">Items per page:</label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {totalPages > 0 && (
                  <>
                    Page {currentPage} of {totalPages} 
                    {regularClubsCount > 0 && ` (${regularClubsCount} clubs${paginatedClubs.featured.length > 0 ? `, ${paginatedClubs.featured.length} featured` : ''})`}
                  </>
                )}
              </div>
            </div>

            {/* Clubs List - when location search is active, show all clubs sorted by distance */}
            {userLocation ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedClubs.regular.map((club, index) => (
                    <div
                      key={club._id}
                      className="opacity-0 animate-fade-in"
                      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                    >
                      <ClubCard club={club} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Featured Clubs */}
                {paginatedClubs.featured.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">
                      Featured Clubs
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {paginatedClubs.featured.map((club, index) => (
                        <div
                          key={club._id}
                          className="opacity-0 animate-fade-in"
                          style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                        >
                          <ClubCard club={club} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Clubs */}
                {paginatedClubs.regular.length > 0 && (
                  <div>
                    {paginatedClubs.featured.length > 0 && (
                      <h2 className="text-2xl font-bold text-slate-900 mb-6">
                        All Clubs
                      </h2>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {paginatedClubs.regular.map((club, index) => (
                        <div
                          key={club._id}
                          className="opacity-0 animate-fade-in"
                          style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                        >
                          <ClubCard club={club} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, regularClubsCount)} of {regularClubsCount} clubs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="min-w-[40px]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No clubs found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or search terms.
            </p>
            <button
              onClick={handleClearFilters}
              className="text-primary font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
