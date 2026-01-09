import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Retry webhook processing for a subscription
 * This manually processes a subscription webhook event
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      );
    }

    // Get user from Convex
    const user = await convex.query(api.users.getUserByClerkId, { clerkUserId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in Convex. Please log out and log back in." },
        { status: 404 }
      );
    }

    // Try to get subscription from Clerk
    // Note: This is a placeholder - you'll need to use Clerk's actual billing API
    // For now, we'll check if subscription exists in Convex and update it
    
    const existingSubscriptions = await convex.query(api.subscriptions.debugMySubscriptions);
    const subscription = existingSubscriptions.find(
      (sub: any) => sub.clerk_subscription_id === subscriptionId
    );

    if (subscription) {
      return NextResponse.json({
        success: true,
        message: "Subscription found in Convex",
        subscription: {
          id: subscription._id,
          plan: subscription.plan,
          status: subscription.status,
          clerkSubscriptionId: subscription.clerk_subscription_id,
        },
        note: "If plan is incorrect, check webhook logs for plan detection issues",
      });
    }

    return NextResponse.json({
      success: false,
      message: "Subscription not found in Convex. Webhook may not have processed yet.",
      subscriptionId,
      note: "Check webhook logs in Clerk Dashboard and server logs for errors",
    });
  } catch (error: any) {
    console.error("Error in retry-webhook route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retry webhook" },
      { status: 500 }
    );
  }
}

