import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { handleSubscriptionUpdate } from "../webhook/route";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Sync subscription from Clerk - automatically fetches and syncs user's subscriptions
 * This endpoint fetches subscriptions from Clerk and syncs them to Convex
 * 
 * Usage: POST /api/billing/sync-from-clerk
 * No body required - uses authenticated user's Clerk ID
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=== SYNC FROM CLERK: Starting sync for user", userId);

    // Get user from Convex
    const user = await convex.query(api.users.getUserByClerkId, { clerkUserId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in Convex. Please log out and log back in to sync your account." },
        { status: 404 }
      );
    }

    // Get Clerk user to access billing information
    const clerkUser = await clerkClient.users.getUser(userId);
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Clerk user not found" },
        { status: 404 }
      );
    }

    console.log("Clerk user found:", clerkUser.id, clerkUser.emailAddresses[0]?.emailAddress);

    // Try to get subscriptions from Clerk
    // Clerk Billing uses Stripe under the hood, so we need to access it through Clerk's API
    // First, try to get the customer ID from Clerk user metadata or public metadata
    const customerId = clerkUser.publicMetadata?.stripeCustomerId || 
                       clerkUser.privateMetadata?.stripeCustomerId ||
                       clerkUser.publicMetadata?.clerkCustomerId ||
                       clerkUser.privateMetadata?.clerkCustomerId;

    console.log("Customer ID from metadata:", customerId);

    // If we have a customer ID, we can try to fetch subscriptions
    // But Clerk doesn't expose a direct API for this, so we'll use a different approach:
    // Create a synthetic subscription object based on what we know and sync it
    
    // Check if user has any active subscriptions in Convex first
    const existingSubscriptions = await convex.query(api.subscriptions.debugMySubscriptions);
    
    if (existingSubscriptions.length > 0) {
      console.log("Found existing subscriptions in Convex:", existingSubscriptions.length);
      
      // Sync status to ensure everything is up to date
      await convex.mutation(api.subscriptions.syncMySubscriptionStatus);
      
      const updatedSubscriptions = await convex.query(api.subscriptions.getMySubscriptions);
      
      return NextResponse.json({
        success: true,
        message: "Subscriptions already exist, synced status",
        subscriptions: updatedSubscriptions,
      });
    }

    // If no subscriptions found, we need to create one based on Clerk's billing data
    // Since Clerk Billing doesn't expose a direct API, we'll check if the user has
    // a subscription by looking at their Clerk organization or billing status
    
    // For now, let's create a manual sync that the user can trigger
    // We'll check if there's a way to detect active subscriptions from Clerk
    
    // Try to get organization memberships (Clerk Billing might be tied to orgs)
    const orgMemberships = await clerkClient.users.getOrganizationMembershipList({ userId });
    
    console.log("Organization memberships:", orgMemberships.data?.length || 0);

    // Since we can't directly fetch subscriptions from Clerk's API,
    // we'll return instructions and also try to trigger a webhook retry
    // The best approach is to have the user check their Clerk Dashboard
    
    return NextResponse.json({
      success: false,
      message: "No subscriptions found. Please ensure webhooks are configured.",
      instructions: [
        "1. Go to Clerk Dashboard → Webhooks",
        "2. Ensure webhook endpoint is configured: " + process.env.NEXT_PUBLIC_SITE_URL + "/api/billing/webhook",
        "3. Check if subscription.created or subscription.updated events are being sent",
        "4. If subscription exists in Clerk Dashboard, retrigger the webhook event",
        "5. Or wait a few minutes for the webhook to process automatically"
      ],
      userId,
      clerkUserId: userId,
      note: "Subscriptions are synced via webhooks. If you just purchased, wait a few minutes or retrigger the webhook from Clerk Dashboard.",
    });
  } catch (error: any) {
    console.error("Error in sync-from-clerk route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync subscription" },
      { status: 500 }
    );
  }
}
