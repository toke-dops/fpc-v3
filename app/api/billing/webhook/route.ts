import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Force dynamic rendering since we use headers()
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = await headers();
    const signature = headersList.get("clerk-signature");

    // Verify webhook signature (implement Clerk webhook verification)
    // TODO: Implement actual Clerk webhook signature verification

    console.log("Webhook received:", body.type, body.data?.id);

    const event = body;

    // Handle different Clerk billing events
    switch (event.type) {
      case "subscription.created":
      case "subscription.updated":
        await handleSubscriptionUpdate(event.data);
        break;
      case "subscription.deleted":
      case "subscription.canceled":
        await handleSubscriptionCancel(event.data);
        break;
      case "payment_intent.payment_failed":
      case "invoice.payment_failed":
        console.log("Payment failed event received:", event.data);
        // Payment failures are handled by Clerk, but we log them for debugging
        await handlePaymentFailure(event.data);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", message: error.message },
      { status: 500 }
    );
  }
}

export async function handleSubscriptionUpdate(subscription: any) {
  try {
    console.log("=== WEBHOOK: Handling subscription update ===");
    console.log("Full subscription object:", JSON.stringify(subscription, null, 2));

    // Extract subscription data from Clerk webhook
    const clerkSubscriptionId = subscription.id || subscription.subscription_id || subscription.subscriptionId;
    const clerkCustomerId = subscription.customer_id || subscription.customerId || subscription.customer || subscription.customer_id;
    
    // Get user ID - Clerk Billing webhooks might include user info in different places
    // Try multiple possible fields and paths
    let clerkUserId = subscription.user_id || 
                      subscription.userId || 
                      subscription.user?.id ||
                      subscription.customer?.id ||
                      subscription.customer_id || 
                      subscription.customerId ||
                      subscription.customer ||
                      subscription.metadata?.user_id ||
                      subscription.metadata?.userId ||
                      subscription.metadata?.clerk_user_id ||
                      subscription.object?.user_id ||
                      subscription.data?.user_id ||
                      subscription.data?.userId;
    
    // If we have a customer_id but not user_id, try to resolve customer to user
    // In Clerk Billing, customer_id might be the Clerk user ID directly
    if (!clerkUserId && clerkCustomerId) {
      // Check if customer_id looks like a Clerk user ID (starts with user_)
      if (clerkCustomerId.startsWith("user_")) {
        clerkUserId = clerkCustomerId;
      } else {
        // Otherwise, try using customer_id as user_id (Clerk might use same ID)
        clerkUserId = clerkCustomerId;
      }
    }
    
    // If still no user ID, try to get from subscription's object or data
    if (!clerkUserId && subscription.object) {
      clerkUserId = subscription.object.user_id || subscription.object.userId || subscription.object.customer_id;
    }
    
    console.log("Extracted IDs:", {
      clerkSubscriptionId,
      clerkCustomerId,
      clerkUserId,
      subscriptionKeys: Object.keys(subscription),
      hasObject: !!subscription.object,
      hasData: !!subscription.data,
      hasMetadata: !!subscription.metadata,
    });

    if (!clerkUserId) {
      console.error("❌ Could not extract user ID from subscription:", JSON.stringify(subscription, null, 2));
      throw new Error("User ID not found in subscription data. Check webhook format.");
    }

    // Map Clerk subscription status to Convex status
    // CRITICAL: Match Clerk's status exactly - this is the source of truth
    // "upcoming" status means the subscription is scheduled to start (plan change)
    // "ended" means the subscription has ended but may still be visible in Clerk
    const statusMap: Record<string, "incomplete" | "active" | "trialing" | "past_due" | "canceled" | "incomplete_expired" | "upcoming"> = {
      incomplete: "incomplete",
      incomplete_expired: "incomplete_expired",
      trialing: "trialing",
      active: "active",
      past_due: "past_due",
      canceled: "canceled",
      cancelled: "canceled", // Handle both spellings
      ended: "canceled", // Ended subscriptions are treated as canceled in Convex
      upcoming: "upcoming", // Scheduled plan change - this is the key status for plan changes
    };
    
    // Get status from Clerk - this is the source of truth
    const clerkStatus = subscription.status?.toLowerCase() || "";
    const status = statusMap[clerkStatus] || "incomplete";
    
    console.log(`📋 CLERK STATUS: "${clerkStatus}" → Convex status: "${status}"`);
    
    // CRITICAL: If Clerk says "upcoming", this is a scheduled plan change
    // Do NOT activate immediately - it will activate when the current plan expires
    if (status === "upcoming") {
      console.log(`⚠️ CLERK INDICATES UPCOMING STATUS - This is a scheduled plan change, NOT immediate activation`);
    }
    
    console.log("Subscription status:", subscription.status, "→", status);
    
    // Get current_period_end (convert from ISO string or timestamp)
    // Define this early so it's available in error handling
    let currentPeriodEnd: number = Date.now() + 30 * 24 * 60 * 60 * 1000; // Default to 30 days
    if (subscription.current_period_end) {
      if (typeof subscription.current_period_end === "string") {
        currentPeriodEnd = new Date(subscription.current_period_end).getTime();
      } else {
        currentPeriodEnd = subscription.current_period_end * 1000; // Convert seconds to ms
      }
    } else if (subscription.currentPeriodEnd) {
      if (typeof subscription.currentPeriodEnd === "string") {
        currentPeriodEnd = new Date(subscription.currentPeriodEnd).getTime();
      } else {
        currentPeriodEnd = subscription.currentPeriodEnd * 1000;
      }
    }

    // Determine plan from subscription
    // Clerk uses specific plan keys: basic_user, business_plan, featured_plan
    let plan: "basic" | "business" | "featured" = "basic";
    
    console.log("=== PLAN DETECTION ===");
    console.log("Subscription object keys:", Object.keys(subscription));
    console.log("Subscription plan field:", subscription.plan);
    console.log("Subscription name:", subscription.name);
    console.log("Subscription metadata:", subscription.metadata);
    
    // Check subscription plan field first - Clerk uses plan.key or plan.name
    if (subscription.plan) {
      const planKey = subscription.plan.key || subscription.plan.id || "";
      const planName = (subscription.plan.name || subscription.plan || "").toLowerCase();
      console.log("Plan key from subscription.plan:", planKey);
      console.log("Plan name from subscription.plan:", planName);
      
      // Check for Clerk plan keys
      if (planKey === "featured_plan" || planKey === "featured") {
        plan = "featured";
        console.log("✅ Detected Featured plan from plan.key");
      } else if (planKey === "business_plan" || planKey === "business") {
        plan = "business";
        console.log("✅ Detected Business plan from plan.key");
      } else if (planKey === "basic_user" || planKey === "basic") {
        plan = "basic";
        console.log("✅ Detected Basic plan from plan.key");
      } else if (planName.includes("featured")) {
        plan = "featured";
        console.log("✅ Detected Featured plan from plan.name");
      } else if (planName.includes("business")) {
        plan = "business";
        console.log("✅ Detected Business plan from plan.name");
      }
    }
    
    // Check subscription items/products for plan keys
    const items = subscription.items?.data || 
                  subscription.items || 
                  subscription.line_items?.data ||
                  subscription.lineItems ||
                  subscription.data?.items ||
                  [];

    console.log("Subscription items array length:", items.length);
    console.log("Subscription items:", JSON.stringify(items, null, 2));

    for (const item of items) {
      const priceId = item.price?.id || item.priceId || item.price_id || "";
      const productName = (item.price?.product?.name || item.product?.name || item.product_name || "").toLowerCase();
      const productId = item.price?.product?.id || item.product?.id || item.product_id || "";
      const productKey = item.price?.product?.key || item.product?.key || "";
      const itemName = (item.name || "").toLowerCase();
      
      console.log("Processing item:", { 
        priceId, 
        productName, 
        productId,
        productKey,
        itemName,
        fullItem: JSON.stringify(item, null, 2)
      });
      
      // Check for Clerk plan keys first
      if (
        productKey === "featured_plan" ||
        priceId.includes("featured_plan") ||
        productId.includes("featured_plan") ||
        productName.includes("featured") || 
        productId.includes("featured") || 
        priceId.includes("featured") ||
        itemName.includes("featured")
      ) {
        plan = "featured";
        console.log("✅ Detected Featured plan from item");
        break; // Featured is highest, no need to check further
      } else if (
        productKey === "business_plan" ||
        priceId.includes("business_plan") ||
        productId.includes("business_plan") ||
        productName.includes("business") || 
        productId.includes("business") || 
        priceId.includes("business") ||
        itemName.includes("business")
      ) {
        if (plan !== "featured") {
          plan = "business";
          console.log("✅ Detected Business plan from item");
        }
      }
    }

    // Check metadata for plan keys
    if (plan === "basic" && subscription.metadata) {
      const metadataPlan = subscription.metadata.plan || subscription.metadata.plan_key || subscription.metadata.plan_name || "";
      console.log("Checking metadata for plan:", metadataPlan);
      
      if (metadataPlan === "featured_plan" || metadataPlan === "featured") {
        plan = "featured";
        console.log("✅ Detected Featured plan from metadata");
      } else if (metadataPlan === "business_plan" || metadataPlan === "business") {
        plan = "business";
        console.log("✅ Detected Business plan from metadata");
      }
    }

    // If still basic, try to infer from subscription name or description
    if (plan === "basic") {
      const subscriptionName = (subscription.name || subscription.plan_name || subscription.description || "").toLowerCase();
      const allText = subscriptionName.toLowerCase();
      
      console.log("Checking subscription name/description:", { subscriptionName, allText });
      
      if (allText.includes("featured") || allText.includes("featured_plan")) {
        plan = "featured";
        console.log("✅ Inferred Featured plan from name/description");
      } else if (allText.includes("business") || allText.includes("business_plan")) {
        plan = "business";
        console.log("✅ Inferred Business plan from name/description");
      } else {
        console.warn("⚠️ Could not detect plan - defaulting to basic. Full subscription:", JSON.stringify(subscription, null, 2));
      }
    }

    console.log("=== FINAL PLAN DETERMINATION: ", plan, " ===");

    // Subscriptions are now user-based, not club-based
    // No need to get club_id from metadata

    // Try to sync subscription - if user doesn't exist, create them from subscription data
    // CRITICAL: Pass the exact status from Clerk - this ensures Convex matches Clerk exactly
    try {
      console.log(`🔄 SYNCING FROM CLERK WEBHOOK:`);
      console.log(`   Plan: ${plan}`);
      console.log(`   Status: ${status} (from Clerk: ${clerkStatus})`);
      console.log(`   Period End: ${new Date(currentPeriodEnd).toISOString()}`);
      console.log(`   Subscription ID: ${clerkSubscriptionId}`);
      
      await convex.mutation(api.subscription_sync.syncSubscriptionFromWebhook, {
        clerkUserId: clerkUserId as string,
        clerkSubscriptionId,
        clerkCustomerId: clerkCustomerId as string,
        plan,
        status, // Use the exact status from Clerk - this is the source of truth
        currentPeriodEnd: currentPeriodEnd || undefined,
      });

      console.log("✅ Subscription synced successfully to Convex - status matches Clerk exactly");
    } catch (error: any) {
      // If user not found, try to create user from subscription metadata
      if (error.message?.includes("User not found")) {
        console.warn("⚠️ User not found, attempting to create user from subscription data");
        
        // Try to get user email from subscription or customer data
        const userEmail = subscription.customer_email || 
                         subscription.customer?.email || 
                         subscription.metadata?.email ||
                         "";
        const userName = subscription.customer_name ||
                        subscription.customer?.name ||
                        subscription.metadata?.name ||
                        "User";

        if (userEmail) {
          try {
            // Create user in Convex
            await convex.mutation(api.users.getOrCreateUserFromClerk, {
              clerkUserId: clerkUserId as string,
              email: userEmail,
              name: userName,
              role: "club_owner",
            });
            
            console.log("✅ User created in Convex, retrying subscription sync");
            
            // Retry subscription sync
            await convex.mutation(api.subscription_sync.syncSubscriptionFromWebhook, {
              clerkUserId: clerkUserId as string,
              clerkSubscriptionId,
              clerkCustomerId: clerkCustomerId as string,
              plan,
              status,
              currentPeriodEnd: currentPeriodEnd || undefined,
            });
            
            console.log("✅ Subscription synced successfully after creating user");
          } catch (createError: any) {
            console.error("❌ Failed to create user:", createError);
            throw error; // Re-throw original error
          }
        } else {
          console.error("❌ Cannot create user: email not found in subscription data");
          throw error;
        }
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error("❌ Error handling subscription update:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

async function handleSubscriptionCancel(subscription: any) {
  try {
    console.log("Handling subscription cancel:", subscription.id);

    const clerkSubscriptionId = subscription.id;
    const clerkUserId = subscription.customer_id || subscription.user_id || subscription.userId;

    // Call Convex mutation to cancel subscription
    await convex.mutation(api.subscriptions.cancelSubscriptionFromWebhook, {
      clerkUserId,
      clerkSubscriptionId,
    });

    console.log("Subscription canceled successfully");
  } catch (error: any) {
    console.error("Error handling subscription cancel:", error);
    throw error;
  }
}

async function handlePaymentFailure(paymentData: any) {
  try {
    console.log("=== PAYMENT FAILURE EVENT ===");
    console.log("Payment failure data:", JSON.stringify(paymentData, null, 2));
    
    // Extract user ID from payment data
    const clerkUserId = paymentData.customer || paymentData.customer_id || paymentData.user_id;
    
    if (clerkUserId) {
      console.log("Payment failed for user:", clerkUserId);
      // You could update subscription status to "past_due" here if needed
      // For now, we just log it for debugging
    }
    
    // Log the failure reason if available
    if (paymentData.failure_reason || paymentData.last_payment_error) {
      console.error("Payment failure reason:", paymentData.failure_reason || paymentData.last_payment_error);
    }
  } catch (error: any) {
    console.error("Error handling payment failure:", error);
    // Don't throw - payment failures shouldn't break webhook processing
  }
}
