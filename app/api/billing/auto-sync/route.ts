import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Automatic subscription sync endpoint
 * Called by SubscriptionSync component to keep subscriptions in sync
 * Similar to how user sync works - runs automatically in the background
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=== AUTO SYNC: Syncing subscriptions for user", userId);

    // Get user from Convex
    const user = await convex.query(api.users.getUserByClerkId, { clerkUserId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in Convex. User must be synced first." },
        { status: 404 }
      );
    }

    // Use the syncMySubscriptionStatus mutation which:
    // 1. Checks existing subscriptions
    // 2. Checks club plans
    // 3. Creates subscriptions if missing
    // 4. Updates user plan and clubs
    const result = await convex.mutation(api.subscriptions.syncMySubscriptionStatus, {});

    console.log("✅ Auto sync successful:", result);

    return NextResponse.json({
      ...result,
      success: true,
    });
  } catch (error: any) {
    console.error("Error in auto-sync route:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to sync subscription" 
      },
      { status: 500 }
    );
  }
}

