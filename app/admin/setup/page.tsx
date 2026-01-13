"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Lock } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminSetupPage() {
  // This page is now deprecated - admin setup should be done via Convex Dashboard
  // Keeping it for backwards compatibility but showing a message
  const router = useRouter();
  const [isSetting, setIsSetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get Clerk user to check auth status
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  
  // Type assertion needed because users API may not be in generated types yet
  const currentUser = useQuery(
    (api as any).users?.getCurrentUser as any
  ) as any;
  const setAsAdmin = useMutation((api as any).admin?.setCurrentUserAsAdmin as any);
  const syncUser = useMutation((api as any).users?.syncUser as any);
  
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Auto-sync user if Clerk user exists but Convex user doesn't
  useEffect(() => {
    if (clerkLoaded && clerkUser && currentUser === null && !isSyncing) {
      setIsSyncing(true);
      syncUser({
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        name: clerkUser.fullName ?? clerkUser.firstName ?? clerkUser.emailAddresses[0]?.emailAddress ?? "User",
      }).catch((error) => {
        console.error("Failed to sync user:", error);
        setIsSyncing(false);
      });
    }
  }, [clerkLoaded, clerkUser, currentUser, syncUser, isSyncing]);
  
  const handleManualSync = async () => {
    if (!clerkUser) return;
    setIsSyncing(true);
    setError(null);
    
    // Add timeout
    const timeoutId = setTimeout(() => {
      setIsSyncing(false);
      setError("Sync timed out. This might be an authentication issue. Check the browser console for details.");
    }, 10000); // 10 second timeout
    
    try {
      console.log("Attempting to sync user:", {
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName || clerkUser.firstName,
      });
      
      const result = await syncUser({
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        name: clerkUser.fullName ?? clerkUser.firstName ?? clerkUser.emailAddresses[0]?.emailAddress ?? "User",
      });
      
      console.log("Sync successful, result:", result);
      clearTimeout(timeoutId);
      
      // Wait a moment for the query to update, then refresh
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error: any) {
      console.error("Sync error details:", error);
      clearTimeout(timeoutId);
      setIsSyncing(false);
      
      const errorMessage = error.message || error.toString() || "Failed to sync user";
      setError(`${errorMessage}. Check browser console (F12) for more details.`);
    }
  };

  // Debug: Log current user state
  console.log("Admin Setup - Current User:", currentUser);

  const handleSetAsAdmin = async () => {
    setIsSetting(true);
    setError(null);
    setSuccess(false);

    try {
      await setAsAdmin({});
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to set as admin");
    } finally {
      setIsSetting(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (currentUser === null) {
    // Check if user is signed in with Clerk but not synced to Convex
    if (clerkLoaded && clerkUser) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Account Sync Required</CardTitle>
              <CardDescription>
                Your account needs to be synced with our database. Click the button below to sync.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Signed in as:</strong>
                </p>
                <p className="text-sm font-medium">{clerkUser.fullName || clerkUser.emailAddresses[0]?.emailAddress}</p>
                <p className="text-xs text-muted-foreground">{clerkUser.primaryEmailAddress?.emailAddress}</p>
              </div>
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              <Button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full"
                size="lg"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing Account...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync My Account
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                After syncing, you'll be able to set yourself as admin.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Not signed in with Clerk
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to set up admin access.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <a href="/sign-in?redirect_url=/admin/setup">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser.role === "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Already Admin
            </CardTitle>
            <CardDescription>
              You already have admin access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/admin">Go to Admin Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Admin Setup
          </CardTitle>
          <CardDescription>
            Set yourself as an administrator to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Current User:</strong>
            </p>
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Current Role: <Badge variant="secondary">{currentUser.role}</Badge>
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Success!</p>
                <p className="text-sm text-green-700">
                  You are now an admin. Redirecting to admin dashboard...
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleSetAsAdmin}
            disabled={isSetting || success}
            className="w-full"
            size="lg"
          >
            {isSetting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting as Admin...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Admin Set!
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Set Me as Admin
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This will grant you admin access to review and approve club claims
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

