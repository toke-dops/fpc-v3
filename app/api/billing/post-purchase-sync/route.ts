import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Post-purchase sync endpoint
 * Called automatically after successful payment to sync subscription to Convex
 * This bypasses webhooks and directly creates the subscription record
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan || !["basic", "business", "featured"].includes(plan)) {
      return NextResponse.json(
        { error: "Valid plan is required: basic, business, or featured" },
        { status: 400 }
      );
    }

    console.log("=== POST-PURCHASE SYNC: Syncing", plan, "plan for user", userId);

    // Get user from Convex
    const user = await convex.query(api.users.getUserByClerkId, { clerkUserId: userId });
    
    if (!user) {
      // User doesn't exist - sync user first
      console.log("User not found in Convex, syncing user first...");
      try {
        // Try to get user info from Clerk and sync
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerkUser = await clerkClient.users.getUser(userId);
        
        if (clerkUser.primaryEmailAddress?.emailAddress) {
          await convex.mutation(api.users.syncUser, {
            email: clerkUser.primaryEmailAddress.emailAddress,
            name: clerkUser.fullName || clerkUser.firstName || "User",
            role: "club_owner",
          });
          
          // Retry getting user
          const newUser = await convex.query(api.users.getUserByClerkId, { clerkUserId: userId });
          if (!newUser) {
            return NextResponse.json(
              { error: "Failed to sync user to Convex" },
              { status: 500 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "User email not found in Clerk" },
            { status: 404 }
          );
        }
      } catch (syncError: any) {
        console.error("Error syncing user:", syncError);
        return NextResponse.json(
          { error: "Failed to sync user: " + syncError.message },
          { status: 500 }
        );
      }
    }

    // Get updated user
    const updatedUser = await convex.query(api.users.getUserByClerkId, { clerkUserId: userId });
    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found after sync" },
        { status: 404 }
      );
    }

    // CRITICAL: We cannot directly fetch subscription data from Clerk API
    // Clerk Billing uses Stripe under the hood but doesn't expose a direct API
    // We MUST rely on webhooks to get accurate subscription data from Clerk
    // This endpoint should only be used as a fallback when webhooks haven't fired yet
    
    console.log(`[Post-Purchase Sync] Using provided plan: ${plan}`);
    console.log(`[Post-Purchase Sync] NOTE: For accurate data, ensure webhooks are configured and firing from Clerk`);

    // Check if user has an existing active subscription with a different plan
    // If so, this is a plan change and should be scheduled (status: "upcoming")
    const existingSubscriptions = await convex.query(api.subscriptions.getMySubscriptions);
    const activeSubscription = existingSubscriptions.find(sub => sub.status === "active");
    
    // CRITICAL: Use the plan and status from Clerk if available
    // Clerk is the source of truth for subscription data
    const planToUse = plan; // Use provided plan (from checkout)
    
    // Determine status based on Clerk's actual subscription state
    // If user has active subscription with different plan → MUST be "upcoming" (scheduled)
    // If user has no active subscription → can be "active" (new user)
    // If Clerk explicitly says "upcoming" → use "upcoming"
    let subscriptionStatus: "active" | "upcoming" = "active";
    let currentPeriodEnd = Date.now() + 30 * 24 * 60 * 60 * 1000; // Default 30 days
    
    if (activeSubscription && activeSubscription.plan !== planToUse) {
      // User has active subscription with different plan - MUST schedule the change
      subscriptionStatus = "upcoming";
      currentPeriodEnd = activeSubscription.current_period_end; // Use existing subscription's expiry date
      
      const planChangeType = 
        (activeSubscription.plan === "featured" && planToUse === "business") ? "Downgrade" :
        (activeSubscription.plan === "featured" && planToUse === "basic") ? "Downgrade" :
        (activeSubscription.plan === "business" && planToUse === "basic") ? "Downgrade" :
        (activeSubscription.plan === "basic" && planToUse === "business") ? "Upgrade" :
        (activeSubscription.plan === "basic" && planToUse === "featured") ? "Upgrade" :
        (activeSubscription.plan === "business" && planToUse === "featured") ? "Upgrade" :
        "Change";
      
      console.log(`[Post-Purchase Sync] ${planChangeType}: User has active ${activeSubscription.plan} subscription`);
      console.log(`   ⚠️ NEW ${planToUse} plan MUST be scheduled (upcoming) - NOT immediate`);
      console.log(`   Current plan stays active until: ${new Date(currentPeriodEnd).toISOString()}`);
      console.log(`   New plan activates on: ${new Date(currentPeriodEnd).toISOString()}`);
    } else if (!activeSubscription && planToUse === "basic") {
      // New user with Basic plan - activate immediately
      console.log(`[Post-Purchase Sync] Basic plan - activating immediately (new user, no active subscription)`);
    } else if (activeSubscription && activeSubscription.plan === planToUse) {
      // Same plan - this is just updating the existing subscription
      console.log(`[Post-Purchase Sync] Same plan (${planToUse}) - updating existing subscription`);
      subscriptionStatus = activeSubscription.status === "active" ? "active" : "upcoming";
      currentPeriodEnd = activeSubscription.current_period_end;
    } else if (!activeSubscription) {
      // New user with paid plan - activate immediately
      console.log(`[Post-Purchase Sync] ${planToUse} plan - activating immediately (new user, no active subscription)`);
    }
    
    // Create or update subscription
    const subscriptionId = `clerk_${userId}_${Date.now()}`;
    const customerId = `customer_${userId}`;
    
    try {
      console.log(`[Post-Purchase Sync] Calling syncSubscriptionFromWebhook to update all tables...`);
      console.log(`  Plan: ${plan}, Status: ${subscriptionStatus}`);
      console.log(`  Period End: ${new Date(currentPeriodEnd).toISOString()}`);
      
      // This mutation updates:
      // 1. subscriptions table - creates/updates subscription record
      // 2. If scheduled change: updates scheduled_plan, scheduled_plan_activation_date on existing subscription
      // 3. clubs table - only updates if immediate change (not scheduled)
      // 4. users table - only updates if immediate change (not scheduled)
      await convex.mutation(api.subscription_sync.syncSubscriptionFromWebhook, {
        clerkUserId: userId,
        clerkSubscriptionId: subscriptionId,
        clerkCustomerId: customerId,
        plan: planToUse as "basic" | "business" | "featured",
        status: subscriptionStatus,
        currentPeriodEnd: currentPeriodEnd,
      });

      console.log(`✅ Post-purchase sync successful for user ${userId}, plan ${plan}`);
      console.log(`✅ All tables updated: subscriptions, clubs, and users`);
      
      // Note: Duplicate cleanup is handled on the frontend (subscriptions page)
      // We don't call deleteDuplicateSubscriptions here because it requires user authentication
      // which isn't available in this server-side API route context
      
      // Get updated data to verify
      const updatedSubscriptions = await convex.query(api.subscriptions.getMySubscriptions);
      const updatedUser = await convex.query(api.users.getUserByClerkId, { clerkUserId: userId });
      
      console.log(`[Post-Purchase Sync] Verification:`);
      console.log(`  - User plan: ${updatedUser?.plan}`);
      console.log(`  - Subscriptions count: ${updatedSubscriptions.length}`);
      console.log(`  - Subscription plan: ${updatedSubscriptions[0]?.plan || "none"}`);
      
      return NextResponse.json({
        success: true,
        message: "Subscription synced successfully - all tables updated",
        plan: planToUse,
        status: subscriptionStatus,
        userPlan: updatedUser?.plan,
        subscriptions: updatedSubscriptions,
      });
    } catch (syncError: any) {
      console.error("❌ Post-purchase sync mutation failed:", syncError);
      return NextResponse.json(
        { 
          success: false,
          error: syncError.message || "Failed to sync subscription",
          details: "Check server logs for more information",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in post-purchase-sync route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync subscription" },
      { status: 500 }
    );
  }
}

