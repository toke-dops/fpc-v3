"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { ChevronLeft, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ListYourClubPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in?redirect=/list-your-club");
    }
  }, [isLoaded, user, router]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    club_name: "",
    city: "",
    website: "",
    email: "",
    phone: "",
    message: "",
  });

  const submitClubListing = useMutation(api.submissions.submitClubListing);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await submitClubListing({
        club_name: formData.club_name,
        city: formData.city,
        website: formData.website || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        message: formData.message,
      });

      setSubmitted(true);
      setFormData({
        club_name: "",
        city: "",
        website: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-24">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-white p-8 rounded-2xl border shadow-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Thank You!
            </h1>
            <p className="text-muted-foreground mb-6">
              Thanks for submitting your club. We&apos;ll review your listing and
              get back to you soon.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/">Back to Home</Link>
              </Button>
              <Button
                className="flex-1"
                onClick={() => setSubmitted(false)}
              >
                Submit Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/owner/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
            List Your Club
          </h1>
          <p className="text-muted-foreground">
            Add your padel club to the UK&apos;s leading directory
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-2xl border shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="club_name" className="mb-2 block">
                  Club Name *
                </Label>
                <Input
                  id="club_name"
                  required
                  placeholder="e.g. Padel Social Club"
                  value={formData.club_name}
                  onChange={(e) =>
                    setFormData({ ...formData, club_name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="city" className="mb-2 block">
                  City *
                </Label>
                <Input
                  id="city"
                  required
                  placeholder="e.g. London"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="email" className="mb-2 block">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="contact@yourclub.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="mb-2 block">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+44 20 1234 5678"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website" className="mb-2 block">
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourclub.com"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="message" className="mb-2 block">
                  Tell us about your club *
                </Label>
                <Textarea
                  id="message"
                  required
                  rows={5}
                  placeholder="Share details about your club, facilities, opening hours, or anything else we should know..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    Submit Club Listing
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree that we may contact you about your club
                listing. We&apos;ll review your submission and add it to our
                directory if approved.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

