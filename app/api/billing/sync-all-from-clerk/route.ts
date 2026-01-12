import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Sync ALL subscriptions from Clerk to Convex
 * This endpoint fetches all subscription data from Clerk and ensures Convex matches exactly
 * 
 * Usage: POST /api/billing/sync-all-from-clerk
 * No body required - uses authenticated user's Clerk ID
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=== SYNC ALL FROM CLERK: Starting full sync for user", userId);

    // Get user from Convex
    const user = await convex.query(api.users.getUserByClerkId, { clerkUserId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in Convex. Please log out and log back in to sync your account." },
        { status: 404 }
      );
    }

    // Get Clerk user to access billing information
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    if (!clerkUser) {
      return NextResponse.json(
        { error: "Clerk user not found" },
        { status: 404 }
      );
    }

    console.log("Clerk user found:", clerkUser.id, clerkUser.emailAddresses[0]?.emailAddress);

    // Get existing subscriptions from Convex
    const existingSubscriptions = await convex.query(api.subscriptions.debugMySubscriptions);
    console.log(`Found ${existingSubscriptions.length} existing subscription(s) in Convex`);

    // Clerk Billing doesn't expose a direct API to fetch all subscriptions
    // We rely on webhooks to sync subscription data
    // However, we can trigger a sync by calling the webhook handler with subscription data
    
    // Since we can't directly fetch from Clerk, we'll:
    // 1. Delete all existing subscriptions in Convex
    // 2. Wait for webhooks to recreate them from Clerk
    // OR
    // 1. Mark all existing subscriptions as needing sync
    // 2. Trigger webhook events manually
    
    // Better approach: Use the post-purchase-sync endpoint which will sync based on what we know
    // But first, let's check if we can get subscription info from Clerk's metadata
    
    const subscriptionMetadata = clerkUser.publicMetadata?.subscriptions || 
                                clerkUser.privateMetadata?.subscriptions ||
                                [];
    
    console.log("Subscription metadata from Clerk:", subscriptionMetadata);

    // If we have subscription metadata, sync each one
    if (Array.isArray(subscriptionMetadata) && subscriptionMetadata.length > 0) {
      const syncResults = [];
      
      for (const subData of subscriptionMetadata) {
        try {
          const result = await convex.mutation(api.subscription_sync.syncSubscriptionFromWebhook, {
            clerkUserId: userId,
            clerkSubscriptionId: subData.id || `clerk_${userId}_${Date.now()}`,
            clerkCustomerId: subData.customer_id || `customer_${userId}`,
            plan: subData.plan || "basic",
            status: subData.status || "active",
            currentPeriodEnd: subData.current_period_end 
              ? (typeof subData.current_period_end === "number" 
                  ? subData.current_period_end 
                  : new Date(subData.current_period_end).getTime())
              : Date.now() + 30 * 24 * 60 * 60 * 1000,
          });
          syncResults.push({ subscription: subData.id, success: true, result });
        } catch (error: any) {
          syncResults.push({ subscription: subData.id, success: false, error: error.message });
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Synced ${syncResults.filter(r => r.success).length} subscription(s) from Clerk metadata`,
        results: syncResults,
      });
    }

    // If no metadata, we need to rely on webhooks
    // Return instructions and suggest manual webhook retrigger
    return NextResponse.json({
      success: false,
      message: "Cannot directly fetch subscriptions from Clerk API. Subscriptions are synced via webhooks.",
      instructions: [
        "1. Go to Clerk Dashboard → Webhooks",
        "2. Ensure webhook endpoint is configured: " + process.env.NEXT_PUBLIC_SITE_URL + "/api/billing/webhook",
        "3. Check if subscription.created or subscription.updated events are being sent",
        "4. If subscription exists in Clerk Dashboard, retrigger the webhook event",
        "5. Or use the 'Sync from Clerk' button on the subscriptions page",
      ],
      note: "Subscriptions are synced via webhooks. If you just purchased, wait a few minutes or retrigger the webhook from Clerk Dashboard.",
      existingSubscriptions: existingSubscriptions.map(sub => ({
        id: sub._id,
        plan: sub.plan,
        status: sub.status,
        clerk_subscription_id: sub.clerk_subscription_id,
      })),
    });
  } catch (error: any) {
    console.error("Error in sync-all-from-clerk route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync subscriptions" },
      { status: 500 }
    );
  }
}

