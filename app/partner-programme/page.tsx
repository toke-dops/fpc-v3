import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Handshake, Network, Gift, TrendingUp, Users, Award, Mail } from "lucide-react";
import { getStaticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getStaticPageMetadata(
  "partner-programme",
  "Partner Programme - Find Padel Clubs",
  "Join the Find Padel Clubs Partner Programme. Collaborate with the UK's leading padel directory. Exclusive benefits, revenue sharing, and mutual growth opportunities for padel clubs, equipment suppliers, and service providers."
);

export default function PartnerProgrammePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-primary to-padel-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Handshake className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              Partner Programme
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Join forces with the UK's leading padel directory. Build mutually beneficial partnerships that drive growth for your business and the padel community.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* What is Partner Programme */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">What is the Partner Programme?</h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              The Find Padel Clubs Partner Programme is designed for businesses, organizations, and individuals who want to collaborate with us to grow the padel community in the UK. Whether you're a padel club, equipment supplier, coach, or service provider, we offer flexible partnership opportunities.
            </p>
          </section>

          {/* Benefits Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Partner Benefits</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <Network className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Expanded Reach</h3>
                <p className="text-muted-foreground">
                  Access our growing user base of padel enthusiasts. Get your brand in front of thousands of active players.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <Gift className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Exclusive Offers</h3>
                <p className="text-muted-foreground">
                  Special pricing, promotional opportunities, and featured placements for our partners.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <TrendingUp className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Revenue Opportunities</h3>
                <p className="text-muted-foreground">
                  Explore revenue-sharing models and referral programs that benefit both parties.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <Users className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Community Building</h3>
                <p className="text-muted-foreground">
                  Work together to grow the padel community and support the sport's development across the UK.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <Award className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Brand Recognition</h3>
                <p className="text-muted-foreground">
                  Co-marketing opportunities and brand association with the UK's premier padel directory.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Priority Support</h3>
                <p className="text-muted-foreground">
                  Dedicated partner support and faster response times for your business needs.
                </p>
              </div>
            </div>
          </section>

          {/* Partnership Types */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Partnership Types</h2>
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-xl border-2 border-primary/20 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Padel Club Partners</h3>
                <p className="text-muted-foreground mb-4">
                  For padel clubs looking to maximize their visibility and bookings.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Featured listing placement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Bulk subscription discounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Co-marketing opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Referral program participation</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl border-2 border-slate-200 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Equipment & Service Partners</h3>
                <p className="text-muted-foreground mb-4">
                  For suppliers, coaches, and service providers in the padel industry.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Advertising opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Content collaboration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Event sponsorship opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Cross-promotion agreements</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl border-2 border-slate-200 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Strategic Partners</h3>
                <p className="text-muted-foreground mb-4">
                  For organizations, federations, and large-scale collaborations.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Custom partnership agreements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Data sharing and insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Joint initiatives and events</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Long-term growth strategies</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Become a Partner</h2>
            <p className="text-muted-foreground mb-6">
              Interested in joining our Partner Programme? We'd love to discuss how we can work together to grow the padel community. Contact us to learn more about partnership opportunities and benefits.
            </p>
            <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-6 mb-6">
              <p className="text-sm text-muted-foreground mb-2">Email us at:</p>
              <a 
                href="mailto:findpadelclubs@gmail.com?subject=Partner Programme Inquiry"
                className="text-xl font-bold text-primary hover:underline inline-flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                findpadelclubs@gmail.com
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <a href="mailto:findpadelclubs@gmail.com?subject=Partner Programme Inquiry">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/advertise">Learn About Advertising</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

