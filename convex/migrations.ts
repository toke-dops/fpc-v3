import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Migration: Mark all existing Clerk subscriptions as canceled
 * This migration handles the transition to user-based subscriptions
 */
export const markClerkSubscriptionsAsCanceled = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find all subscriptions that have clerk_subscription_id
    // We need to collect all and filter in memory since Convex doesn't support checking for undefined
    const allSubscriptions = await ctx.db
      .query("subscriptions")
      .collect();

    const clerkSubscriptions = allSubscriptions.filter(
      (sub) => sub.clerk_subscription_id
    );

    let updated = 0;
    const errors: string[] = [];

    for (const sub of clerkSubscriptions) {
      try {
        // Mark as canceled and set updated_at
        const updates: any = {
          status: "canceled" as const,
          updated_at: Date.now(),
        };
        
        // Set cancel_at_period_end if not set
        if (sub.cancel_at_period_end === undefined) {
          updates.cancel_at_period_end = false;
        }
        
        await ctx.db.patch(sub._id, updates);

        // Update club to basic plan if it was featured (only if club_id exists)
        if (sub.club_id) {
          const club = await ctx.db.get(sub.club_id);
          // Type guard: check if club exists and has plan property (is a club, not another type)
          if (club && "plan" in club && (club.plan === "featured" || club.plan === "business")) {
            await ctx.db.patch(sub.club_id as any, {
              plan: "basic",
              is_featured: false,
            });
          }
        }

        updated++;
      } catch (error: any) {
        errors.push(`Failed to update subscription ${sub._id}: ${error.message}`);
      }
    }

    return {
      success: true,
      updated,
      errors,
      message: `Marked ${updated} Clerk subscriptions as canceled`,
    };
  },
});
