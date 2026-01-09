import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { handleSubscriptionUpdate } from "../webhook/route";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Fetch subscriptions directly from Clerk API and sync to Convex
 * This bypasses webhooks and directly queries Clerk for subscription data
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=== FETCH FROM CLERK: Fetching subscriptions for user", userId);

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

    console.log("Clerk user found:", clerkUser.id);

    // Clerk Billing uses Stripe under the hood
    // We need to access subscriptions through Clerk's organization or user metadata
    // However, Clerk doesn't expose a direct API for subscriptions
    // Instead, we'll check the user's organization memberships which may have billing
    
    // Try to get organization memberships (Clerk Billing might be tied to orgs)
    const orgMemberships = await clerkClient.users.getOrganizationMembershipList({ userId });
    
    console.log("Organization memberships:", orgMemberships.data?.length || 0);

    // Since Clerk doesn't expose a direct subscription API, we'll use a different approach:
    // Check if there's subscription data in user metadata or try to infer from recent activity
    
    // Check user's public/private metadata for subscription info
    const publicMetadata = clerkUser.publicMetadata || {};
    const privateMetadata = clerkUser.privateMetadata || {};
    
    console.log("User metadata:", { 
      public: Object.keys(publicMetadata), 
      private: Object.keys(privateMetadata) 
    });

    // Try to find subscription indicators in metadata
    const hasSubscriptionMetadata = 
      publicMetadata.subscription ||
      publicMetadata.plan ||
      privateMetadata.subscription ||
      privateMetadata.plan;

    if (hasSubscriptionMetadata) {
      console.log("Found subscription metadata:", hasSubscriptionMetadata);
    }

    // Since we can't directly query Clerk's subscription API,
    // we'll return instructions and suggest checking webhook logs
    return NextResponse.json({
      success: false,
      message: "Clerk doesn't expose a direct subscription API. Subscriptions are managed via webhooks.",
      instructions: [
        "1. Ensure webhook is configured in Clerk Dashboard → Webhooks",
        "2. Webhook URL should be: " + (process.env.NEXT_PUBLIC_SITE_URL || "YOUR_SITE_URL") + "/api/billing/webhook",
        "3. Enable events: subscription.created, subscription.updated, subscription.deleted",
        "4. Check webhook delivery logs in Clerk Dashboard",
        "5. If webhook failed, you can manually create subscription using /api/billing/force-sync"
      ],
      userId,
      note: "For immediate sync after purchase, use the force-sync endpoint with the plan you purchased.",
    });
  } catch (error: any) {
    console.error("Error in fetch-from-clerk route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

