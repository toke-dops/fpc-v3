import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Cancel a subscription
 * This will cancel the subscription in Clerk and update Convex
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Subscriptions are now user-based, no clubId needed

    // Get user's subscription from Convex
    const subscriptions = await convex.query(api.subscriptions.getMySubscriptions);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const subscription = subscriptions[0];

    // Cancel subscription in Clerk (if Clerk billing API is available)
    try {
      if (subscription.clerk_subscription_id && clerkClient.billing) {
        // Use Clerk's billing API to cancel
        await clerkClient.billing.cancelSubscriptionItem(subscription.clerk_subscription_id, {
          endNow: false, // Cancel at end of period
        });
      }
    } catch (error: any) {
      console.warn("Could not cancel via Clerk API, will update Convex directly:", error.message);
      // Continue to update Convex even if Clerk API call fails
    }

    // Update Convex to schedule cancellation at period end (user-based)
    const result = await convex.mutation(api.subscriptions.cancelSubscription, {});

    return NextResponse.json({ 
      success: true,
      message: "Subscription will be canceled at the end of the billing period. You will retain access until then.",
      ...result,
    });
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}



