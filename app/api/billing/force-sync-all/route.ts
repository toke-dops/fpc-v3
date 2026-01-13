import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { handleSubscriptionUpdate } from "../webhook/route";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Force sync all subscriptions by manually triggering webhook events
 * This endpoint simulates webhook events for all subscriptions that should exist
 * 
 * Usage: POST /api/billing/force-sync-all
 * Body: { subscriptions: [{ plan, status, clerkSubscriptionId, currentPeriodEnd }] }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const subscriptions = body.subscriptions || [];

    console.log("=== FORCE SYNC ALL: Processing", subscriptions.length, "subscriptions ===");

    if (subscriptions.length === 0) {
      return NextResponse.json({
        error: "No subscriptions provided. Please provide subscriptions array in body.",
        example: {
          subscriptions: [
            { plan: "featured", status: "active", clerkSubscriptionId: "sub_xxx", currentPeriodEnd: 1234567890 },
            { plan: "business", status: "upcoming", clerkSubscriptionId: "sub_yyy", currentPeriodEnd: 1234567890 },
          ]
        }
      }, { status: 400 });
    }

    const results = [];

    for (const sub of subscriptions) {
      try {
        console.log(`\n🔄 Processing subscription: ${sub.plan} (${sub.status})`);
        
        // Create a synthetic webhook event
        const syntheticEvent = {
          id: sub.clerkSubscriptionId || `clerk_${userId}_${Date.now()}`,
          customer_id: sub.clerkCustomerId || `customer_${userId}`,
          status: sub.status,
          plan: {
            key: sub.plan === "featured" ? "featured_plan" : sub.plan === "business" ? "business_plan" : "basic_user",
            name: sub.plan === "featured" ? "Featured Plan" : sub.plan === "business" ? "Business Plan" : "Basic Plan",
          },
          current_period_end: sub.currentPeriodEnd || (Date.now() + 30 * 24 * 60 * 60 * 1000),
          metadata: {
            plan: sub.plan,
          },
        };

        // Call the webhook handler
        await handleSubscriptionUpdate(syntheticEvent);
        
        results.push({
          plan: sub.plan,
          status: sub.status,
          success: true,
        });
        
        console.log(`✅ Synced ${sub.plan} (${sub.status})`);
      } catch (error: any) {
        console.error(`❌ Failed to sync ${sub.plan} (${sub.status}):`, error);
        results.push({
          plan: sub.plan,
          status: sub.status,
          success: false,
          error: error.message,
        });
      }
    }

    // Get updated subscriptions from Convex
    const updatedSubscriptions = await convex.query(api.subscriptions.getMySubscriptions);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.filter(r => r.success).length}/${results.length} subscriptions`,
      results,
      updatedSubscriptions: updatedSubscriptions.map(sub => ({
        plan: sub.plan,
        status: sub.status,
        clerk_subscription_id: sub.clerk_subscription_id,
      })),
    });
  } catch (error: any) {
    console.error("Error in force-sync-all route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync subscriptions" },
      { status: 500 }
    );
  }
}

