import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Clerk Billing Checkout Route
 * 
 * This route redirects users to the Clerk PricingTable checkout page.
 * Clerk's PricingTable component handles the actual checkout flow.
 */

// Force dynamic rendering since we use auth() which uses headers()
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan) {
      return NextResponse.json(
        { error: "plan is required" },
        { status: 400 }
      );
    }

    // Validate plan
    if (!["business", "featured"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'business' or 'featured'" },
        { status: 400 }
      );
    }

    // Redirect to Clerk PricingTable checkout page
    // The PricingTable component handles the actual payment processing
    // Subscriptions are now user-based, not club-based
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkoutUrl = `${baseUrl}/billing/checkout?plan=${plan}`;

    return NextResponse.json({ checkoutUrl });
  } catch (error: any) {
    console.error("Error creating checkout URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout URL" },
      { status: 500 }
    );
  }
}
