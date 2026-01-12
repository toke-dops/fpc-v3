"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Eye, MousePointerClick, Users, TrendingUp, Building2, Edit, Plus, ArrowRight, Clock, CheckCircle2, XCircle, Share2, Facebook, Instagram, Linkedin, Twitter, Globe, Phone, BarChart3 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const dashboardData = useQuery(api.owner.getOwnerDashboard);
  const currentUser = useQuery(api.users.getCurrentUser);
  const myClaimsAndSubmissions = useQuery(api.submissions.getMyClaimsAndSubmissions);
  const mySubscriptions = useQuery(api.subscriptions.getMySubscriptions);
  const subscriptionStatus = useQuery(api.subscriptions.getUserSubscriptionStatus);
  const myClubs = useQuery(api.owner.getMyClubs);

  // Redirect if not authenticated
  if (clerkLoaded && !clerkUser) {
    router.push("/sign-in");
    return null;
  }

  // Loading state
  if (!clerkLoaded || currentUser === undefined || subscriptionStatus === undefined || myClubs === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle myClaimsAndSubmissions separately (may be null if query fails)
  const claimsAndSubmissions = myClaimsAndSubmissions ?? { claims: [], submissions: [] };

  // Not authenticated - show loading
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user is club owner or owns clubs
  const isClubOwner = currentUser.role === "club_owner";
  const ownsClubs = myClubs && myClubs.length > 0;

  // Check if user has Business or Featured plan (analytics requires this)
  const clubPlans = myClubs?.map(club => club.plan) || [];
  const hasBusinessOrFeatured = clubPlans.includes("business") || clubPlans.includes("featured") || 
                                subscriptionStatus === "business" || subscriptionStatus === "featured" ||
                                currentUser.plan === "business" || currentUser.plan === "featured";

  // If dashboardData query failed due to plan restriction, show upgrade prompt
  if (dashboardData === null && ownsClubs && !hasBusinessOrFeatured) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-primary" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Access to analytics requires a Business or Featured subscription plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Upgrade to access:</h3>
                <ul className="space-y-1 text-sm">
                  <li>• View detailed analytics and metrics</li>
                  <li>• Track views, clicks, and leads</li>
                  <li>• Monitor booking conversions</li>
                  <li>• Access social media click data</li>
                </ul>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/owner/subscriptions">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/owner/clubs">Back to My Clubs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If dashboardData is still loading or undefined, show loading
  if (dashboardData === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isClubOwner && !ownsClubs) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This page is only accessible to club owners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state - no clubs yet
  if (!dashboardData || dashboardData.totalClubs === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-2xl">No Clubs Yet</CardTitle>
                <CardDescription>
                  Get started by claiming an existing club or listing a new one.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full" size="lg">
                  <Link href="/clubs">
                    <Plus className="w-4 h-4 mr-2" />
                    Claim Your Club
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/list-your-club">
                    <Plus className="w-4 h-4 mr-2" />
                    List New Club
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Owner Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your clubs and track performance
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" className="rounded-full w-12 h-12 p-0">
                <Plus className="w-5 h-5" />
                <span className="sr-only">Add club</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/clubs" className="flex items-center cursor-pointer">
                  <Building2 className="w-4 h-4 mr-2" />
                  Claim a Club
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/list-your-club" className="flex items-center cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  List a Club
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clubs">My Clubs ({dashboardData.totalClubs})</TabsTrigger>
            <TabsTrigger value="subscriptions">My Subscription</TabsTrigger>
            <TabsTrigger value="pending">
              Pending (
              {(claimsAndSubmissions.claims.filter((c) => c.status === "new").length) +
                (claimsAndSubmissions.submissions.filter((s) => s.status === "new").length)}
              )
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.views30d} in last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Booking Clicks</CardTitle>
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.totalBookingClicks.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.bookingClicks30d} in last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.totalLeads.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.leads30d} in last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Social Media Clicks</CardTitle>
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.totalSocialClicks?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.socialClicks30d || 0} in last 30 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Session Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.averageSessionTime30d 
                      ? `${Math.round(dashboardData.averageSessionTime30d / 1000)}s`
                      : "0s"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.averageSessionTime 
                      ? `${Math.round(dashboardData.averageSessionTime / 1000)}s` 
                      : "0s"} all time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.bounceRate30d?.toFixed(1) || "0.0"}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.bounceRate?.toFixed(1) || "0.0"}% all time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.totalViews > 0
                      ? ((dashboardData.totalLeads / dashboardData.totalViews) * 100).toFixed(1)
                      : "0.0"}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Views to Leads
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Clubs Tab */}
          <TabsContent value="clubs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Clubs</CardTitle>
                <CardDescription>
                  Manage your club listings and view performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.clubs.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">You don't have any clubs yet.</p>
                    <div className="flex gap-4 justify-center">
                      <Button variant="outline" asChild>
                        <Link href="/clubs">
                          <Plus className="w-4 h-4 mr-2" />
                          Claim a Club
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/list-your-club">
                          <Plus className="w-4 h-4 mr-2" />
                          List New Club
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.clubs.map((club) => (
                      <div
                        key={club._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{club.name}</h3>
                            {club.is_featured && (
                              <Badge variant="default">Featured</Badge>
                            )}
                            <Badge variant="outline">{subscriptionStatus || "basic"}</Badge>
                          </div>
                          {club.city && (
                            <p className="text-sm text-muted-foreground mb-3">{club.city}</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Views:</span>{" "}
                              <span className="font-medium">{club.totalViews}</span>
                              {club.views30d > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({club.views30d} 30d)
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Clicks:</span>{" "}
                              <span className="font-medium">{club.totalBookingClicks}</span>
                              {club.bookingClicks30d > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({club.bookingClicks30d} 30d)
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Leads:</span>{" "}
                              <span className="font-medium">{club.totalLeads}</span>
                              {club.leads30d > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({club.leads30d} 30d)
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Facebook className="w-3 h-3 text-blue-600" />
                                Facebook:
                              </span>{" "}
                              <span className="font-medium">{club.totalFacebookClicks || 0}</span>
                              {club.facebookClicks30d > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({club.facebookClicks30d} 30d)
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Instagram className="w-3 h-3 text-pink-600" />
                                Instagram:
                              </span>{" "}
                              <span className="font-medium">{club.totalInstagramClicks || 0}</span>
                              {club.instagramClicks30d > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({club.instagramClicks30d} 30d)
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Linkedin className="w-3 h-3 text-blue-700" />
                                LinkedIn:
                              </span>{" "}
                              <span className="font-medium">{club.totalLinkedInClicks || 0}</span>
                              {club.linkedInClicks30d > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({club.linkedInClicks30d} 30d)
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Twitter className="w-3 h-3 text-sky-500" />
                                Twitter:
                              </span>{" "}
                              <span className="font-medium">{club.totalTwitterClicks || 0}</span>
                              {club.twitterClicks30d > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({club.twitterClicks30d} 30d)
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Globe className="w-3 h-3 text-primary" />
                                Website:
                              </span>{" "}
                              <span className="font-medium">{club.totalWebsiteClicks || 0}</span>
                              {club.websiteClicks30d > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({club.websiteClicks30d} 30d)
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3 text-green-600" />
                                Phone:
                              </span>{" "}
                              <span className="font-medium">{club.totalPhoneClicks || 0}</span>
                              {club.phoneClicks30d > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({club.phoneClicks30d} 30d)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/clubs/${club.slug}`}>
                              View
                            </Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/owner/clubs/${club._id}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Claims */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pending Claims
                  </CardTitle>
                  <CardDescription>
                    Clubs you've claimed that are awaiting approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {claimsAndSubmissions.claims.filter((c) => c.status === "new").length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending claims</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {claimsAndSubmissions.claims
                        .filter((c) => c.status === "new")
                        .map((claim) => (
                          <div
                            key={claim._id}
                            className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{claim.club_name_snapshot}</h4>
                                {claim.club && (
                                  <p className="text-sm text-muted-foreground">
                                    {claim.club.city}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Submitted {new Date(claim.created_at).toLocaleDateString()}
                            </p>
                            {claim.club && (
                              <Button variant="outline" size="sm" asChild className="w-full">
                                <Link href={`/clubs/${claim.club.slug}`}>
                                  View Club
                                </Link>
                              </Button>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Submissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pending Submissions
                  </CardTitle>
                  <CardDescription>
                    New clubs you've submitted that are awaiting review
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {claimsAndSubmissions.submissions.filter((s) => s.status === "new").length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending submissions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {claimsAndSubmissions.submissions
                        .filter((s) => s.status === "new")
                        .map((submission) => (
                          <div
                            key={submission._id}
                            className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold">{submission.club_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {submission.city}
                                </p>
                              </div>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Submitted {new Date(submission.created_at).toLocaleDateString()}
                            </p>
                            {submission.website && (
                              <p className="text-xs text-muted-foreground mb-2">
                                Website: {submission.website}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Approved/Rejected Section */}
            {(claimsAndSubmissions.claims.filter((c) => c.status !== "new").length > 0 ||
              claimsAndSubmissions.submissions.filter((s) => s.status !== "new").length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your approved and rejected claims/submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Approved Claims */}
                    {claimsAndSubmissions.claims
                      .filter((c) => c.status === "approved")
                      .map((claim) => (
                        <div
                          key={claim._id}
                          className="p-4 border rounded-lg bg-green-50 border-green-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{claim.club_name_snapshot}</h4>
                              {claim.club && (
                                <p className="text-sm text-muted-foreground">
                                  {claim.club.city}
                                </p>
                              )}
                            </div>
                            <Badge className="bg-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Approved {new Date(claim.created_at).toLocaleDateString()}
                          </p>
                          {claim.club && claim.club._id && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/owner/clubs/${claim.club._id}`}>
                                Manage Club
                              </Link>
                            </Button>
                          )}
                        </div>
                      ))}

                    {/* Rejected Claims */}
                    {claimsAndSubmissions.claims
                      .filter((c) => c.status === "rejected")
                      .map((claim) => (
                        <div
                          key={claim._id}
                          className="p-4 border rounded-lg bg-red-50 border-red-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{claim.club_name_snapshot}</h4>
                              {claim.club && (
                                <p className="text-sm text-muted-foreground">
                                  {claim.club.city}
                                </p>
                              )}
                            </div>
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Rejected {new Date(claim.created_at).toLocaleDateString()}
                          </p>
                          {claim.notes && (
                            <p className="text-xs text-muted-foreground">
                              Note: {claim.notes}
                            </p>
                          )}
                        </div>
                      ))}

                    {/* Approved Submissions */}
                    {claimsAndSubmissions.submissions
                      .filter((s) => s.status === "approved")
                      .map((submission) => (
                        <div
                          key={submission._id}
                          className="p-4 border rounded-lg bg-green-50 border-green-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{submission.club_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {submission.city}
                              </p>
                            </div>
                            <Badge className="bg-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Approved {new Date(submission.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Subscription Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Subscription</CardTitle>
                <CardDescription>
                  Manage your club subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mySubscriptions && mySubscriptions.length > 0 ? (
                  (() => {
                    const subscription = mySubscriptions[0];
                    const planName = subscription.plan === "business" 
                      ? "Business" 
                      : subscription.plan === "featured"
                      ? "Featured"
                      : "Basic";
                    
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Plan Name</div>
                            <div className="text-lg font-semibold">{planName} Plan</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                            <Badge 
                              variant={
                                subscription.status === "active" 
                                  ? "default" 
                                  : subscription.status === "past_due"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="capitalize"
                            >
                              {subscription.status}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Activation Date</div>
                            <div className="text-sm">
                              {new Date(subscription.created_at).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">Expiry Date</div>
                            <div className="text-sm">
                              {subscription.current_period_end 
                                ? new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                        {subscription.scheduled_plan && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-sm font-medium text-blue-900 mb-1">
                              Scheduled Plan Change
                            </div>
                            <div className="text-sm text-blue-700">
                              Plan will change to <strong>{subscription.scheduled_plan === "business" ? "Business" : subscription.scheduled_plan === "featured" ? "Featured" : "Basic"}</strong> on{" "}
                              {subscription.scheduled_plan_activation_date
                                ? new Date(subscription.scheduled_plan_activation_date).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : subscription.current_period_end 
                                  ? new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    })
                                  : "N/A"}
                            </div>
                          </div>
                        )}
                        {subscription.cancel_at_period_end && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="text-sm font-medium text-yellow-900 mb-1">
                              Subscription Cancelled
                            </div>
                            <div className="text-sm text-yellow-700">
                              Your subscription will be cancelled on{" "}
                              {subscription.current_period_end 
                                ? new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </div>
                          </div>
                        )}
                        <Button asChild variant="outline" className="w-full">
                          <Link href="/owner/subscriptions">
                            View Subscription Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No active subscription found.</p>
                    <Button asChild>
                      <Link href="/owner/subscriptions">
                        View Subscription Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

