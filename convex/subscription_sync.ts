import { mutation, internalMutation } from "./_generated/server";
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
 * Determine if a plan change is an upgrade
 */
function isUpgrade(
  currentPlan: "basic" | "business" | "featured",
  newPlan: "basic" | "business" | "featured"
): boolean {
  return PLAN_PRIORITY[newPlan] > PLAN_PRIORITY[currentPlan];
}

/**
 * Sync subscription from Clerk webhook
 * Handles upgrades (immediate) and downgrades (scheduled)
 */
export const syncSubscriptionFromWebhook = mutation({
  args: {
    clerkUserId: v.string(),
    clerkSubscriptionId: v.string(),
    clerkCustomerId: v.string(),
    plan: v.union(v.literal("basic"), v.literal("business"), v.literal("featured")),
    status: v.union(
      v.literal("incomplete"),
      v.literal("active"),
      v.literal("trialing"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("incomplete_expired"),
      v.literal("upcoming")
    ),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", args.clerkUserId)
      )
      .first();

    if (!user) {
      throw new Error(`User not found for Clerk ID: ${args.clerkUserId}`);
    }

    // Find existing subscription by Clerk subscription ID
    let existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_subscription_id", (q) =>
        q.eq("clerk_subscription_id", args.clerkSubscriptionId)
      )
      .first();

    // Get all user subscriptions to find active one
    const allUserSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .collect();

    // Find active subscription - check for "active" first, then "trialing" as fallback
    let activeSubscription = allUserSubscriptions.find(
      (sub) => sub.status === "active"
    );
    
    // If no "active" subscription, check for "trialing" (still considered active)
    if (!activeSubscription) {
      activeSubscription = allUserSubscriptions.find(
        (sub) => sub.status === "trialing"
      );
    }

    console.log(`🔍 SYNC DEBUG: User ${user._id}, Plan: ${args.plan}, Status: ${args.status}`);
    console.log(`   Total subscriptions: ${allUserSubscriptions.length}`);
    console.log(`   Active subscription found: ${activeSubscription ? `Yes (${activeSubscription.plan}, ID: ${activeSubscription._id})` : "No"}`);
    console.log(`   Existing subscription by ID: ${existingSubscription ? `Yes (${existingSubscription.plan}, ID: ${existingSubscription._id})` : "No"}`);
    if (activeSubscription) {
      console.log(`   Active subscription details: plan=${activeSubscription.plan}, scheduled_plan=${activeSubscription.scheduled_plan || "none"}`);
    }

    // Handle canceled/ended subscriptions
    if (args.status === "canceled" || args.status === "incomplete_expired") {
      if (existingSubscription) {
        // If there's a scheduled plan, activate it now
        if (existingSubscription.scheduled_plan) {
          await ctx.db.patch(existingSubscription._id, {
            plan: existingSubscription.scheduled_plan,
            status: existingSubscription.scheduled_plan === "basic" ? "canceled" : args.status,
            scheduled_plan: undefined,
            scheduled_plan_activation_date: undefined,
            scheduled_at_period_end: undefined,
            current_period_end: args.currentPeriodEnd || undefined,
            updated_at: Date.now(),
          });

          // Update clubs and user if going to basic
          if (existingSubscription.scheduled_plan === "basic") {
            const userClubs = await ctx.db
              .query("clubs")
              .filter((q) => q.eq(q.field("owner_user_id"), user._id))
              .collect();

            for (const club of userClubs) {
              await ctx.db.patch(club._id, {
                plan: "basic",
                is_featured: false,
              });
            }

            await ctx.db.patch(user._id, { plan: "basic" });
          }
        } else {
          // No scheduled plan - just mark as canceled
          await ctx.db.patch(existingSubscription._id, {
            status: args.status,
            updated_at: Date.now(),
          });
        }
      }
      return { success: true };
    }

    // Handle active/upcoming subscriptions
    // CRITICAL: "upcoming" status from Clerk means scheduled plan change - always schedule it
    // Even if status is "active", if there's an active subscription with different plan, check if it's a downgrade
    if (args.status === "active" || args.status === "trialing" || args.status === "upcoming") {
      // Check if this is going back to the original active plan (clearing scheduled plan)
      const isBackToOriginalPlan = activeSubscription && 
        activeSubscription.plan === args.plan && 
        activeSubscription.scheduled_plan !== null &&
        activeSubscription.scheduled_plan !== undefined;

      if (isBackToOriginalPlan && activeSubscription) {
        // CASE: Upgrading back to original plan (e.g., Featured → Basic scheduled → Featured)
        // Clear scheduled plan and update billing
        console.log(`🔄 BACK TO ORIGINAL: ${activeSubscription.plan} (clearing scheduled ${activeSubscription.scheduled_plan})`);
        
        await ctx.db.patch(activeSubscription._id, {
          scheduled_plan: undefined,
          scheduled_at_period_end: undefined,
          scheduled_plan_activation_date: undefined,
          cancel_at_period_end: false,
          current_period_end: args.currentPeriodEnd || activeSubscription.current_period_end || undefined,
          updated_at: Date.now(),
          // Keep plan and status as-is (already on original plan)
        });

        return { success: true, cleared_scheduled: true };
      } else if (activeSubscription && activeSubscription.plan !== args.plan) {
        // Different plan from active - determine if upgrade or downgrade
        const isUpgradeChange = isUpgrade(activeSubscription.plan, args.plan);

        // CRITICAL: If status is "upcoming", always treat as scheduled (even if it looks like an upgrade)
        // This ensures we respect Clerk's indication that this is a scheduled change
        if (args.status === "upcoming") {
          console.log(`⚠️ STATUS IS "UPCOMING" - Forcing scheduled change regardless of plan comparison`);
          console.log(`   📝 Active subscription ID: ${activeSubscription._id}`);
          const periodEnd = activeSubscription.current_period_end || args.currentPeriodEnd || Date.now() + 30 * 24 * 60 * 60 * 1000;
          console.log(`   📝 Setting scheduled_plan=${args.plan} on subscription ${activeSubscription._id}...`);
          
          await ctx.db.patch(activeSubscription._id, {
            scheduled_plan: args.plan,
            scheduled_at_period_end: periodEnd,
            scheduled_plan_activation_date: periodEnd,
            cancel_at_period_end: args.plan === "basic",
            updated_at: Date.now(),
          });

          // Verify the update
          const updatedSub = await ctx.db.get(activeSubscription._id);
          console.log(`   ✅ VERIFICATION: subscription ${activeSubscription._id} now has scheduled_plan=${updatedSub?.scheduled_plan || "null"}`);

          if (existingSubscription && existingSubscription._id !== activeSubscription._id) {
            await ctx.db.patch(existingSubscription._id, {
              status: "canceled" as any,
              updated_at: Date.now(),
            });
          }

          return {
            success: true,
            scheduled: true,
            current_plan: activeSubscription.plan,
            scheduled_plan: args.plan,
            scheduled_at_period_end: periodEnd,
          };
        } else if (isUpgradeChange) {
          // UPGRADE: Immediate activation (e.g., Basic → Business, Business → Featured)
          console.log(`⬆️ UPGRADE: ${activeSubscription.plan} → ${args.plan} (immediate)`);

          // Update or create subscription
          if (existingSubscription) {
            await ctx.db.patch(existingSubscription._id, {
              plan: args.plan,
              status: args.status,
              current_period_end: args.currentPeriodEnd || undefined,
              scheduled_plan: undefined,
              scheduled_plan_activation_date: undefined,
              scheduled_at_period_end: undefined,
              cancel_at_period_end: false,
              updated_at: Date.now(),
            });
          } else {
            await ctx.db.insert("subscriptions", {
              owner_user_id: user._id,
              clerk_customer_id: args.clerkCustomerId,
              clerk_subscription_id: args.clerkSubscriptionId,
              plan: args.plan,
              status: args.status,
              current_period_end: args.currentPeriodEnd || undefined,
              created_at: Date.now(),
              updated_at: Date.now(),
            });
          }

          // Mark old subscription as canceled
          await ctx.db.patch(activeSubscription._id, {
            status: "canceled",
            updated_at: Date.now(),
          });

          // Update clubs and user immediately
          const userClubs = await ctx.db
            .query("clubs")
            .filter((q) => q.eq(q.field("owner_user_id"), user._id))
            .collect();

          for (const club of userClubs) {
            await ctx.db.patch(club._id, {
              plan: args.plan,
              is_featured: args.plan === "featured",
            });
          }

          await ctx.db.patch(user._id, { plan: args.plan });

          return { success: true, immediate: true, plan: args.plan };
        } else {
          // DOWNGRADE or REPLACING SCHEDULED PLAN
          // Check if there's a scheduled plan and if new plan is an upgrade from scheduled
          if (activeSubscription.scheduled_plan && isUpgrade(activeSubscription.scheduled_plan, args.plan)) {
            // CASE: Replacing scheduled plan with a better one (e.g., Featured active + Basic scheduled → Business scheduled)
            console.log(`🔄 REPLACE SCHEDULED: ${activeSubscription.scheduled_plan} → ${args.plan} (scheduled)`);
            
            const periodEnd = activeSubscription.current_period_end || args.currentPeriodEnd || Date.now() + 30 * 24 * 60 * 60 * 1000;
            
            await ctx.db.patch(activeSubscription._id, {
              scheduled_plan: args.plan,
              scheduled_at_period_end: periodEnd,
              scheduled_plan_activation_date: periodEnd,
              cancel_at_period_end: args.plan === "basic",
              updated_at: Date.now(),
            });

            return {
              success: true,
              scheduled: true,
              current_plan: activeSubscription.plan,
              scheduled_plan: args.plan,
              scheduled_at_period_end: periodEnd,
            };
          } else {
            // DOWNGRADE: Schedule for period end (e.g., Featured → Business, Featured → Basic, Business → Basic)
            // CRITICAL: Do NOT create/update a new subscription - only schedule on the active one
            console.log(`⬇️ DOWNGRADE DETECTED: ${activeSubscription.plan} → ${args.plan} (scheduled)`);
            console.log(`   ⚠️ Clerk sent status: ${args.status} - treating as scheduled downgrade`);
            console.log(`   ⚠️ Current plan (${activeSubscription.plan}) stays active until period end`);
            console.log(`   ⚠️ Active subscription ID: ${activeSubscription._id}`);
            
            const periodEnd = activeSubscription.current_period_end || args.currentPeriodEnd || Date.now() + 30 * 24 * 60 * 60 * 1000;
            console.log(`   ⚠️ New plan (${args.plan}) will activate on ${new Date(periodEnd).toISOString()}`);
            console.log(`   📝 UPDATING scheduled_plan on subscription ${activeSubscription._id}...`);

            // CRITICAL: Only update the active subscription's scheduled fields
            // DO NOT create a new subscription or update existingSubscription with new plan
            // DO NOT change the active subscription's plan or status
            await ctx.db.patch(activeSubscription._id, {
              scheduled_plan: args.plan,
              scheduled_at_period_end: periodEnd,
              scheduled_plan_activation_date: periodEnd,
              cancel_at_period_end: args.plan === "basic",
              updated_at: Date.now(),
              // Keep plan and status unchanged - current plan stays active until period end
            });

            console.log(`   ✅ PATCH COMPLETE - scheduled_plan should now be: ${args.plan}`);
            
            // Verify the update
            const updatedSub = await ctx.db.get(activeSubscription._id);
            console.log(`   🔍 VERIFICATION: subscription ${activeSubscription._id} now has scheduled_plan=${updatedSub?.scheduled_plan || "null"}`);

            // If there's an existingSubscription with the new clerk_subscription_id, mark it as canceled
            // This is likely Clerk's "upcoming" subscription that we don't want to activate yet
            if (existingSubscription && existingSubscription._id !== activeSubscription._id) {
              console.log(`   ⚠️ Found separate subscription record for new plan - marking as canceled (will activate when scheduled)`);
              await ctx.db.patch(existingSubscription._id, {
                status: "canceled" as any,
                updated_at: Date.now(),
              });
            }

            // DO NOT update clubs/users - they stay on current plan
            return {
              success: true,
              scheduled: true,
              current_plan: activeSubscription.plan,
              scheduled_plan: args.plan,
              scheduled_at_period_end: periodEnd,
            };
          }
        }
      } else {
        // Same plan as active OR no active subscription - update normally
        // CRITICAL: If status is "upcoming" and there's an active subscription with different plan,
        // we MUST set scheduled_plan on the active subscription
        if (args.status === "upcoming" && activeSubscription && activeSubscription.plan !== args.plan) {
          console.log(`⚠️ UPCOMING STATUS: Setting scheduled_plan=${args.plan} on active subscription ${activeSubscription._id}`);
          const periodEnd = activeSubscription.current_period_end || args.currentPeriodEnd || Date.now() + 30 * 24 * 60 * 60 * 1000;
          
          await ctx.db.patch(activeSubscription._id, {
            scheduled_plan: args.plan,
            scheduled_at_period_end: periodEnd,
            scheduled_plan_activation_date: periodEnd,
            cancel_at_period_end: args.plan === "basic",
            updated_at: Date.now(),
          });
          
          console.log(`   ✅ Set scheduled_plan=${args.plan} on active subscription ${activeSubscription._id}`);
        }
        
        // If status is "upcoming", convert to "active" for storage (we track scheduled changes via scheduled_plan)
        const statusToStore = args.status === "upcoming" ? "active" : args.status;
        
        if (existingSubscription) {
          await ctx.db.patch(existingSubscription._id, {
            plan: args.plan,
            status: statusToStore,
            current_period_end: args.currentPeriodEnd || undefined,
            updated_at: Date.now(),
          });
        } else {
          await ctx.db.insert("subscriptions", {
            owner_user_id: user._id,
            clerk_customer_id: args.clerkCustomerId,
            clerk_subscription_id: args.clerkSubscriptionId,
            plan: args.plan,
            status: statusToStore,
            current_period_end: args.currentPeriodEnd || undefined,
            created_at: Date.now(),
            updated_at: Date.now(),
          });
        }

        // Update clubs and user if this is a new subscription or same plan update
        // BUT NOT if this is an upcoming scheduled change
        if ((!activeSubscription || activeSubscription.plan === args.plan) && args.status !== "upcoming") {
          const userClubs = await ctx.db
            .query("clubs")
            .filter((q) => q.eq(q.field("owner_user_id"), user._id))
            .collect();

          for (const club of userClubs) {
            await ctx.db.patch(club._id, {
              plan: args.plan,
              is_featured: args.plan === "featured",
            });
          }

          await ctx.db.patch(user._id, { plan: args.plan });
        }

        return { success: true };
      }
    }

    // Handle other statuses (incomplete, past_due)
    if (existingSubscription) {
      await ctx.db.patch(existingSubscription._id, {
        status: args.status,
        current_period_end: args.currentPeriodEnd || undefined,
        updated_at: Date.now(),
      });
    } else {
      await ctx.db.insert("subscriptions", {
        owner_user_id: user._id,
        clerk_customer_id: args.clerkCustomerId,
        clerk_subscription_id: args.clerkSubscriptionId,
        plan: args.plan,
        status: args.status,
        current_period_end: args.currentPeriodEnd || undefined,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Process scheduled plan changes when period ends
 * This should be called by a scheduled job or webhook when period ends
 */
export const processScheduledPlanChange = internalMutation({
  args: {
    subscriptionId: v.id("subscriptions"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Check if there's a scheduled plan and it's time to activate it
    if (subscription.scheduled_plan && subscription.scheduled_at_period_end) {
      const now = Date.now();
      if (now >= subscription.scheduled_at_period_end) {
        console.log(`🔄 Activating scheduled plan: ${subscription.plan} → ${subscription.scheduled_plan}`);

        // Activate the scheduled plan
        await ctx.db.patch(args.subscriptionId, {
          plan: subscription.scheduled_plan,
          scheduled_plan: undefined,
          scheduled_at_period_end: undefined,
          scheduled_plan_activation_date: undefined,
          cancel_at_period_end: false,
          status: subscription.scheduled_plan === "basic" ? "canceled" : "active",
          updated_at: now,
        });

        // Update clubs and user
        const user = await ctx.db.get(subscription.owner_user_id);
        if (user) {
          const userClubs = await ctx.db
            .query("clubs")
            .filter((q) => q.eq(q.field("owner_user_id"), user._id))
            .collect();

          for (const club of userClubs) {
            await ctx.db.patch(club._id, {
              plan: subscription.scheduled_plan,
              is_featured: subscription.scheduled_plan === "featured",
            });
          }

          await ctx.db.patch(user._id, {
            plan: subscription.scheduled_plan,
          });
        }

        return { success: true, activated_plan: subscription.scheduled_plan };
      }
    }

    return { success: false, reason: "not_time_yet" };
  },
});

/**
 * Fix missing scheduled_plan for existing subscriptions
 * This can be called to fix records where an "upcoming" subscription exists
 * but the active subscription doesn't have scheduled_plan set
 */
export const fixMissingScheduledPlans = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const allSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", args.userId))
      .collect();

    // Find active subscription
    const activeSubscription = allSubscriptions.find(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    // Find upcoming subscriptions
    const upcomingSubscriptions = allSubscriptions.filter(
      (sub) => sub.status === "upcoming" || (sub.status === "active" && sub.plan !== activeSubscription?.plan)
    );

    if (activeSubscription && upcomingSubscriptions.length > 0) {
      // Get the highest priority upcoming plan
      const upcomingPlan = upcomingSubscriptions
        .map(sub => sub.plan)
        .sort((a, b) => {
          const priority = { featured: 3, business: 2, basic: 1 };
          return priority[b] - priority[a];
        })[0];

      // If active subscription doesn't have scheduled_plan set, set it
      if (!activeSubscription.scheduled_plan && upcomingPlan && upcomingPlan !== activeSubscription.plan) {
        const periodEnd = activeSubscription.current_period_end || Date.now() + 30 * 24 * 60 * 60 * 1000;
        
        await ctx.db.patch(activeSubscription._id, {
          scheduled_plan: upcomingPlan,
          scheduled_at_period_end: periodEnd,
          scheduled_plan_activation_date: periodEnd,
          cancel_at_period_end: upcomingPlan === "basic",
          updated_at: Date.now(),
        });

        console.log(`✅ Fixed missing scheduled_plan: Set ${upcomingPlan} on active subscription ${activeSubscription._id}`);
        return { success: true, fixed: true, scheduled_plan: upcomingPlan };
      }
    }

    return { success: true, fixed: false };
  },
});


