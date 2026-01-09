import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl mb-4">About UK PadelFinder</CardTitle>
              <CardDescription>
                Your comprehensive guide to padel clubs across the United Kingdom
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  UK PadelFinder is dedicated to connecting padel enthusiasts with the best clubs and facilities across the United Kingdom. We aim to make it easy for players of all levels to discover, explore, and engage with padel clubs in their area.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3">What We Do</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We provide a comprehensive platform where:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Players can search and discover padel clubs by location</li>
                  <li>Club owners can showcase their facilities and services</li>
                  <li>Users can view detailed information about clubs, including amenities, opening hours, and contact details</li>
                  <li>Clubs can manage their listings and track engagement through our analytics dashboard</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3">For Club Owners</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you own or manage a padel club, you can claim your listing or submit a new club to be added to our directory. Our platform offers various subscription plans to help you maximize your club's visibility and reach more players.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-3">Get Started</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Ready to explore padel clubs near you? Start by browsing our directory or search for clubs in your area.
                </p>
                <div className="flex gap-4">
                  <Button asChild>
                    <Link href="/clubs">Find Clubs</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/contact">Contact Us</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

