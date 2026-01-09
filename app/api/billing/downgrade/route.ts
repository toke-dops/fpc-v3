import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Downgrade subscription - schedules plan change at period end
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { newPlan } = body;

    if (!newPlan || !["basic", "business"].includes(newPlan)) {
      return NextResponse.json(
        { error: "Valid plan is required: basic or business" },
        { status: 400 }
      );
    }

    console.log(`=== DOWNGRADE SUBSCRIPTION: User ${userId} wants to downgrade to ${newPlan}`);

    const result = await convex.mutation(api.subscriptions.downgradeSubscription, {
      newPlan: newPlan as "basic" | "business",
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error downgrading subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to downgrade subscription" },
      { status: 500 }
    );
  }
}

