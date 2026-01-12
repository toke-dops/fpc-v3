"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ClubCard } from "@/components/club-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, Loader2 } from "lucide-react";

// Convert slug back to city name (fallback for display while loading)
function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function CityPage() {
  const params = useParams();
  const citySlug = params.citySlug as string;
  
  // Use dedicated query to get the proper city name from slug
  const cityData = useQuery(api.clubs.getCityBySlug, { slug: citySlug });
  
  // Fallback display name while loading
  const displayName = cityData?.name ?? slugToDisplayName(citySlug);
  
  // Fetch clubs for this city (only when we have the actual city name)
  const clubs = useQuery(
    api.clubs.getByCity,
    cityData?.name ? { city: cityData.name } : "skip"
  );
  
  // Fetch other cities for the "Other Popular Cities" section
  const otherCities = useQuery(api.clubs.getCities, { sortBy: "count", limit: 12 });

  const isLoading = cityData === undefined || clubs === undefined;

  // Handle city not found
  const cityNotFound = cityData === null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-court-dark via-court to-court-light text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link
            href="/clubs"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-medium mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> All Clubs
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">
                Padel Clubs in
              </p>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                Padel Clubs in {displayName}
              </h1>
            </div>
          </div>

          <p className="text-white/80 max-w-2xl mt-4 leading-relaxed">
            {isLoading
              ? "Loading clubs..."
              : cityNotFound
                ? `We couldn't find "${displayName}" in our directory.`
                : clubs && clubs.length > 0
                  ? `Discover ${clubs.length} padel ${clubs.length === 1 ? "club" : "clubs"} in ${displayName}. Compare ratings, read reviews, and book your next game.`
                  : `We're still building our directory in ${displayName}. Check back soon!`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : cityNotFound ? (
          <div className="py-24 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              City not found
            </h3>
            <p className="text-muted-foreground mb-6">
              We couldn&apos;t find &quot;{displayName}&quot; in our directory. Try browsing all clubs or check out popular cities below.
            </p>
            <Button asChild>
              <Link href="/clubs">Browse All Clubs</Link>
            </Button>
          </div>
        ) : clubs && clubs.length > 0 ? (
          <>
            {/* SEO Intro */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm mb-8">
              <p className="text-muted-foreground leading-relaxed">
                Padel is rapidly growing in {displayName}, with{" "}
                {clubs.length} {clubs.length === 1 ? "padel venue" : "padel venues"}{" "}
                currently available. Whether you&apos;re a beginner looking to
                try the sport or an experienced player seeking new courts,
                you&apos;ll find great options in the area. Browse the clubs
                below, sorted by rating and subscription plan, to find the perfect place to play. 
                Featured and business plan clubs are prioritized in search results, ensuring 
                you discover the best facilities with the most comprehensive information.
              </p>
            </div>

            {/* Clubs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {clubs.map((club, index) => (
                <div
                  key={club._id}
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                >
                  <ClubCard club={club} />
                </div>
              ))}
            </div>

            {/* Internal Links */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-muted-foreground font-medium">Explore more:</span>
                <Link
                  href="/clubs"
                  className="text-primary hover:underline font-medium"
                >
                  Browse All Clubs
                </Link>
                {otherCities && otherCities.length > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">Popular Cities:</span>
                    {otherCities
                      .filter((c) => c.slug.toLowerCase() !== citySlug.toLowerCase())
                      .slice(0, 5)
                      .map((city, idx) => (
                        <span key={city.slug}>
                          {idx > 0 && <span className="text-muted-foreground mx-1">•</span>}
                          <Link
                            href={`/city/${city.slug}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {city.name}
                          </Link>
                        </span>
                      ))}
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-24 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No clubs found in {displayName}
            </h3>
            <p className="text-muted-foreground mb-6">
              We&apos;re constantly adding new clubs. Check back soon!
            </p>
            <Button asChild>
              <Link href="/clubs">Browse All Clubs</Link>
            </Button>
          </div>
        )}

        {/* Other Popular Cities */}
        {otherCities && otherCities.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-bold text-slate-900 mb-6">
              Other Popular Cities
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherCities
                .filter((c) => c.slug.toLowerCase() !== citySlug.toLowerCase())
                .slice(0, 11)
                .map((city) => (
                  <Link
                    key={city.slug}
                    href={`/city/${city.slug}`}
                    className="px-4 py-2 bg-white rounded-full border text-sm font-medium text-slate-700 hover:border-primary hover:text-primary transition-colors"
                  >
                    {city.name} ({city.count})
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

