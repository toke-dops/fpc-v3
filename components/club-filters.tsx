"use client";

import { useState, useEffect, useRef } from "react";
import { Search, CalendarCheck, MapPin, Filter, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";

interface City {
  city: string;
  count: number;
}

interface LocationSuggestion {
  displayName: string;
  fullName: string;
  lat: number;
  lng: number;
  city: string;
  postcode: string;
  type: string;
}

interface ClubFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: (location?: { lat: number; lng: number; city?: string }) => void;
  minRating: number;
  onMinRatingChange: (value: number) => void;
  mustHaveBooking: boolean;
  onMustHaveBookingChange: (value: boolean) => void;
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  searchRadius: number;
  onSearchRadiusChange: (value: number) => void;
  showRadiusFilter: boolean;
  cities: City[];
  amenities: string[];
  onClearFilters: () => void;
  onUseLocation: () => void;
  isLocationLoading: boolean;
  locationError: string | null;
}

const ratingOptions = [
  { value: 0, label: "Any" },
  { value: 3.5, label: "3.5+" },
  { value: 4.0, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
];

const radiusOptions = [
  { value: 0, label: "Any distance" },
  { value: 5, label: "5 miles" },
  { value: 10, label: "10 miles" },
  { value: 20, label: "20 miles" },
  { value: 50, label: "50 miles" },
];

export function ClubFilters({
  searchTerm,
  onSearchChange,
  onSearch,
  minRating,
  onMinRatingChange,
  mustHaveBooking,
  onMustHaveBookingChange,
  selectedAmenities,
  onAmenitiesChange,
  searchRadius,
  onSearchRadiusChange,
  showRadiusFilter: _showRadiusFilter,
  cities,
  amenities,
  onClearFilters,
  onUseLocation,
  isLocationLoading,
  locationError,
}: ClubFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Always show radius filter
  const showRadiusFilter = true;

  // Fetch location suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmed = searchTerm.trim();
      if (trimmed.length >= 2) {
        setIsLoadingSuggestions(true);
        try {
          const response = await fetch(`/api/location/autocomplete?q=${encodeURIComponent(trimmed)}`);
          if (response.ok) {
            const data = await response.json();
            setLocationSuggestions(data.suggestions || []);
            setShowSuggestions(data.suggestions && data.suggestions.length > 0);
          } else {
            setLocationSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setLocationSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onSearchChange(suggestion.displayName);
    setShowSuggestions(false);
    onSearch({
      lat: suggestion.lat,
      lng: suggestion.lng,
      city: suggestion.city || suggestion.displayName,
    });
  };

  const handleSearchClick = async () => {
    // If there's a suggestion that matches the search term, use it
    const matchingSuggestion = locationSuggestions.find(
      (s) => s.displayName.toLowerCase() === searchTerm.trim().toLowerCase()
    );
    
    if (matchingSuggestion) {
      onSearch({
        lat: matchingSuggestion.lat,
        lng: matchingSuggestion.lng,
        city: matchingSuggestion.city || matchingSuggestion.displayName,
      });
    } else {
      // Otherwise, try to geocode the search term
      onSearch();
    }
    setShowSuggestions(false);
  };

  const hasActiveFilters =
    searchTerm ||
    minRating > 0 ||
    mustHaveBooking ||
    searchRadius > 0;

  return (
    <div className="space-y-4">
      {/* Prominent Search Bar */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <Input
              type="text"
              placeholder="Search by club name, postcode, city, or location..."
              className="pl-10 h-12 text-base"
              value={searchTerm}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (e.target.value.trim().length >= 2) {
                  setShowSuggestions(true);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                if (locationSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchClick();
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
            />
            
            {/* Location Suggestions Dropdown */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isLoadingSuggestions && (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    Loading suggestions...
                  </div>
                )}
                {!isLoadingSuggestions && locationSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left p-3 hover:bg-slate-50 transition-colors border-b last:border-b-0"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {suggestion.displayName}
                        </div>
                        {suggestion.city && suggestion.city !== suggestion.displayName && (
                          <div className="text-xs text-muted-foreground truncate">
                            {suggestion.city}{suggestion.postcode ? `, ${suggestion.postcode}` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            type="button"
            className="h-12 px-6 whitespace-nowrap"
            onClick={handleSearchClick}
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 px-4 whitespace-nowrap"
            onClick={onUseLocation}
            disabled={isLocationLoading}
          >
            {isLocationLoading ? (
              <>
                <MapPin className="w-4 h-4 mr-2 animate-pulse" />
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
        {locationError && (
          <p className="mt-2 text-sm text-destructive">{locationError}</p>
        )}
      </div>

      {/* Filters - Collapsible on Mobile */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Mobile Header */}
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="md:hidden w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="font-semibold">Filters</span>
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                  {[
                    minRating > 0 ? 1 : 0,
                    mustHaveBooking ? 1 : 0,
                    searchRadius > 0 ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </div>
          {isFiltersOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Filter className="w-4 h-4" />
          )}
        </button>

        {/* Filters Content */}
        <div
          className={cn(
            "p-4 md:p-6 border-t md:border-t-0",
            isFiltersOpen ? "block" : "hidden md:block"
          )}
        >
          <div
            className={cn(
              "grid gap-4",
              showRadiusFilter
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-2"
            )}
          >
            {/* Radius Filter - only show when location is available */}
            {showRadiusFilter && (
              <div>
                <Label className="mb-2 block flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Within
                </Label>
                <Select
                  value={searchRadius.toString()}
                  onValueChange={(value) => onSearchRadiusChange(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {radiusOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}


            {/* Min Rating */}
            <div>
              <Label className="mb-2 block">Min Rating</Label>
              <div className="flex items-center gap-1">
                {ratingOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onMinRatingChange(option.value)}
                    className={cn(
                      "flex-grow py-2.5 px-2 rounded-lg border text-xs font-semibold transition-all",
                      minRating === option.value
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Online Booking */}
            <div className="flex items-end">
              <Button
                variant={mustHaveBooking ? "default" : "outline"}
                className="w-full"
                onClick={() => onMustHaveBookingChange(!mustHaveBooking)}
              >
                <CalendarCheck className="w-4 h-4 mr-2" />
                Online Booking
              </Button>
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t flex justify-end">
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
