import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Update subscription plan manually
 * This is useful when a subscription exists but has the wrong plan
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, subscriptionId } = body;

    if (!plan || !["business", "featured"].includes(plan)) {
      return NextResponse.json(
        { error: "Valid plan is required: business or featured" },
        { status: 400 }
      );
    }

    console.log("=== UPDATE SUBSCRIPTION PLAN: Updating to", plan, "for user", userId);

    // Get user from Convex
    const user = await convex.query(api.users.getUserByClerkId, { clerkUserId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in Convex" },
        { status: 404 }
      );
    }

    // Get all subscriptions for this user
    const allSubscriptions = await convex.query(api.subscriptions.debugMySubscriptions);
    
    if (allSubscriptions.length === 0) {
      return NextResponse.json(
        { error: "No subscriptions found" },
        { status: 404 }
      );
    }

    // Find subscription to update
    let subscriptionToUpdate = allSubscriptions[0];
    if (subscriptionId) {
      const found = allSubscriptions.find((sub: any) => sub._id === subscriptionId);
      if (found) subscriptionToUpdate = found;
    }

    // Update subscription plan using the dedicated mutation
    const result = await convex.mutation(api.subscriptions.updateSubscriptionPlan, {
      subscriptionId: subscriptionToUpdate._id,
      plan: plan as "business" | "featured",
    });

    console.log(`✅ Updated subscription ${subscriptionToUpdate._id} to ${plan} plan`);

    return NextResponse.json({
      success: true,
      message: `Subscription updated to ${plan} plan`,
      plan,
    });
  } catch (error: any) {
    console.error("Error updating subscription plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update subscription plan" },
      { status: 500 }
    );
  }
}

