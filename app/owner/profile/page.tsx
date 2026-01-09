"use client";

import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Mail, Calendar, ShieldCheck, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";

export default function MyProfilePage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { user: clerkUserForUpdate } = useClerk();
  const currentUser = useQuery(api.users.getCurrentUser);
  const [isUpdating, setIsUpdating] = useState(false);

  // Redirect if not authenticated
  if (clerkLoaded && !clerkUser) {
    router.push("/sign-in");
    return null;
  }

  // Loading state
  if (!clerkLoaded || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - show loading
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    if (!clerkUserForUpdate) return;
    
    setIsUpdating(true);
    try {
      // Update Clerk profile (name, email, etc.)
      await clerkUserForUpdate.update({
        firstName: clerkUser?.firstName || "",
        lastName: clerkUser?.lastName || "",
      });
      // Note: Email updates require verification in Clerk
      // The Convex user record will sync automatically via UserSync component
    } catch (error: any) {
      alert(error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={clerkUser?.fullName || clerkUser?.firstName || ""}
                  disabled
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Update your name in Clerk settings
                </p>
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={clerkUser?.primaryEmailAddress?.emailAddress || currentUser.email}
                  disabled
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email is managed through Clerk
                </p>
              </div>
              <div>
                <Label>Role</Label>
                <div className="mt-1">
                  <Badge variant="default" className="capitalize">
                    {currentUser.role}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Account Created</Label>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {currentUser.created_at
                    ? new Date(currentUser.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Account Status
              </CardTitle>
              <CardDescription>
                Your account verification and activity status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Has Listed Club</span>
                <Badge variant={currentUser.has_listed_club ? "default" : "outline"}>
                  {currentUser.has_listed_club ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Has Claimed Club</span>
                <Badge variant={currentUser.has_claimed_club ? "default" : "outline"}>
                  {currentUser.has_claimed_club ? "Yes" : "No"}
                </Badge>
              </div>
              {currentUser.club_verified_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verified At</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(currentUser.club_verified_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/owner/dashboard">Back to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Account Settings</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

