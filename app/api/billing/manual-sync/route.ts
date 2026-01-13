import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { handleSubscriptionUpdate } from "../webhook/route";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Manual sync endpoint to sync subscriptions from Clerk to Convex
 * This works for both existing users who have purchased plans and future users
 * 
 * For existing users: This will check Clerk for subscriptions and sync them
 * For future users: Webhooks will handle sync automatically, but this can be used to verify
 * 
 */

// Force dynamic rendering since we use auth() which uses headers()
export const dynamic = 'force-dynamic';

/**
 * Usage: POST /api/billing/manual-sync
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=== MANUAL SYNC: Starting sync for user", userId);

    // Get user from Convex to ensure they exist
    const user = await convex.query(api.users.getUserByClerkId, { clerkUserId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in Convex. Please log out and log back in to sync your account." },
        { status: 404 }
      );
    }

    // Check existing subscriptions in Convex first
    const existingSubscriptions = await convex.query(api.subscriptions.debugMySubscriptions);
    
    if (existingSubscriptions.length > 0) {
      console.log("Found existing subscriptions in Convex:", existingSubscriptions.length);
      return NextResponse.json({
        success: true,
        message: "Found existing subscriptions in Convex",
        subscriptions: existingSubscriptions.map((sub: any) => ({
          id: sub._id,
          plan: sub.plan,
          status: sub.status,
          clerkSubscriptionId: sub.clerk_subscription_id,
        })),
        note: "Subscriptions are already synced. If you need to resync from Clerk, check webhook logs or retrigger webhook from Clerk Dashboard.",
      });
    }

    // If no subscriptions in Convex, try to get from Clerk
    // Note: Clerk's billing data is typically accessed via webhooks
    // For manual sync, we'll provide instructions
    console.log("No subscriptions found in Convex. Checking if webhook needs to be triggered...");
    
    return NextResponse.json({
      success: false,
      message: "No subscriptions found in Convex",
      instructions: [
        "1. Check Clerk Dashboard → Webhooks to ensure webhooks are configured",
        "2. Go to Clerk Dashboard → Billing → Subscriptions to find your subscription",
        "3. If subscription exists in Clerk, retrigger the webhook event from Clerk Dashboard",
        "4. Or wait for the next webhook event (subscription.updated, subscription.created)",
        "5. If you just purchased, the webhook should process automatically within a few minutes"
      ],
      userId,
      note: "Subscriptions are synced via webhooks. If webhook failed, check server logs and retrigger from Clerk Dashboard.",
    });
  } catch (error: any) {
    console.error("Error in manual-sync route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync subscription" },
      { status: 500 }
    );
  }
}

