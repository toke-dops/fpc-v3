import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, Building2, Star } from "lucide-react";
import { getStaticPageMetadata, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = getStaticPageMetadata(
  "pricing",
  "Pricing - Find Padel Clubs",
  "Choose the perfect plan for your padel club. Free basic listing, Business plan with booking links and analytics, or Featured plan with maximum visibility. Transparent pricing, no hidden fees."
);

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-primary to-padel-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              Pricing Plans
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Choose the perfect plan for your padel club. Start free, upgrade anytime.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Basic Plan */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 shadow-sm">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Basic</h2>
                <div className="text-4xl font-black text-slate-900 mb-1">Free</div>
                <p className="text-sm text-muted-foreground">Forever</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Basic club listing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Edit club information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Contact form</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Public visibility</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/sign-up-club-owner">Get Started</Link>
              </Button>
            </div>

            {/* Business Plan */}
            <div className="bg-white rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 shadow-lg relative">
              <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 rounded-bl-xl rounded-tr-2xl text-xs font-bold">
                POPULAR
              </div>
              <div className="text-center mb-6">
                <Building2 className="w-10 h-10 text-primary mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Business</h2>
                <div className="text-4xl font-black text-slate-900 mb-1">
                  £49.99
                </div>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Everything in Basic</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Booking Link</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Access to Analytics Dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Dedicated Email Support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Priority Listing over Basic Plan</span>
                </li>
              </ul>
              <Button className="w-full" asChild>
                <Link href="/sign-up-club-owner">Get Started</Link>
              </Button>
            </div>

            {/* Featured Plan */}
            <div className="bg-white rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-8 shadow-sm">
              <div className="text-center mb-6">
                <Sparkles className="w-10 h-10 text-amber-600 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Featured</h2>
                <div className="text-4xl font-black text-slate-900 mb-1">
                  £149.99
                </div>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Everything in Business</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Advert Placement</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Top-of-List Placement</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Homepage and Special Placements</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Priority Support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Advanced Analytics (All Business Features)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Booking Link</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full border-amber-300 text-amber-900 hover:bg-amber-50" asChild>
                <Link href="/sign-up-club-owner">Get Started</Link>
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <div className="text-left max-w-2xl mx-auto space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Can I upgrade or downgrade anytime?</h3>
                <p className="text-sm text-muted-foreground">Yes, you can change your plan at any time. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Is there a contract?</h3>
                <p className="text-sm text-muted-foreground">No, all plans are month-to-month with no long-term contracts. Cancel anytime.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Do I need to sign up for a paid plan?</h3>
                <p className="text-sm text-muted-foreground">No, the Basic plan is completely free forever. Upgrade only if you want additional features.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

