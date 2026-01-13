import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Megaphone, TrendingUp, Target, BarChart3, Users, Mail } from "lucide-react";
import { getStaticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getStaticPageMetadata(
  "advertise",
  "Advertise with Us - Find Padel Clubs",
  "Reach thousands of padel enthusiasts across the UK. Advertise your padel club, equipment, or services on Find Padel Clubs. Get maximum visibility with our Featured and Business plans."
);

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-primary to-padel-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Megaphone className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              Advertise with Us
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Reach thousands of padel enthusiasts across the UK. Showcase your club, equipment, or services to an engaged audience.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Why Advertise Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Why Advertise on Find Padel Clubs?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <Users className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Targeted Audience</h3>
                <p className="text-muted-foreground">
                  Reach active padel players actively searching for clubs, courts, and equipment. Our users are engaged and ready to book.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <TrendingUp className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Growing Platform</h3>
                <p className="text-muted-foreground">
                  Padel is the fastest-growing racket sport in the UK. Join us as we expand and reach new players every day.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <Target className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Premium Placement</h3>
                <p className="text-muted-foreground">
                  Featured and Business plans get top-of-list placement, homepage visibility, and priority in search results.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <BarChart3 className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Analytics & Insights</h3>
                <p className="text-muted-foreground">
                  Track your performance with detailed analytics. See views, clicks, and bookings from your listings.
                </p>
              </div>
            </div>
          </section>

          {/* Advertising Options */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Advertising Options</h2>
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-xl border-2 border-primary/20 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Featured Plan</h3>
                <p className="text-muted-foreground mb-6">
                  Maximum visibility for your padel club with premium placement and advertising opportunities.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Top of search results placement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Homepage and special placements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Advert placement opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Advanced analytics dashboard</span>
                  </li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/pricing">View Featured Plan</Link>
                </Button>
              </div>

              <div className="bg-white p-8 rounded-xl border-2 border-slate-200 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Business Plan</h3>
                <p className="text-muted-foreground mb-6">
                  Essential features for growing clubs with booking links and analytics.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Priority listing over Basic plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Booking link integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Analytics dashboard access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Dedicated email support</span>
                  </li>
                </ul>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/pricing">View Business Plan</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Get Started</h2>
            <p className="text-muted-foreground mb-6">
              Ready to advertise with us? Contact our team to discuss your advertising needs and find the perfect plan for your business.
            </p>
            <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-6 mb-6">
              <p className="text-sm text-muted-foreground mb-2">Email us at:</p>
              <a 
                href="mailto:findpadelclubs@gmail.com?subject=Advertising Inquiry"
                className="text-xl font-bold text-primary hover:underline inline-flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                findpadelclubs@gmail.com
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <a href="mailto:findpadelclubs@gmail.com?subject=Advertising Inquiry">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pricing">View Pricing Plans</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

