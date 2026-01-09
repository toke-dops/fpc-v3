import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, ShieldCheck, BarChart3, Users, Star } from "lucide-react";
import { getStaticPageMetadata, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = getStaticPageMetadata(
  "for-club-owners",
  "For Club Owners - List Your Padel Club",
  "Join the UK's leading padel directory. Claim your club listing, reach more players, manage your presence, and grow your business. Free and paid plans available."
);

export default function ForClubOwnersPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-primary to-padel-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              For Club Owners
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Join the UK&apos;s leading padel directory. Claim your listing, reach more players, and grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                <Link href="/sign-up-club-owner">
                  List Your Club
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10" asChild>
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Why List Your Club?
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <Users className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Reach More Players</h3>
                <p className="text-muted-foreground">
                  Get discovered by thousands of padel players searching for courts near them. Increase visibility and attract new members.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <BarChart3 className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Track Your Performance</h3>
                <p className="text-muted-foreground">
                  Monitor views, clicks, and enquiries with our analytics dashboard. Understand how players find and interact with your listing.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <ShieldCheck className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Manage Your Listing</h3>
                <p className="text-muted-foreground">
                  Update club information, opening hours, amenities, and photos anytime. Respond directly to player enquiries.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <Star className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Build Your Reputation</h3>
                <p className="text-muted-foreground">
                  Collect reviews and ratings from players. Showcase your facilities and services to attract quality members.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              How It Works
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Find or List Your Club</h3>
                  <p className="text-muted-foreground">
                    Search for your club on our directory. If it&apos;s already listed, claim it. If not, submit a new listing.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Get Verified</h3>
                  <p className="text-muted-foreground">
                    We verify your ownership and approve your claim within 24-48 hours. For new listings, we review and publish within 2-3 business days.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Manage & Grow</h3>
                  <p className="text-muted-foreground">
                    Once approved, you can update your listing, respond to enquiries, view analytics, and choose to upgrade for premium features.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-primary/5 rounded-2xl p-8 border border-primary/20">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join hundreds of padel clubs already listed on Find Padel Clubs. Start with a free basic listing or upgrade for premium features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up-club-owner">
                  Claim or List Your Club
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

