import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Plan priority for determining upgrades vs downgrades
 */
const PLAN_PRIORITY: Record<"basic" | "business" | "featured", number> = {
  basic: 1,
  business: 2,
  featured: 3,
};

/**
 * Determine if a plan change is an upgrade or downgrade
 */
export function isUpgrade(
  currentPlan: "basic" | "business" | "featured",
  newPlan: "basic" | "business" | "featured"
): boolean {
  return PLAN_PRIORITY[newPlan] > PLAN_PRIORITY[currentPlan];
}

/**
 * Get the current effective plan for a user
 * Returns the plan field from the active subscription, or "basic" if none
 */
export const getCurrentPlanForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return subscription?.plan || "basic";
  },
});

/**
 * Get subscription display state for dashboard
 * Returns all information needed to display subscription status
 */
export const getSubscriptionDisplayState = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!subscription) {
      return {
        plan: "basic" as const,
        status: "active" as const, // Default to active for basic plan
        scheduled_plan: null,
        current_period_end: null,
        scheduled_at_period_end: null,
      };
    }

    return {
      plan: subscription.plan,
      status: subscription.status,
      scheduled_plan: subscription.scheduled_plan || null,
      current_period_end: subscription.current_period_end || null,
      scheduled_at_period_end: subscription.scheduled_at_period_end || subscription.scheduled_plan_activation_date || null,
    };
  },
});


