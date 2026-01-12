"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft, Calendar, Sparkles, Star, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useUser } from "@clerk/nextjs";

function BillingSuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const plan = searchParams.get("plan") as "business" | "featured" | null;
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  
  const subscriptions = useQuery(api.subscriptions.getMySubscriptions);
  const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

  // Immediately sync subscription after purchase
  useEffect(() => {
    if (!clerkLoaded || !clerkUser) return;
    
    // Only sync once per session
    const syncKey = `post_purchase_sync_${clerkUser.id}`;
    if (sessionStorage.getItem(syncKey)) return;
    
    setIsSyncing(true);
    sessionStorage.setItem(syncKey, "true");
    
    // Determine plan - priority order:
    // 1. URL parameter
    // 2. SessionStorage (stored before checkout)
    // 3. Existing subscription
    // 4. Default to featured
    let planToSync = plan;

    if (!planToSync) {
      // Check sessionStorage
      const storedPlan = sessionStorage.getItem("pending_plan_sync");
      if (storedPlan && ["business", "featured"].includes(storedPlan)) {
        planToSync = storedPlan as "business" | "featured";
        console.log(`Detected plan from sessionStorage: ${planToSync}`);
        // Clear it after use
        sessionStorage.removeItem("pending_plan_sync");
      } else if (subscription && subscription.plan && subscription.plan !== "basic") {
        planToSync = subscription.plan;
        console.log(`Detected plan from existing subscription: ${planToSync}`);
      } else {
        // Default to featured (most common purchase)
        planToSync = "featured";
        console.log(`No plan detected, defaulting to featured for sync`);
      }
    }
    
    if (!planToSync) {
      console.log("No plan to sync");
      setIsSyncing(false);
      return;
    }
    
    console.log(`=== POST-PURCHASE SYNC: Syncing ${planToSync} plan for user ${clerkUser.id} ===`);
    
    // Use the dedicated post-purchase sync endpoint
    fetch("/api/billing/post-purchase-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planToSync }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log("✅ Post-purchase sync successful:", data);
          setSyncSuccess(true);
          // Wait a moment for Convex to process, then redirect to subscriptions page
          // The subscriptions page will automatically refresh queries
          setTimeout(() => {
            router.push("/owner/subscriptions?success=subscription_activated");
          }, 2000);
        } else {
          console.error("❌ Post-purchase sync failed:", data);
          setSyncError(data.error || "Failed to sync subscription");
        }
      })
      .catch((err) => {
        console.error("❌ Post-purchase sync error:", err);
        setSyncError(err.message || "Failed to sync subscription");
      })
      .finally(() => {
        setIsSyncing(false);
      });
  }, [clerkLoaded, clerkUser, plan, subscription]);

  // Auto-redirect after 5 seconds (only if sync succeeded)
  useEffect(() => {
    if (syncSuccess) {
      const timer = setTimeout(() => {
        router.push("/owner/subscriptions?success=subscription_activated");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [router, syncSuccess]);

  const planName = plan === "business" ? "Business" : plan === "featured" ? "Featured" : "Premium";
  const PlanIcon = plan === "featured" ? Star : Sparkles;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your {planName} Plan subscription has been activated successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sync Status */}
          {isSyncing && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-900">Syncing subscription...</p>
                <p className="text-xs text-blue-700">Please wait while we update your account</p>
              </div>
            </div>
          )}

          {syncError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Sync Error</p>
                <p className="text-xs text-red-700">{syncError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setSyncError(null);
                    const syncKey = `post_purchase_sync_${clerkUser?.id}_${plan}`;
                    sessionStorage.removeItem(syncKey);
                    window.location.reload();
                  }}
                >
                  Retry Sync
                </Button>
              </div>
            </div>
          )}

          {syncSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Subscription Synced!</p>
                <p className="text-xs text-green-700">Your account has been updated successfully</p>
              </div>
            </div>
          )}

          {subscription && subscription.clubs && subscription.clubs.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Applies to {subscription.clubs.length} club{subscription.clubs.length !== 1 ? 's' : ''}</p>
              <div className="space-y-1">
                {subscription.clubs.slice(0, 3).map((club: any) => (
                  <p key={club._id} className="text-sm text-muted-foreground">
                    • {club.name} {club.city ? `(${club.city})` : ''}
                  </p>
                ))}
                {subscription.clubs.length > 3 && (
                  <p className="text-xs text-muted-foreground">+ {subscription.clubs.length - 3} more</p>
                )}
              </div>
            </div>
          )}

          {subscription && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Next Billing Date</p>
              </div>
              <p className="text-lg">
                {subscription.current_period_end 
                  ? new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <PlanIcon className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">{planName} Plan Active</p>
              <p className="text-xs text-green-700">You now have access to all {planName.toLowerCase()} features</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/owner/subscriptions">
                <ArrowLeft className="w-4 h-4 mr-2" />
                View Subscriptions
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/owner/dashboard">
                Manage My Clubs
              </Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Redirecting automatically in 5 seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <BillingSuccessPageContent />
    </Suspense>
  );
}

