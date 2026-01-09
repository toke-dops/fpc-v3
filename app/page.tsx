"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ClubCard } from "@/components/club-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  MapPin,
  Star,
  Calendar,
  Users,
  Search,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  FileText,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  const stats = useQuery(api.clubs.getStats);
  const featuredClubs = useQuery(api.clubs.getFeatured, { limit: 6 });
  const cities = useQuery(api.clubs.getCities, { sortBy: "count", limit: 12 });

  const topCities = cities ?? [];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-court-dark via-court to-court-light text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              <span>UK&apos;s fastest growing racket sport</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
              Find Your Perfect
              <span className="block text-padel-400">Padel Court</span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
              Discover {stats?.totalClubs ?? "200+"}  padel clubs across{" "}
              {stats?.totalCities ?? "50+"} cities in the UK. Book courts, read
              reviews, and start playing today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-white text-court hover:bg-white/90"
                asChild
              >
                <Link href="/clubs">
                  <Search className="w-5 h-5 mr-2" />
                  Find Clubs Near You
                </Link>
              </Button>
              <Button
                size="lg"
                className="bg-white text-slate-900 hover:bg-slate-100 border-0 shadow-lg"
                asChild
              >
                <Link href="/sign-up-club-owner">
                  List Your Club
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-primary mb-1">
                {stats?.totalClubs ?? "—"}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Padel Clubs
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-primary mb-1">
                {stats?.totalCities ?? "—"}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Cities Covered
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-primary mb-1">
                {stats?.totalReviews ? stats.totalReviews.toLocaleString() : "—"}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Total Reviews
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-primary mb-1">
                Free
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                To Use
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Everything You Need to Play
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From finding courts to booking sessions, we&apos;ve got you
              covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Find Nearby Courts
              </h3>
              <p className="text-muted-foreground">
                Search by city, postcode, or club name to find padel courts near
                you.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Star className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Read Reviews
              </h3>
              <p className="text-muted-foreground">
                See ratings and reviews from other players to find the best
                clubs.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border shadow-sm">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Book Instantly
              </h3>
              <p className="text-muted-foreground">
                Direct links to booking systems so you can reserve your court in
                seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Play Padel Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                Why Play Padel?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                Padel is the UK&apos;s fastest-growing racket sport, combining the
                best of tennis and squash into a social, beginner-friendly game
                that&apos;s perfect for players of all ages and skill levels. With new
                clubs opening across Britain every month, there&apos;s never been a
                better time to pick up a racket.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    Easy to Start
                  </h3>
                  <p className="text-muted-foreground">
                    Padel is beginner-friendly with a smaller court, solid walls
                    to play off, and a lower net. You&apos;ll be having fun rallies
                    from your first session, regardless of your experience level.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    Great Social Sport
                  </h3>
                  <p className="text-muted-foreground">
                    Played in doubles, padel is inherently social. It&apos;s perfect
                    for meeting new people, playing with friends, or joining a club
                    community. The smaller court keeps everyone involved in every
                    point.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    Growing Fast in Britain
                  </h3>
                  <p className="text-muted-foreground">
                    Padel is exploding in popularity across the UK, with new clubs
                    and courts opening regularly. Join the movement and be part of
                    Britain&apos;s fastest-growing racket sport.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">
                    Fun Fitness
                  </h3>
                  <p className="text-muted-foreground">
                    Get a great workout without needing perfect technique. Padel
                    combines cardio, agility, and strategy in a fun, accessible way
                    that keeps you moving and smiling.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about padel and using UK PadelFinder
              </p>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-6 md:p-8">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="what-is-padel">
                  <AccordionTrigger className="text-left font-semibold text-slate-900">
                    What is padel?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Padel is a racket sport that combines elements of tennis and
                    squash. It&apos;s played on a smaller court (about a third the size
                    of a tennis court) with solid walls you can play off, a lower net,
                    and typically in doubles format. The game uses solid paddles and
                    a depressurized ball, making it easier to control and more
                    beginner-friendly than tennis.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="find-clubs">
                  <AccordionTrigger className="text-left font-semibold text-slate-900">
                    How do I find padel clubs near me?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Use our search feature on the{" "}
                    <Link
                      href="/clubs"
                      className="text-primary hover:underline font-medium"
                    >
                      Find Clubs
                    </Link>{" "}
                    page. You can search by city, postcode, or club name. You can
                    also browse by city using our{" "}
                    <Link
                      href="/clubs"
                      className="text-primary hover:underline font-medium"
                    >
                      city directory
                    </Link>{" "}
                    to see all clubs in your area, sorted by rating.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="equipment">
                  <AccordionTrigger className="text-left font-semibold text-slate-900">
                    Do I need to bring my own racket and balls?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Most padel clubs offer racket and ball rental, especially for
                    beginners. It&apos;s a good idea to check with the club when you
                    book, but generally you can try the sport without investing in
                    equipment first. Once you&apos;re hooked, you can purchase your
                    own racket from sports retailers or the club itself.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cost">
                  <AccordionTrigger className="text-left font-semibold text-slate-900">
                    How much does it cost to play padel?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Court hire prices vary by club and location, typically ranging
                    from £15-40 per hour for a court. Many clubs offer off-peak
                    discounts, membership packages, and introductory sessions for
                    beginners. Check individual club pages for their specific pricing
                    and booking information.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="beginners">
                  <AccordionTrigger className="text-left font-semibold text-slate-900">
                    Can beginners use this site?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Absolutely! UK PadelFinder is designed for players of all levels,
                    including complete beginners. We help you find clubs, read
                    reviews, and see which venues offer coaching or beginner-friendly
                    sessions. Many clubs welcome newcomers and offer introductory
                    lessons or social sessions perfect for learning the game.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="booking">
                  <AccordionTrigger className="text-left font-semibold text-slate-900">
                    Do I book through UK PadelFinder or the club?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    UK PadelFinder helps you discover and compare clubs, but booking
                    is done directly with each club. When a club has online booking
                    available, we provide a direct link to their booking system. For
                    clubs without online booking, you can use our contact form to
                    reach out and make a reservation. We&apos;re here to help you
                    find the perfect court, then you book with the club.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clubs */}
      {featuredClubs && featuredClubs.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
                  Top Rated Clubs
                </h2>
                <p className="text-muted-foreground">
                  Highly rated padel clubs across the UK
                </p>
              </div>
              <Button variant="outline" asChild className="hidden md:flex">
                <Link href="/clubs">
                  View All Clubs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredClubs.map((club, index) => (
                <div
                  key={club._id}
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ClubCard club={club} />
                </div>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Button asChild>
                <Link href="/clubs">
                  View All Clubs
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Cities Section */}
      {topCities.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
                  Browse by City
                </h2>
                <p className="text-muted-foreground">
                  Find padel clubs in {stats?.totalCities ?? "150+"} cities across the UK
                </p>
              </div>
              <Button variant="outline" asChild className="hidden md:flex">
                <Link href="/clubs">
                  View All Cities
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topCities.map((city, index) => (
                <Link
                  key={city.slug}
                  href={`/city/${city.slug}`}
                  className="group p-5 bg-white rounded-2xl border shadow-sm hover:shadow-md hover:border-primary/30 transition-all opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                        {city.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {city.count} {city.count === 1 ? "club" : "clubs"}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Button variant="outline" asChild>
                <Link href="/clubs">
                  View All Cities
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-padel-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <ShieldCheck className="w-16 h-16 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Own a Padel Club?
            </h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8">
              Join the UK&apos;s leading padel directory. Claim your listing,
              reach more players, and grow your business.
            </p>
          </div>

          {/* Steps */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Step 1 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-lg">
                    1
                  </div>
                  <h3 className="text-xl font-bold">Find Your Club</h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Search for your club on our directory. If it&apos;s already
                  listed, you&apos;ll see a &quot;Claim this listing&quot;
                  button on the club page.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-lg">
                    2
                  </div>
                  <h3 className="text-xl font-bold">Submit Claim</h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Fill out a simple form with your name, email, role, and a
                  brief message. We&apos;ll verify your ownership and get back
                  to you within 24-48 hours.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-lg">
                    3
                  </div>
                  <h3 className="text-xl font-bold">Get Verified</h3>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">
                  Once approved, you&apos;ll gain access to update your listing,
                  respond to enquiries, view analytics, and manage your club&apos;s
                  presence on the platform.
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                What You Get
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">
                    Update club information, photos, and opening hours
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">
                    Respond directly to player enquiries and leads
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">
                    View analytics on views, clicks, and enquiries
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0 mt-0.5" />
                  <span className="text-white/80">
                    Increase visibility to thousands of players
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link href="/clubs">
                  <Search className="w-5 h-5 mr-2" />
                  Find Your Club
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/sign-up-club-owner">
                  <FileText className="w-5 h-5 mr-2" />
                  List a New Club
                </Link>
              </Button>
            </div>
            <p className="text-white/60 text-sm">
              Don&apos;t see your club? Submit a new listing and we&apos;ll add
              it to the directory.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

