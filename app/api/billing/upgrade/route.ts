import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Upgrade subscription - immediate activation
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { newPlan } = body;

    if (!newPlan || !["business", "featured"].includes(newPlan)) {
      return NextResponse.json(
        { error: "Valid plan is required: business or featured" },
        { status: 400 }
      );
    }

    console.log(`=== UPGRADE SUBSCRIPTION: User ${userId} wants to upgrade to ${newPlan}`);

    const result = await convex.mutation(api.subscriptions.upgradeSubscription, {
      newPlan: newPlan as "business" | "featured",
    });

    return NextResponse.json({
      ...result,
      success: result?.success ?? true,
    });
  } catch (error: any) {
    console.error("Error upgrading subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upgrade subscription" },
      { status: 500 }
    );
  }
}

