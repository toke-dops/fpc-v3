"use client";

import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2, Building2, MapPin, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const accountStatus = useQuery(api.users.getAccountStatus);
  const subscriptionStatus = useQuery(api.subscriptions.getUserSubscriptionStatus);
  const checkAndDelete = useMutation(api.users.checkAndDeleteInactiveClubOwners);

  // Redirect if not authenticated
  if (clerkLoaded && !clerkUser) {
    router.push("/sign-in");
    return null;
  }

  // Get clubs to check their plans as fallback
  const myClubs = useQuery(api.owner.getMyClubs);

  // Loading state
  if (!clerkLoaded || currentUser === undefined || accountStatus === undefined || subscriptionStatus === undefined || myClubs === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  const clubPlans = myClubs?.map(club => club.plan) || [];
  const hasBusinessClub = clubPlans.includes("business");
  const hasFeaturedClub = clubPlans.includes("featured");
  
  // Determine effective subscription status - prioritize club plans since they're updated by webhook
  const effectiveSubscriptionStatus = hasFeaturedClub 
    ? "featured" 
    : hasBusinessClub 
    ? "business" 
    : subscriptionStatus || "basic";

  // Not authenticated - show loading
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only show verification requirements for club owners (not admins)
  const isClubOwner = currentUser.role === "club_owner";
  const isVerified = accountStatus?.isVerified ?? false;
  const daysRemaining = accountStatus?.daysRemaining ?? 7;

  // Account should be deleted (only for club owners, not admins)
  if (isClubOwner && accountStatus?.shouldBeDeleted) {
    // Trigger deletion check
    checkAndDelete();
    
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Account Deleted
            </CardTitle>
            <CardDescription>
              Your account has been deleted because you didn't list or claim a club within 7 days of sign-up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              To continue using UK PadelFinder, please create a new account and complete the club listing or claim process.
            </p>
            <Button asChild>
              <Link href="/sign-up">Create New Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            {currentUser.role === "admin" ? "Admin Dashboard" : "Club Owner Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {currentUser.role === "admin" 
              ? "Manage clubs, claims, and analytics"
              : "Manage your club listing and track your account status"}
          </p>
        </div>

        {/* Account Status Alert - Only for club owners */}
        {isClubOwner && !isVerified && (
          <Alert className="mb-8 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-900">Welcome! Get Started</AlertTitle>
            <AlertDescription className="text-yellow-800">
              {daysRemaining > 0 ? (
                <>
                  To verify your account, you need to either <strong>list a new club</strong> or <strong>claim an existing club</strong>. 
                  You have <strong>{daysRemaining} {daysRemaining === 1 ? "day" : "days"}</strong> remaining. 
                  Your account will be deleted if you don't complete this step.
                </>
              ) : (
                <>Your account will be deleted soon. Please list or claim a club immediately.</>
              )}
            </AlertDescription>
            <div className="mt-4 flex gap-3">
              <Button asChild size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                <Link href="/list-your-club">
                  List Your Club
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-yellow-600 text-yellow-800 hover:bg-yellow-100">
                <Link href="/clubs">
                  Claim a Club
                </Link>
              </Button>
            </div>
          </Alert>
        )}

        {isClubOwner && isVerified && (
          <Alert className="mb-8 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Account Verified</AlertTitle>
            <AlertDescription className="text-green-800">
              Your account is verified. You've successfully listed or claimed a club.
            </AlertDescription>
            <div className="mt-4">
              <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                <Link href="/owner/dashboard">
                  Go to Club Management Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Alert>
        )}

        {isClubOwner && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* List New Club Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  List a New Club
                </CardTitle>
                <CardDescription>
                  Submit a new club listing to be added to UK PadelFinder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Don't see your club on the directory? Submit a listing request and we'll review it.
                </p>
                <Button asChild className="w-full">
                  <Link href="/list-your-club">
                    List Your Club
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Claim Existing Club Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Claim an Existing Club
                </CardTitle>
                <CardDescription>
                  Claim ownership of a club that's already listed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Is your club already on UK PadelFinder? Claim it to manage the listing.
                </p>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/clubs">
                    Browse Clubs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {currentUser.role === "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/admin">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Admin Panel
                  </CardTitle>
                  <CardDescription>
                    Manage submissions and claims
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin/claims">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Review Claims
                  </CardTitle>
                  <CardDescription>
                    Approve or reject club claims
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin/analytics">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Analytics
                  </CardTitle>
                  <CardDescription>
                    View site analytics and insights
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        )}

        {/* Account Status Card - Only for club owners */}
        {isClubOwner && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Your account verification and subscription status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification Status</span>
                  <Badge variant={isVerified ? "default" : "destructive"}>
                    {isVerified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Has Listed Club</span>
                  <Badge variant={accountStatus?.hasListedClub ? "default" : "outline"}>
                    {accountStatus?.hasListedClub ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Has Claimed Club</span>
                  <Badge variant={accountStatus?.hasClaimedClub ? "default" : "outline"}>
                    {accountStatus?.hasClaimedClub ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Subscription Status</span>
                  <Badge variant="default" className="capitalize">
                    {effectiveSubscriptionStatus === "basic" ? "Basic" : effectiveSubscriptionStatus === "business" ? "Business" : "Featured"}
                  </Badge>
                </div>
                {!isVerified && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Days Remaining
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      {daysRemaining}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

