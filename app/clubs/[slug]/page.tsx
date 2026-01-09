"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Globe as GlobeIcon,
  Calendar,
  Star,
  Clock,
  ChevronLeft,
  ShieldCheck,
  Loader2,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  CheckCircle2,
  Grid3x3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContactForm } from "@/components/contact-form";
import { ClaimClubModal } from "@/components/claim-club-modal";
import { getPexelsImageDirect } from "@/lib/pexels-images";
import { JsonLd } from "@/components/json-ld";
import { generateClubSchema, generateBreadcrumbSchema, getCanonicalUrl, generateCitySlug } from "@/lib/seo";
import dynamic from "next/dynamic";

// Dynamically import map component to avoid SSR issues with Leaflet
const ClubLocationMapWrapper = dynamic(
  () =>
    import("@/components/club-location-map").then(
      (mod) => mod.ClubLocationMapWrapper
    ),
  { ssr: false }
);

// Helper function to generate unique club descriptions
function generateClubDescription(club: {
  name: string;
  city?: string | null;
  categories: string[];
  rating?: number | null;
  rating_count?: number | null;
  booking_url?: string | null;
}): string {
  const parts: string[] = [];

  // Build venue type description from categories
  const categoryLower = club.categories.map((c) => c.toLowerCase()).join(", ");
  let venueType = "padel venue";
  
  if (categoryLower.includes("padel club")) {
    venueType = "padel club";
  } else if (categoryLower.includes("padel court")) {
    venueType = "padel court";
  } else if (categoryLower.includes("padel") && categoryLower.includes("pickleball")) {
    venueType = "padel and pickleball venue";
  } else if (categoryLower.includes("padel") && categoryLower.includes("tennis")) {
    venueType = "padel and tennis facility";
  } else if (categoryLower.includes("padel")) {
    venueType = "padel facility";
  }

  // First sentence: Name, location, and venue type
  const location = club.city || "the UK";
  parts.push(
    `${club.name} is a ${venueType} located in ${location}.`
  );

  // Second sentence: Rating, booking, and play style
  const secondSentenceParts: string[] = [];

  // Add rating information if available
  if (club.rating && club.rating_count) {
    if (club.rating >= 4.5 && club.rating_count >= 20) {
      secondSentenceParts.push("highly rated by local players");
    } else if (club.rating >= 4.0) {
      secondSentenceParts.push("well-rated by players");
    } else if (club.rating_count >= 10) {
      secondSentenceParts.push("rated by local players");
    }
  }

  // Add booking information
  if (club.booking_url) {
    secondSentenceParts.push("offers online booking");
  }

  // Add play style hint based on rating count
  if (club.rating_count && club.rating_count >= 30) {
    secondSentenceParts.push("popular with both casual and competitive players");
  } else if (club.rating_count && club.rating_count >= 10) {
    secondSentenceParts.push("suitable for players of all levels");
  } else if (secondSentenceParts.length === 0) {
    // Only add default if we haven't added anything else
    secondSentenceParts.push("welcoming players of all skill levels");
  }

  // Combine second sentence parts
  if (secondSentenceParts.length > 0) {
    // Use "It" instead of "The venue" for better flow
    const secondSentence = `It ${secondSentenceParts.join(", ")}.`;
    parts.push(secondSentence);
  }

  return parts.join(" ");
}

// Component for featured club card with cached images
function FeaturedClubCard({ club }: { club: any }) {
  // Use direct Pexels URL - Next.js Image component handles caching and optimization
  const imageUrl = getPexelsImageDirect(club.slug, 400, 300);

  return (
    <div className="group border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/clubs/${club.slug}`}>
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={club.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            quality={85}
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            {club.name}
          </h3>
          {club.rating && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{club.rating.toFixed(1)}</span>
              {club.rating_count && (
                <span className="text-xs">({club.rating_count})</span>
              )}
            </div>
          )}
          {club.city && (
            <p className="text-sm text-muted-foreground mt-1">{club.city}</p>
          )}
        </div>
      </Link>
    </div>
  );
}

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const { user: clerkUser } = useUser();
  const sessionStartTime = useRef<number | null>(null);

  const club = useQuery(api.clubs.getBySlug, { slug });
  const trackEvent = useMutation(api.analytics.trackEvent);
  const currentUser = useQuery(api.users.getCurrentUser);
  const featuredClubs = useQuery(
    api.clubs.getFeaturedByCity,
    club?.city ? { city: club.city, excludeSlug: club.slug, limit: 6 } : "skip"
  );
  // Check if owner exists for claimed clubs
  const owner = useQuery(
    api.users.getUserById,
    club?.owner_user_id ? { userId: club.owner_user_id } : "skip"
  );

  // Check if current user is the club owner
  const isOwner = currentUser && club && currentUser._id === club.owner_user_id;

  // Track page view (only if not owner)
  useEffect(() => {
    if (club && !isOwner) {
      sessionStartTime.current = Date.now();
      const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : undefined;
      const referrer = typeof window !== "undefined" ? document.referrer || undefined : undefined;
      
      trackEvent({ 
        club_id: club._id, 
        type: "view",
        user_agent: userAgent,
        referrer: referrer,
        is_owner: false,
      });
    }
  }, [club, trackEvent, isOwner]);

  // Track session end when user leaves the page
  useEffect(() => {
    if (!club || isOwner) return;

    const handleVisibilityChange = () => {
      if (document.hidden && sessionStartTime.current) {
        const duration = Date.now() - sessionStartTime.current;
        trackEvent({
          club_id: club._id,
          type: "session_end",
          session_duration: duration,
          is_owner: false,
        });
        sessionStartTime.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (sessionStartTime.current) {
        const duration = Date.now() - sessionStartTime.current;
        trackEvent({
          club_id: club._id,
          type: "session_end",
          session_duration: duration,
          is_owner: false,
        });
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [club, trackEvent, isOwner]);

  const handleBookingClick = async () => {
    if (club && !isOwner) {
      await trackEvent({ club_id: club._id, type: "booking_click", is_owner: false });
    }
  };

  const handleSocialClick = async (type: "facebook_click" | "instagram_click" | "linkedin_click" | "twitter_click") => {
    if (club && !isOwner) {
      await trackEvent({ club_id: club._id, type, is_owner: false });
    }
  };

  const handleWebsiteClick = async () => {
    if (club && !isOwner) {
      await trackEvent({ club_id: club._id, type: "website_click", is_owner: false });
    }
  };

  const handlePhoneClick = async () => {
    if (club && !isOwner) {
      await trackEvent({ club_id: club._id, type: "phone_click", is_owner: false });
    }
  };

  if (club === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (club === null) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Club not found
        </h2>
        <Button variant="link" onClick={() => router.push("/clubs")}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Directory
        </Button>
      </div>
    );
  }

  // Use ONLY Pexels API for royalty-free padel images
  // Every club gets a unique padel-related image based on their slug
  // We do not use club.image_url to avoid copyright infringement
  // Next.js Image component handles caching and optimization automatically
  const imageUrl = getPexelsImageDirect(club.slug, 1200, 600);

  // Generate JSON-LD structured data
  const clubSchema = generateClubSchema({
    name: club.name,
    city: club.city,
    street_address: club.street_address,
    full_address: club.full_address,
    postcode: club.postcode,
    phone: club.phone,
    website: club.website,
    contact_email: (club as any).contact_email,
    lat: club.lat,
    lng: club.lng,
    opening_hours_raw: club.opening_hours_raw,
    rating: club.rating,
    rating_count: club.rating_count,
    facebook: club.facebook,
    instagram: club.instagram,
    twitter: club.twitter,
    linkedin: club.linkedin,
    booking_url: club.booking_url,
    number_of_courts: (club as any).number_of_courts,
    description: club.description,
  });

  // Generate breadcrumb schema
  const breadcrumbItems = [
    { name: "Home", url: getCanonicalUrl("/") },
    { name: "Padel Clubs", url: getCanonicalUrl("/padel-clubs") },
  ];
  if (club.city) {
    breadcrumbItems.push({ 
      name: `Padel Clubs in ${club.city}`, 
      url: getCanonicalUrl(`/padel-clubs/${generateCitySlug(club.city)}`) 
    });
  }
  breadcrumbItems.push({ 
    name: club.name, 
    url: getCanonicalUrl(`/clubs/${club.slug}`) 
  });
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <JsonLd data={clubSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="bg-slate-50 pb-24">
      {/* Hero Header */}
      <div className="relative h-[300px] md:h-[450px]">
        <Image
          src={imageUrl}
          alt={club.name}
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        <div className="absolute bottom-12 w-full">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => router.back()}
              className="mb-8 flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {club.categories.slice(0, 3).map((cat) => (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="bg-primary/20 backdrop-blur-md border-primary/30 text-primary-foreground"
                    >
                      {cat}
                    </Badge>
                  ))}
                  {club.status === "claimed" && club.owner_user_id && owner && (
                    <Badge
                      variant="success"
                      className="bg-green-500/20 backdrop-blur-md border-green-400/30 text-green-100"
                    >
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Claimed
                    </Badge>
                  )}
                </div>

                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight flex-1">
                    {club.name}
                  </h1>
                  {club.status === "unclaimed" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 mt-2"
                      onClick={() => setClaimModalOpen(true)}
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Claim Listing
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/90 text-sm">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    {[club.city, club.postcode].filter(Boolean).join(", ") ||
                      "United Kingdom"}
                  </div>
                  {club.rating && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="font-bold">{club.rating.toFixed(1)}</span>
                      {club.rating_count && (
                        <span className="opacity-70">
                          ({club.rating_count} reviews)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {club.booking_url ? (
                  <Button size="lg" onClick={handleBookingClick} asChild>
                    <a
                      href={club.booking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Book Now
                    </a>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-slate-900 hover:bg-slate-50"
                    asChild
                  >
                    <a href="#contact">Contact Club</a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <section className="bg-white p-8 rounded-2xl border shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              About the Club
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {generateClubDescription(club)}
            </p>

            {/* Number of Courts */}
            {(club as any).number_of_courts && (
              <div className="mb-8">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                    <Grid3x3 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Number of Courts
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {(club as any).number_of_courts} {Number((club as any).number_of_courts) === 1 ? 'Court' : 'Courts'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Amenities/Features */}
            {club.amenities && club.amenities.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Features & Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {club.amenities.map((amenity, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1.5" />
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Features */}
            {(club as any).additional_features && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Additional Features & Information</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {(club as any).additional_features}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Address - show full address or best combination */}
              {(club.full_address || club.street_address || club.city) && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100 flex-shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Address
                    </p>
                    <p className="text-sm font-semibold text-slate-900 break-words">
                      {club.full_address ||
                        [
                          club.street_address,
                          club.city,
                          club.postcode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Opening Hours - format as list if comma-separated */}
              {club.opening_hours_raw && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100 flex-shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Opening Hours
                    </p>
                    {club.opening_hours_raw.includes(",") ? (
                      <ul className="text-sm font-semibold text-slate-900 space-y-0.5">
                        {club.opening_hours_raw.split(",").map((day, index) => (
                          <li key={index} className="break-words">
                            {day.trim()}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 break-words whitespace-pre-line">
                        {club.opening_hours_raw}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {club.phone && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Phone
                    </p>
                    <a
                      href={`tel:${club.phone}`}
                      className="text-sm font-semibold text-slate-900 hover:text-primary"
                      onClick={handlePhoneClick}
                    >
                      {club.phone}
                    </a>
                  </div>
                </div>
              )}

              {club.website && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                    <GlobeIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Website
                    </p>
                    <a
                      href={club.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Visit Official Site
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Social Media Links */}
            {(club.facebook || club.instagram || club.linkedin || club.twitter) && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Connect With Us</h3>
                <div className="flex flex-wrap gap-3">
                  {club.facebook && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={club.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                        onClick={() => handleSocialClick("facebook_click")}
                      >
                        <Facebook className="w-4 h-4 text-blue-600" />
                        Facebook
                      </a>
                    </Button>
                  )}
                  {club.instagram && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={club.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                        onClick={() => handleSocialClick("instagram_click")}
                      >
                        <Instagram className="w-4 h-4 text-pink-600" />
                        Instagram
                      </a>
                    </Button>
                  )}
                  {club.linkedin && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={club.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                        onClick={() => handleSocialClick("linkedin_click")}
                      >
                        <Linkedin className="w-4 h-4 text-blue-700" />
                        LinkedIn
                      </a>
                    </Button>
                  )}
                  {club.twitter && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={club.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                        onClick={() => handleSocialClick("twitter_click")}
                      >
                        <Twitter className="w-4 h-4 text-sky-500" />
                        Twitter
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Contact Form */}
          <section
            id="contact"
            className="bg-white p-8 rounded-2xl border shadow-sm"
          >
            <ContactForm clubId={club._id} clubName={club.name} />
          </section>

          {/* Featured Clubs Section */}
          {club.city && featuredClubs && featuredClubs.length > 0 && (
            <section className="bg-white p-8 rounded-2xl border shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Featured Clubs in {club.city}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  // Randomize order on client side
                  const shuffled = [...featuredClubs].sort(() => Math.random() - 0.5);
                  return shuffled.map((featuredClub) => {
                    return (
                      <FeaturedClubCard key={featuredClub._id} club={featuredClub} />
                    );
                  });
                })()}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Claim Club */}
          {club.status === "unclaimed" && (
            <div className="p-6 rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Are you the owner?
              </h3>
              <p className="text-primary-foreground/80 text-sm mb-6 leading-relaxed">
                Claim this club to update details, reply to enquiries, and see
                analytics.
              </p>
              <Button
                className="w-full bg-white text-primary hover:bg-white/90"
                onClick={() => setClaimModalOpen(true)}
              >
                Claim this Listing
              </Button>
            </div>
          )}

          {/* Interactive Map */}
          <ClubLocationMapWrapper
            lat={club.lat}
            lng={club.lng}
            clubName={club.name}
            address={club.full_address}
            mapsUrl={club.maps_url}
          />

          {/* Quick Actions */}
          <div className="p-6 rounded-2xl bg-white border shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Quick Actions
            </h3>
            {club.booking_url && (
              <Button
                className="w-full"
                onClick={handleBookingClick}
                asChild
              >
                <a
                  href={club.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book a Court
                </a>
              </Button>
            )}
            {club.phone && (
              <Button variant="outline" className="w-full" asChild>
                <a href={`tel:${club.phone}`} onClick={handlePhoneClick}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call Club
                </a>
              </Button>
            )}
            {club.website && (
              <Button variant="outline" className="w-full" asChild>
                <a href={club.website} target="_blank" rel="noopener noreferrer" onClick={handleWebsiteClick}>
                  <GlobeIcon className="w-4 h-4 mr-2" />
                  Visit Website
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      {club && (
        <ClaimClubModal
          clubId={club._id}
          clubName={club.name}
          clubCity={club.city}
          isOpen={claimModalOpen}
          onClose={() => setClaimModalOpen(false)}
        />
      )}
      </div>
    </>
  );
}

