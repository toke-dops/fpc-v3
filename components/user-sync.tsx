"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


/**
 * Component to automatically sync Clerk user data to Convex
 * Runs silently in the background when user is authenticated
 * Also handles redirect for new club owners
 */
export function UserSync() {
  const { user, isLoaded } = useUser();
  const { getToken, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  const [syncAttempted, setSyncAttempted] = useState(false);
  
  const currentUser = useQuery(api.users.getCurrentUser);
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    // Only sync if:
    // 1. Clerk is loaded
    // 2. User is authenticated
    // 3. Convex user doesn't exist yet (null means not found, undefined means still loading)
    // 4. We haven't already attempted to sync
    if (
      isLoaded &&
      user &&
      currentUser === null && // null means user doesn't exist, undefined means still loading
      !syncAttempted
    ) {
      // Wait a bit for the Convex token to be available
      const syncWithDelay = async () => {
        // First, verify we can get a token from Clerk
        if (!authLoaded) {
          console.log("[UserSync] Auth not loaded yet, waiting...");
          setTimeout(() => {
            setSyncAttempted(false);
          }, 2000);
          return;
        }

        // Try to get token to verify it's available
        try {
          let token = await getToken({ template: "convex" });
          if (!token) {
            token = await getToken();
          }
          
          if (!token) {
            console.warn("[UserSync] No token available from Clerk, will retry");
            setTimeout(() => {
              setSyncAttempted(false);
            }, 5000);
            return;
          }
          
          console.log("[UserSync] Token available, length:", token.length);
        } catch (tokenError: any) {
          console.error("[UserSync] Error getting token:", tokenError);
          setTimeout(() => {
            setSyncAttempted(false);
          }, 5000);
          return;
        }
        
        // Give Convex a moment to process the token
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        setSyncAttempted(true);
        
        const email = user.primaryEmailAddress?.emailAddress ?? "";
        const name =
          user.fullName ??
          `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ??
          email.split("@")[0] ??
          "User";

        if (email) {
          // Check if user already exists to determine if we should set role
          // If user exists and is admin, don't pass role to preserve it
          // Only pass role for new users (default to club_owner)
          const shouldSetRole = currentUser === null; // Only set role for new users
          
          try {
            console.log("[UserSync] Attempting to sync user:", { email, name });
            // Only pass role if this is a new user (currentUser is null)
            // This prevents overwriting admin role on existing users
            if (shouldSetRole) {
              await syncUser({ email, name, role: "club_owner" });
            } else {
              // Existing user - don't pass role to preserve existing role (especially admin)
              await syncUser({ email, name });
            }
            console.log("[UserSync] User synced successfully");
          } catch (error: any) {
            console.error("[UserSync] Failed to sync user:", error);
            console.error("[UserSync] Error details:", {
              message: error.message,
              stack: error.stack,
            });
            
            // If it's an auth error, wait longer and retry
            if (error.message?.includes("Not authenticated")) {
              console.warn("[UserSync] Auth error - Convex not receiving token. Check:");
              console.warn("  1. Is CLERK_JWT_ISSUER_DOMAIN set in Convex Dashboard?");
              console.warn("  2. Is JWT template 'convex' created in Clerk?");
              console.warn("  3. Did you restart 'npx convex dev' after setting env var?");
              setTimeout(() => {
                setSyncAttempted(false);
              }, 15000); // Wait 15 seconds for token to be ready
            } else {
              // Other errors, retry after 5 seconds
              setTimeout(() => {
                setSyncAttempted(false);
              }, 5000);
            }
          }
        } else {
          // No email, can't sync
          console.warn("[UserSync] User has no email, cannot sync");
          setSyncAttempted(false);
        }
      };
      
      syncWithDelay();
    }
  }, [isLoaded, authLoaded, user, currentUser, syncUser, syncAttempted, getToken]);

  // Redirect all users (club owners) to dashboard after sign-up
  useEffect(() => {
    if (
      isLoaded &&
      user &&
      currentUser &&
      typeof window !== "undefined"
    ) {
      // Check if we're on the sign-up page or just signed up
      const pathname = window.location.pathname;
      if (pathname === "/sign-up" || pathname === "/sign-up-club-owner" || pathname === "/") {
        // Small delay to ensure sync is complete
        const timer = setTimeout(() => {
          router.push("/dashboard");
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoaded, user, currentUser, router]);

  // Don't render anything - this is a background sync component
  // SubscriptionSync component handles subscription syncing separately
  return null;
}

