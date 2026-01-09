"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState, useRef } from "react";

/**
 * Component to automatically sync subscription data from Clerk to Convex
 * Runs silently in the background when user is authenticated
 * Similar to UserSync but for subscriptions
 * 
 * This component:
 * 1. Checks if user has subscriptions in Convex
 * 2. If not, or if subscription status is outdated, triggers sync
 * 3. Runs periodically to keep subscriptions in sync
 * 4. All syncs happen silently without page reloads
 */
export function SubscriptionSync() {
  const { user, isLoaded } = useUser();
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);
  
  const currentUser = useQuery(api.users.getCurrentUser);
  const subscriptions = useQuery(api.subscriptions.getMySubscriptions);
  const subscriptionStatus = useQuery(api.subscriptions.getUserSubscriptionStatus);
  const myClubs = useQuery(api.owner.getMyClubs);
  const syncSubscriptionStatus = useMutation(api.subscriptions.syncMySubscriptionStatus);

  // Auto-sync subscriptions when user is authenticated
  useEffect(() => {
    if (!isLoaded || !user || !currentUser) return;

    // Only sync if user exists in Convex (user must be synced first)
    if (currentUser === null) {
      return;
    }

    // Wait for queries to load
    if (subscriptions === undefined || subscriptionStatus === undefined || myClubs === undefined) {
      return;
    }

    // Check if we should sync (silently, without user interruption)
    const shouldSync = () => {
      // Don't sync if already syncing
      if (isSyncingRef.current) return false;

      // Sync if no subscriptions found (only once per session)
      if (subscriptions.length === 0) {
        const syncKey = `subscription_sync_attempted_${user.id}`;
        if (sessionStorage.getItem(syncKey)) return false;
        sessionStorage.setItem(syncKey, "true");
        return true;
      }

      // Sync if subscription status is basic but user has paid plan clubs
      if (subscriptionStatus === "basic") {
        const clubPlans = myClubs?.map(club => club.plan) || [];
        const hasPaidPlan = clubPlans.includes("business") || clubPlans.includes("featured");
        if (hasPaidPlan) {
          const syncKey = `subscription_sync_paid_plan_${user.id}`;
          if (sessionStorage.getItem(syncKey)) return false;
          sessionStorage.setItem(syncKey, "true");
          return true;
        }
      }

      // Fix: If subscriptions exist but user/clubs aren't updated
      // OR if subscription is basic but user purchased a paid plan (indicated by pending sync)
      if (subscriptions.length > 0) {
        const subscriptionPlan = subscriptions[0]?.plan;
        const userPlan = currentUser?.plan || "basic";
        const clubPlans = myClubs?.map(club => club.plan) || [];
        const hasMismatch = 
          (subscriptionPlan === "business" || subscriptionPlan === "featured") &&
          (userPlan !== subscriptionPlan || !clubPlans.includes(subscriptionPlan));
        
        // Also check if there's a pending plan sync (user just purchased)
        const pendingPlan = sessionStorage.getItem("pending_plan_sync");
        const needsUpgrade = pendingPlan && 
                            (pendingPlan === "business" || pendingPlan === "featured") &&
                            subscriptionPlan === "basic";
        
        if (hasMismatch || needsUpgrade) {
          const fixKey = `subscription_fix_${user.id}`;
          if (sessionStorage.getItem(fixKey)) return false;
          sessionStorage.setItem(fixKey, "true");
          return true;
        }
      }

      // Sync periodically (every 15 minutes) to catch webhook failures - much less frequent
      const now = Date.now();
      const FIFTEEN_MINUTES = 15 * 60 * 1000;
      if (lastSyncTime === null || (now - lastSyncTime) > FIFTEEN_MINUTES) {
        return true;
      }

      return false;
    };

    const performSync = async () => {
      if (!shouldSync() || isSyncingRef.current) return;

      isSyncingRef.current = true;
      
      try {
        // Check if we need to fix existing subscriptions first
        if (subscriptions && subscriptions.length > 0) {
          const subscriptionPlan = subscriptions[0]?.plan;
          const userPlan = currentUser?.plan || "basic";
          const clubPlans = myClubs?.map(club => club.plan) || [];
          const needsFix = 
            (subscriptionPlan === "business" || subscriptionPlan === "featured") &&
            (userPlan !== subscriptionPlan || !clubPlans.includes(subscriptionPlan));
          
          // Also check for pending plan upgrade
          const pendingPlan = sessionStorage.getItem("pending_plan_sync");
          const needsUpgrade = pendingPlan && 
                              (pendingPlan === "business" || pendingPlan === "featured") &&
                              subscriptionPlan === "basic";
          
          if (needsFix) {
            // Fix existing subscriptions
            const fixKey = `subscription_fix_${user.id}`;
            if (!sessionStorage.getItem(fixKey)) {
              sessionStorage.setItem(fixKey, "true");
              await fetch("/api/billing/fix-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });
            }
          } else if (needsUpgrade) {
            // Upgrade subscription plan
            const upgradeKey = `subscription_upgrade_${user.id}_${pendingPlan}`;
            if (!sessionStorage.getItem(upgradeKey)) {
              sessionStorage.setItem(upgradeKey, "true");
              await fetch("/api/billing/update-subscription-plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: pendingPlan }),
              });
              sessionStorage.removeItem("pending_plan_sync");
            }
          }
        }
        
        // Silent sync - no console logs in production, no page reloads
        await syncSubscriptionStatus();
        setLastSyncTime(Date.now());
      } catch (error: any) {
        // Silent error handling - don't interrupt user
        console.error("[SubscriptionSync] Silent sync error:", error);
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Initial sync attempt (only if needed)
    performSync();

    // Set up periodic sync (every 15 minutes - much less frequent)
    syncIntervalRef.current = setInterval(() => {
      performSync();
    }, 15 * 60 * 1000); // 15 minutes

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [
    isLoaded,
    user,
    currentUser,
    subscriptions,
    subscriptionStatus,
    myClubs,
    syncSubscriptionStatus,
    lastSyncTime,
  ]);

  // Handle pending plan sync from checkout (only once, silently)
  useEffect(() => {
    if (!isLoaded || !user || !currentUser) return;

    const pendingPlan = sessionStorage.getItem("pending_plan_sync");
    if (pendingPlan && ["business", "featured"].includes(pendingPlan)) {
      const syncKey = `subscription_sync_${user.id}_${pendingPlan}`;
      if (sessionStorage.getItem(syncKey)) return;

      sessionStorage.setItem(syncKey, "true");

      // Silent sync via API - no page reload
      fetch("/api/billing/post-purchase-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: pendingPlan }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            sessionStorage.removeItem("pending_plan_sync");
            // Queries will automatically update via React - no reload needed
          }
        })
        .catch((err) => {
          // Silent error handling
          console.error("[SubscriptionSync] Silent sync error:", err);
        });
    }
  }, [isLoaded, user, currentUser]);

  // Don't render anything - this is a background sync component
  return null;
}

