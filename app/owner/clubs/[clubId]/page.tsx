"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, ArrowLeft, CheckCircle2, AlertCircle, Lock, Sparkles, Image, BarChart3, Calendar, Star, TrendingUp, Users, Eye, X } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export default function EditClubPage() {
  const params = useParams();
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const clubId = params.clubId as string;
  
  const club = useQuery(api.clubs.getById, { id: clubId as any });
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateClub = useMutation(api.owner.updateClubListing);
  const subscriptionStatus = useQuery(api.subscriptions.getUserSubscriptionStatus);

  const [formData, setFormData] = useState({
    name: "",
    website: "",
    booking_url: "",
    phone: "",
    contact_email: "",
    opening_hours_raw: "",
    amenities: [] as string[],
    number_of_courts: "",
    additional_features: "",
    street_address: "",
    full_address: "",
    city: "",
    postcode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

  // Initialize form data when club loads - MUST be before any conditional returns
  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || "",
        website: club.website || "",
        booking_url: club.booking_url || "",
        phone: club.phone || "",
        contact_email: (club as any).contact_email || "",
        opening_hours_raw: club.opening_hours_raw || "",
        amenities: (club as any).amenities || [],
        number_of_courts: (club as any).number_of_courts?.toString() || "",
        additional_features: (club as any).additional_features || "",
        street_address: club.street_address || "",
        full_address: club.full_address || "",
        city: club.city || "",
        postcode: club.postcode || "",
      });
    }
  }, [club]);

  // Redirect if not authenticated
  if (clerkLoaded && !clerkUser) {
    router.push("/sign-in");
    return null;
  }

  // Loading state
  if (!clerkLoaded || club === undefined || currentUser === undefined || subscriptionStatus === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated or club not found
  if (!currentUser || !club) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Club not found or you don't have permission to edit it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/owner/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verify ownership
  if (club.owner_user_id !== currentUser._id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to edit this club.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/owner/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get effective subscription status
  const effectivePlan = subscriptionStatus || "basic";
  
  // Check if user owns the club - if not, they can't manage it
  // If club status is "claimed" and owner_user_id matches, claim was approved
  // If club status is "unclaimed" but owner_user_id matches, they listed it (auto-approved)
  const ownsClub = club.owner_user_id === currentUser._id;
  
  // If club is claimed but user doesn't own it, their claim is pending
  if (club.status === "claimed" && !ownsClub) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Claim Pending Approval
            </CardTitle>
            <CardDescription>
              Your claim for this club is pending admin approval. You'll be able to manage the club once your claim is approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/owner/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await updateClub({
        clubId: clubId as any,
        name: formData.name,
        website: formData.website || undefined,
        booking_url: formData.booking_url || undefined,
        phone: formData.phone || undefined,
        contact_email: formData.contact_email || undefined,
        opening_hours_raw: formData.opening_hours_raw || undefined,
        amenities: formData.amenities.length > 0 ? formData.amenities : undefined,
        number_of_courts: formData.number_of_courts ? parseInt(formData.number_of_courts, 10) : undefined,
        additional_features: formData.additional_features || undefined,
        street_address: formData.street_address || undefined,
        full_address: formData.full_address || undefined,
        city: formData.city || undefined,
        postcode: formData.postcode || undefined,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update club listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const amenityOptions = [
    "Parking",
    "Cafe",
    "Pro Shop",
    "Changing Rooms",
    "Showers",
    "WiFi",
    "Bar",
    "Restaurant",
    "Kids Area",
    "Disabled Access",
  ];

  const handleUpgrade = async (plan: "business" | "featured") => {
    setIsLoadingCheckout(true);
    setError(null);

    try {
      // Redirect to Clerk billing checkout page (user-based subscription)
      router.push(`/billing/checkout?plan=${plan}`);
    } catch (err: any) {
      setError(err.message || "Failed to start checkout");
      setIsLoadingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/owner/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit Club Listing</h1>
          <p className="text-muted-foreground">
            Update your club information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Club Information</CardTitle>
                <CardDescription>
                  Update your club's public listing details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900">Error</p>
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">Success</p>
                        <p className="text-sm text-green-800">Club listing updated successfully!</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="name">Club Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your Club Name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="street_address">Street Address</Label>
                    <Input
                      id="street_address"
                      value={formData.street_address}
                      onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div>
                    <Label htmlFor="full_address">Full Address</Label>
                    <Textarea
                      id="full_address"
                      value={formData.full_address}
                      onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                      placeholder="123 Main Street, City, Postcode"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete address including street, city, and postcode
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        value={formData.postcode}
                        onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                        placeholder="Postcode"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">Website URL</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="booking_url" className="flex items-center gap-2">
                      Booking URL
                      {effectivePlan !== "business" && effectivePlan !== "featured" && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Business Plan
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="booking_url"
                      type="url"
                      value={formData.booking_url}
                      onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })}
                      placeholder="https://booking.example.com"
                      disabled={effectivePlan !== "business" && effectivePlan !== "featured"}
                      className={effectivePlan !== "business" && effectivePlan !== "featured" ? "opacity-50 cursor-not-allowed" : ""}
                    />
                    {effectivePlan !== "business" && effectivePlan !== "featured" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Link where users can book courts or sessions
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+44 20 1234 5678"
                    />
                  </div>

                  <div>
                    <Label htmlFor="opening_hours_raw">Opening Hours</Label>
                    <Textarea
                      id="opening_hours_raw"
                      value={formData.opening_hours_raw}
                      onChange={(e) => setFormData({ ...formData, opening_hours_raw: e.target.value })}
                      placeholder="Monday-Friday: 9am-10pm&#10;Saturday-Sunday: 8am-11pm"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your opening hours (one line per day or format as needed)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="number_of_courts">Number of Courts</Label>
                    <Input
                      id="number_of_courts"
                      type="number"
                      min="1"
                      value={formData.number_of_courts}
                      onChange={(e) => setFormData({ ...formData, number_of_courts: e.target.value })}
                      placeholder="e.g., 4"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Total number of padel courts at your club
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="amenities">Amenities</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Select amenities from the list below, or add custom ones
                    </p>
                    
                    {/* Selected Amenities Display */}
                    {formData.amenities.length > 0 && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                          Selected Amenities ({formData.amenities.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formData.amenities.map((amenity, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                              onClick={() => toggleAmenity(amenity)}
                            >
                              {amenity}
                              <X className="w-3 h-3 ml-1.5" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Predefined Amenities */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                        Available Amenities
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {amenityOptions.map((amenity) => (
                          <label
                            key={amenity}
                            htmlFor={`amenity-${amenity}`}
                            className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                          >
                            <Checkbox
                              id={`amenity-${amenity}`}
                              checked={formData.amenities.includes(amenity)}
                              onCheckedChange={() => toggleAmenity(amenity)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm font-normal flex-1">
                              {amenity}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Custom Amenity Input */}
                    <div>
                      <Label htmlFor="custom_amenity">Add Custom Amenity</Label>
                      <div className="flex gap-2">
                        <Input
                          id="custom_amenity"
                          placeholder="e.g., Rooftop court, Heated courts"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const value = input.value.trim();
                              if (value && !formData.amenities.includes(value)) {
                                setFormData({
                                  ...formData,
                                  amenities: [...formData.amenities, value],
                                });
                                input.value = "";
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById("custom_amenity") as HTMLInputElement;
                            const value = input?.value.trim();
                            if (value && !formData.amenities.includes(value)) {
                              setFormData({
                                ...formData,
                                amenities: [...formData.amenities, value],
                              });
                              if (input) input.value = "";
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type an amenity and press Enter or click Add
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="additional_features">Additional Features & Information</Label>
                    <Textarea
                      id="additional_features"
                      value={formData.additional_features}
                      onChange={(e) => setFormData({ ...formData, additional_features: e.target.value })}
                      placeholder="e.g., Indoor courts, Outdoor courts, Lighting, Air conditioning, Pro shop, Coaching available, Tournaments, Leagues, etc."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      List any additional features, amenities, or information about your club (one per line or comma-separated)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="contact_email" className="flex items-center gap-2">
                      Contact Email
                      {effectivePlan !== "business" && effectivePlan !== "featured" && (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="w-3 h-3 mr-1" />
                          Business Plan
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="contact@example.com"
                      disabled={effectivePlan !== "business" && effectivePlan !== "featured"}
                      className={effectivePlan !== "business" && effectivePlan !== "featured" ? "opacity-50 cursor-not-allowed" : ""}
                    />
                    {(effectivePlan === "business" || effectivePlan === "featured") && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact email for your club
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href={`/clubs/${club.slug}`}>
                        View Public Page
                      </Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Reserved space for future advertisements (e.g., Google AdSense) */}
            <div className="min-h-[200px]">
              {/* Ad space - ready for future integration */}
            </div>

            {/* Subscription Upgrade Cards */}
            {club.plan === "basic" && (
              <div className="space-y-4">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Business Plan
                    </CardTitle>
                    <CardDescription>
                      Essential features for growing your club
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Image className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Add Logo & Images</p>
                          <p className="text-xs text-muted-foreground">
                            Upload your club logo, add multiple photos for a gallery
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Booking Link</p>
                          <p className="text-xs text-muted-foreground">
                            Direct customers to your booking system
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Image className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Change Header Images</p>
                          <p className="text-xs text-muted-foreground">
                            Customize your club's header image
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Contact Email</p>
                          <p className="text-xs text-muted-foreground">
                            Add a contact email for your club
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Analytics</p>
                          <p className="text-xs text-muted-foreground">
                            Track views, clicks, and leads in detail
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => handleUpgrade("business")}
                      disabled={isLoadingCheckout}
                    >
                      {isLoadingCheckout ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Upgrade to Business"
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      <span className="line-through text-muted-foreground">£59.99</span>{" "}
                      <span className="font-bold text-primary">£49.99/month</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-600" />
                      Featured Plan
                    </CardTitle>
                    <CardDescription>
                      Maximum visibility and premium features
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Star className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Top of Search Results</p>
                          <p className="text-xs text-muted-foreground">
                            Appear first in search results
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Featured Listings</p>
                          <p className="text-xs text-muted-foreground">
                            Highlighted placement on homepage
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Blog</p>
                          <p className="text-xs text-muted-foreground">
                            Publish blog posts about your club
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Eye className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Boosted Visibility</p>
                          <p className="text-xs text-muted-foreground">
                            Shown on relevant individual listing pages and location pages
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700" 
                      size="lg"
                      onClick={() => handleUpgrade("featured")}
                      disabled={isLoadingCheckout}
                    >
                      {isLoadingCheckout ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Upgrade to Featured"
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      <span className="line-through text-muted-foreground">£199.99</span>{" "}
                      <span className="font-bold text-purple-600">£149.99/month</span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {club.plan === "business" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Business Plan Active
                    </CardTitle>
                    <CardDescription>
                      You have access to all business features
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Logo & Images enabled</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Booking link enabled</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Header images enabled</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Contact email enabled</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Analytics enabled</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        // Open Clerk billing portal
                        window.location.href = "/billing/portal";
                      }}
                    >
                      Manage Subscription
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-purple-600" />
                      Add Featured as Add-On
                    </CardTitle>
                    <CardDescription>
                      Get maximum visibility
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Star className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Top of Search Results</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Featured Listings</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Blog</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <Eye className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Boosted Visibility</p>
                          <p className="text-xs text-muted-foreground">
                            Shown on relevant individual listing pages and location pages
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700" 
                      size="lg"
                      onClick={() => handleUpgrade("featured")}
                      disabled={isLoadingCheckout}
                    >
                      {isLoadingCheckout ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Add Featured as Add-On"
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      <span className="line-through text-muted-foreground">£199.99</span>{" "}
                      <span className="font-bold text-purple-600">£149.99/month</span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {club.plan === "featured" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-purple-600" />
                    Featured Plan Active
                  </CardTitle>
                  <CardDescription>
                    You have access to all premium features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Top of search results</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Featured listings</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Blog access</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Boosted visibility on listing and location pages</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // Open Clerk billing portal
                      window.location.href = "/billing/portal";
                    }}
                  >
                    Manage Subscription
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

