"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Calendar, ChevronRight } from "lucide-react";
import { formatDistance } from "@/lib/geolocation";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { getPexelsImageDirect } from "@/lib/pexels-images";

interface ClubCardProps {
  club: Doc<"clubs"> & { distance?: number | null | undefined };
}

export function ClubCard({ club }: ClubCardProps) {
  const trackEvent = useMutation(api.analytics.trackEvent);

  const handleBookingClick = async () => {
    await trackEvent({ club_id: club._id, type: "booking_click" });
  };

  // Use direct Pexels URL - Next.js Image component handles caching and optimization
  // Each club gets a unique, consistent image based on their slug
  const imageUrl = getPexelsImageDirect(club.slug, 400, 300);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full card-hover">
      {/* Image */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
        <Image
          src={imageUrl}
          alt={club.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          quality={85}
        />
        {club.is_featured && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
            Featured
          </Badge>
        )}
        {club.rating && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-800">
              {club.rating.toFixed(1)}
            </span>
            {club.rating_count && (
              <span className="text-[10px] text-slate-500">
                ({club.rating_count})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex-grow">
          {/* Category */}
          <div className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1.5">
            {club.categories[0] || "Padel Club"}
          </div>

          {/* Name */}
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1 mb-2">
            <Link href={`/clubs/${club.slug}`}>{club.name}</Link>
          </h3>

          {/* Location */}
          <div className="flex items-start gap-1.5 text-slate-500 text-sm mb-4">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="line-clamp-1 flex-1">
                  {[club.city, club.postcode].filter(Boolean).join(", ") ||
                    "United Kingdom"}
                </span>
                {/* Proximity badge - show when distanceKm is available (from location search) */}
                {(() => {
                  const distanceKm = (club as any).distanceKm ?? (club as any).distance;
                  if (typeof distanceKm === "number" && !isNaN(distanceKm) && distanceKm >= 0) {
                    // Format: show meters if < 1km, otherwise km with 1 decimal
                    const distanceText = distanceKm < 1 
                      ? `${Math.round(distanceKm * 1000)} m away`
                      : `${distanceKm.toFixed(1)} km away`;
                    
                    return (
                      <Badge 
                        variant="secondary" 
                        className="text-xs font-semibold bg-primary/10 text-primary border-primary/30 whitespace-nowrap flex-shrink-0"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        {distanceText}
                      </Badge>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <Button variant="secondary" size="sm" className="flex-1" asChild>
            <Link href={`/clubs/${club.slug}`}>
              Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          {club.booking_url ? (
            <Button
              size="sm"
              className="flex-1"
              onClick={handleBookingClick}
              asChild
            >
              <a
                href={club.booking_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Calendar className="w-4 h-4 mr-1" />
                Book
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/clubs/${club.slug}#contact`}>Enquire</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

