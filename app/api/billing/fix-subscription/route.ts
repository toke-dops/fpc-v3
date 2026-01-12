import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Fix existing subscription - updates user and clubs based on existing subscription records
 * This is useful when subscriptions exist but user/clubs weren't updated
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=== FIX SUBSCRIPTION: Fixing user and clubs for user", userId);

    // Get user from Convex
    const user = await convex.query(api.users.getUserByClerkId, { clerkUserId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in Convex. User must be synced first." },
        { status: 404 }
      );
    }

    // Use the fixExistingSubscriptions mutation
    const result = await convex.mutation(api.subscriptions.fixExistingSubscriptions, {});

    console.log("✅ Fix subscription successful:", result);

    return NextResponse.json({
      ...result,
      success: result?.success ?? true,
    });
  } catch (error: any) {
    console.error("Error in fix-subscription route:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fix subscription" 
      },
      { status: 500 }
    );
  }
}

