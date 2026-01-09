import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all active subscriptions for the current user (user-based)
 */
export const getMySubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty array instead of throwing for better error handling
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      return []; // Return empty array if user not found (not synced yet)
    }

    // Get all subscriptions for this user
    const allSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .collect();
    
    // Filter for active, trialing, past_due, upcoming, or recently canceled subscriptions
    // Include "upcoming" status so we can show scheduled plan changes
    // Include recently canceled (within last 30 days) to show ended subscriptions like Clerk does
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const subscriptions = allSubscriptions.filter(
      (sub) => {
        if (["active", "trialing", "past_due", "upcoming"].includes(sub.status)) {
          return true;
        }
        // Include recently canceled subscriptions (ended in Clerk) if they're within last 30 days
        if (sub.status === "canceled" && sub.updated_at && sub.updated_at > thirtyDaysAgo) {
          return true;
        }
        return false;
      }
    );

    // Get all clubs owned by this user
    const userClubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), user._id))
      .collect();

    // Return ALL relevant subscriptions (both active and upcoming)
    // This allows the UI to show both the current plan and scheduled plan changes
    if (subscriptions.length > 0) {
      // Sort subscriptions: active first, then by plan priority, then by creation date
      const sortedSubscriptions = subscriptions.sort((a, b) => {
        // Priority: active > upcoming > other statuses
        const statusOrder = { active: 3, trialing: 2, past_due: 2, upcoming: 1 };
        if (statusOrder[a.status as keyof typeof statusOrder] !== statusOrder[b.status as keyof typeof statusOrder]) {
          return (statusOrder[b.status as keyof typeof statusOrder] || 0) - (statusOrder[a.status as keyof typeof statusOrder] || 0);
        }
        // Then by plan priority: Featured > Business > Basic
        const planOrder = { featured: 3, business: 2, basic: 1 };
        if (planOrder[a.plan] !== planOrder[b.plan]) {
          return planOrder[b.plan] - planOrder[a.plan];
        }
        // Finally by creation date (most recent first)
        return b.created_at - a.created_at;
      });

      // Return all subscriptions with club information
      return sortedSubscriptions.map(sub => ({
        ...sub,
        club: null, // No specific club - applies to all
        clubs: userClubs.map(club => ({
          _id: club._id,
          name: club.name || "",
          city: club.city || undefined,
          slug: club.slug,
        })),
        clubCount: userClubs.length,
        scheduled_plan: sub.scheduled_plan,
        scheduled_plan_activation_date: sub.scheduled_plan_activation_date,
        cancel_at_period_end: sub.cancel_at_period_end || false,
      }));
    }

    return [];
  },
});

/**
 * Debug: Get all subscriptions for the current user (active or not)
 */
export const debugMySubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty array instead of throwing for better error handling
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      return []; // Return empty array if user not found (not synced yet)
    }

    // Get all subscriptions for this user (regardless of status)
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .collect();

    return subscriptions;
  },
});

/**
 * Get user's subscription status (highest plan across all clubs)
 * Returns: "basic" | "business" | "featured" | null (if not authenticated)
 */
export const getUserSubscriptionStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null; // Return null instead of throwing for better error handling
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      return null; // Return null if user not found (not synced yet)
    }

    // Get all subscriptions first to check for scheduled changes
    const allSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .collect();
    
    // Filter for active subscriptions
    const activeSubscriptions = allSubscriptions.filter(
      (sub) => ["active", "trialing", "past_due"].includes(sub.status)
    );

    // PRIORITY 1: Check user's plan field FIRST - most direct and reliable
    // This is updated by syncSubscriptionFromWebhook and syncMySubscriptionStatus
    // Current plan applies until period end, even if scheduled to change
    if (user.plan) {
      if (user.plan === "featured") {
        console.log(`[getUserSubscriptionStatus] Found featured plan on user ${user._id}`);
        return "featured";
      }
      if (user.plan === "business") {
        console.log(`[getUserSubscriptionStatus] Found business plan on user ${user._id}`);
        return "business";
      }
    }

    // PRIORITY 2: Check club plans - clubs are updated by webhook when subscription is applied
    const clubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), user._id))
      .collect();

    if (clubs.length === 0) {
      // No clubs = no subscription
      return "basic";
    }

    const clubPlans = clubs.map(club => club.plan);
    const hasBusinessClub = clubPlans.includes("business");
    const hasFeaturedClub = clubPlans.includes("featured");
    
    // If any club has a paid plan, return that plan immediately
    if (hasFeaturedClub) {
      console.log(`[getUserSubscriptionStatus] Found featured club plan for user ${user._id}`);
      return "featured";
    }
    if (hasBusinessClub) {
      console.log(`[getUserSubscriptionStatus] Found business club plan for user ${user._id}`);
      return "business";
    }

    // PRIORITY 3: Check subscription records (already fetched above)
    // Check ALL subscriptions (including incomplete) for plan detection
    const allSubscriptionPlans = allSubscriptions.map(sub => sub.plan);
    const hasBusinessSubscription = allSubscriptionPlans.includes("business");
    const hasFeaturedSubscription = allSubscriptionPlans.includes("featured");

    // Find highest plan from active subscriptions
    let subscriptionPlan: "basic" | "business" | "featured" = "basic";
    if (activeSubscriptions.length > 0) {
      for (const sub of activeSubscriptions) {
        if (sub.plan === "featured") {
          subscriptionPlan = "featured";
          break;
        } else if (sub.plan === "business" && subscriptionPlan === "basic") {
          subscriptionPlan = "business";
        }
      }
    }

    // Debug logging
    console.log("[getUserSubscriptionStatus] Debug:", {
      userId: user._id,
      clubsCount: clubs.length,
      clubPlans,
      subscriptionsCount: allSubscriptions.length,
      allSubscriptionPlans,
      activeSubscriptionsCount: activeSubscriptions.length,
      hasBusinessClub,
      hasBusinessSubscription,
      hasFeaturedClub,
      hasFeaturedSubscription,
      subscriptionPlan,
    });

    // Return the highest plan from subscriptions
    if (hasFeaturedSubscription || subscriptionPlan === "featured") {
      return "featured";
    } else if (hasBusinessSubscription || subscriptionPlan === "business") {
      return "business";
    } else {
      return "basic";
    }
  },
});

/**
 * Sync subscription from webhook (no auth required)
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
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    // Find user by Clerk user ID
    let user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", args.clerkUserId)
      )
      .first();

    if (!user) {
      console.error("❌ User not found for Clerk ID:", args.clerkUserId);
      throw new Error(`User not found in Convex for Clerk ID: ${args.clerkUserId}. User must log in first to sync their account.`);
    }

    // FIRST: Check if subscription exists by clerk_subscription_id (exact match)
    let existingSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_subscription_id", (q) =>
        q.eq("clerk_subscription_id", args.clerkSubscriptionId)
      )
      .first();

    // SECOND: Get all user subscriptions to check for active/upcoming relationships
    const userSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .collect();
    
    // CRITICAL: Find subscription by PLAN + STATUS combination
    // This ensures we update the correct subscription when Clerk sends multiple subscriptions
    // Example: Featured (active) and Business (upcoming) should both exist in Convex
    if (!existingSubscription) {
      // Try to find by plan and status combination (exact match)
      existingSubscription = userSubscriptions.find(sub => 
        sub.plan === args.plan && sub.status === args.status
      ) || null;
      
      // If not found by plan+status, try to find by plan only (might be updating status)
      if (!existingSubscription) {
        existingSubscription = userSubscriptions.find(sub => 
          sub.plan === args.plan
        ) || null;
      }
    }
    
    // Find active subscription (for scheduling plan changes)
    // This is the subscription that should have scheduled_plan set
    let activeSubscriptionForScheduling: any = userSubscriptions.find(sub => 
      sub.status === "active" && sub.plan !== args.plan
    );
    
    // If the incoming subscription is active and different from existing active, use existing active for scheduling
    if (args.status === "active" && existingSubscription && existingSubscription.status !== "active") {
      // We're activating a subscription, check if there's another active one
      const otherActive = userSubscriptions.find(sub => 
        sub.status === "active" && sub._id !== existingSubscription._id
      );
      if (otherActive) {
        activeSubscriptionForScheduling = otherActive;
      }
    }
    
    // CRITICAL: Log what we found for debugging
    console.log(`🔍 SUBSCRIPTION MATCHING:`);
    console.log(`   Looking for: Plan=${args.plan}, Status=${args.status}, ID=${args.clerkSubscriptionId}`);
    console.log(`   Found by ID: ${existingSubscription ? `${existingSubscription.plan} (${existingSubscription.status})` : 'none'}`);
    console.log(`   Active subscription for scheduling: ${activeSubscriptionForScheduling ? `${activeSubscriptionForScheduling.plan} (${activeSubscriptionForScheduling.status})` : 'none'}`);
    console.log(`   All user subscriptions: ${userSubscriptions.map(s => `${s.plan}(${s.status})`).join(', ')}`);
    
    // THIRD: If existing subscription found by ID is not active, find the active one for scheduling
    if (!activeSubscriptionForScheduling && existingSubscription && existingSubscription.status !== "active") {
      const userSubscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
        .collect();
      
      const activeSubscriptions = userSubscriptions.filter(sub => 
        sub.status === "active" && sub._id !== existingSubscription._id
      );
      
      if (activeSubscriptions.length > 0) {
        activeSubscriptions.sort((a, b) => b.created_at - a.created_at);
        activeSubscriptionForScheduling = activeSubscriptions[0];
        console.log(`Found separate active subscription for scheduling: ${activeSubscriptionForScheduling._id} (${activeSubscriptionForScheduling.plan})`);
      }
    }

    // CRITICAL: Check for Basic plan downgrades - only schedule if user has ACTIVE business/featured subscription
    // New users (no active subscriptions) should get Basic plan immediately
    if (args.plan === "basic" && activeSubscriptionForScheduling && 
        activeSubscriptionForScheduling.status === "active" && 
        (activeSubscriptionForScheduling.plan === "business" || activeSubscriptionForScheduling.plan === "featured")) {
      // Basic plan downgrade - ALWAYS schedule, never immediate
      const activationDate = activeSubscriptionForScheduling.current_period_end;
      
      const periodEndStr = activeSubscriptionForScheduling.current_period_end ? new Date(activeSubscriptionForScheduling.current_period_end).toISOString() : "unknown";
      const activationDateStr = activationDate ? new Date(activationDate).toISOString() : "unknown";
      console.log(`📅 BASIC PLAN DOWNGRADE (EARLY CHECK): User ${user._id} has active ${activeSubscriptionForScheduling.plan} plan, scheduling Basic plan`);
      console.log(`   Current plan: ${activeSubscriptionForScheduling.plan} (stays active until ${periodEndStr})`);
      console.log(`   Scheduled plan: basic (will activate on ${activationDateStr})`);
      
      // Update scheduled fields on the active subscription
      await ctx.db.patch(activeSubscriptionForScheduling._id, {
        scheduled_plan: "basic",
        scheduled_plan_activation_date: activationDate,
        cancel_at_period_end: false,
        updated_at: Date.now(),
        // Keep existing plan and status unchanged
      });
      
      // Create upcoming Basic subscription
      const newSubscriptionId = await ctx.db.insert("subscriptions", {
        owner_user_id: user._id,
        club_id: undefined,
        clerk_customer_id: args.clerkCustomerId,
        clerk_subscription_id: args.clerkSubscriptionId,
        plan: "basic",
        status: "upcoming",
        current_period_end: activationDate,
        scheduled_plan: "basic",
        scheduled_plan_activation_date: activationDate,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      
      console.log(`✅ Scheduled Basic plan downgrade - will activate on ${new Date(activationDate).toISOString()}`);
      console.log(`✅ Created upcoming subscription ${newSubscriptionId} for Basic plan`);
      
      // Return early - do NOT update clubs/users immediately
      return {
        success: true,
        scheduled: true,
        current_plan: activeSubscriptionForScheduling.plan,
        scheduled_plan: "basic",
        activation_date: activationDate,
      };
    }

    // Determine effective plan
    const effectivePlan = args.plan;

    // All plan changes should be scheduled when user has an active subscription
    // Use the existing subscription's expiry date for all scheduled changes
    let finalPeriodEnd = args.currentPeriodEnd;
    if (activeSubscriptionForScheduling && activeSubscriptionForScheduling.status === "active") {
      // Use the active subscription's expiry date for scheduled changes
      finalPeriodEnd = activeSubscriptionForScheduling.current_period_end;
    }

    // CRITICAL: Check for Basic plan downgrades - only schedule if user has ACTIVE business/featured subscription
    // New users (no active subscriptions) should get Basic plan immediately
    if (args.plan === "basic" && activeSubscriptionForScheduling && 
        activeSubscriptionForScheduling.status === "active" && 
        (activeSubscriptionForScheduling.plan === "business" || activeSubscriptionForScheduling.plan === "featured")) {
      // Basic plan downgrade - ALWAYS schedule, never immediate
      const activationDate = activeSubscriptionForScheduling.current_period_end;
      
      const periodEndStr2 = activeSubscriptionForScheduling.current_period_end ? new Date(activeSubscriptionForScheduling.current_period_end).toISOString() : "unknown";
      const activationDateStr2 = activationDate ? new Date(activationDate).toISOString() : "unknown";
      console.log(`📅 BASIC PLAN DOWNGRADE: User ${user._id} has active ${activeSubscriptionForScheduling.plan} plan, scheduling Basic plan`);
      console.log(`   Current plan: ${activeSubscriptionForScheduling.plan} (stays active until ${periodEndStr2})`);
      console.log(`   Scheduled plan: basic (will activate on ${activationDateStr2})`);
      
      // Update scheduled fields on the active subscription
      await ctx.db.patch(activeSubscriptionForScheduling._id, {
        scheduled_plan: "basic",
        scheduled_plan_activation_date: activationDate,
        cancel_at_period_end: false,
        updated_at: Date.now(),
        // Keep existing plan and status unchanged
      });
      
      // Create upcoming Basic subscription
      const newSubscriptionId = await ctx.db.insert("subscriptions", {
        owner_user_id: user._id,
        club_id: undefined,
        clerk_customer_id: args.clerkCustomerId,
        clerk_subscription_id: args.clerkSubscriptionId,
        plan: "basic",
        status: "upcoming",
        current_period_end: activationDate,
        scheduled_plan: "basic",
        scheduled_plan_activation_date: activationDate,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      
      console.log(`✅ Scheduled Basic plan downgrade - will activate on ${new Date(activationDate).toISOString()}`);
      console.log(`✅ Created upcoming subscription ${newSubscriptionId} for Basic plan`);
      
      // Return early - do NOT update clubs/users immediately
      return {
        success: true,
        scheduled: true,
        current_plan: activeSubscriptionForScheduling.plan,
        scheduled_plan: "basic",
        activation_date: activationDate,
      };
    }
    
    // CRITICAL: If Clerk says status is "upcoming", this is a scheduled plan change
    // ALWAYS respect Clerk's status - it's the source of truth
    if (args.status === "upcoming") {
      console.log(`📋 CLERK STATUS IS "UPCOMING" - This is a scheduled plan change from Clerk`);
      console.log(`   Plan: ${args.plan}`);
      console.log(`   Status: ${args.status} (from Clerk)`);
      
      // Find the active subscription to schedule the change on
      if (activeSubscriptionForScheduling && activeSubscriptionForScheduling.status === "active") {
        const activationDate = activeSubscriptionForScheduling.current_period_end;
        
        // Update scheduled fields on the active subscription
        await ctx.db.patch(activeSubscriptionForScheduling._id, {
          scheduled_plan: args.plan,
          scheduled_plan_activation_date: activationDate,
          cancel_at_period_end: false,
          updated_at: Date.now(),
        });
        
        // Create upcoming subscription record
        const newSubscriptionId = await ctx.db.insert("subscriptions", {
          owner_user_id: user._id,
          club_id: undefined,
          clerk_customer_id: args.clerkCustomerId,
          clerk_subscription_id: args.clerkSubscriptionId,
          plan: args.plan,
          status: "upcoming",
          current_period_end: activationDate,
          scheduled_plan: args.plan,
          scheduled_plan_activation_date: activationDate,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        
        console.log(`✅ Scheduled ${args.plan} plan change - will activate on ${new Date(activationDate).toISOString()}`);
        console.log(`   ⚠️ NOT updating clubs/users - they stay on current plan until activation`);
        
        return {
          success: true,
          scheduled: true,
          current_plan: activeSubscriptionForScheduling.plan,
          scheduled_plan: args.plan,
          activation_date: activationDate,
        };
      }
    }
    
    // UNIFIED PLAN CHANGE LOGIC: 
    // - If new plan matches CURRENT active plan → update immediately (user going back to original plan)
    // - If new plan is different from CURRENT active plan → schedule it (plan change)
    if (activeSubscriptionForScheduling && 
        activeSubscriptionForScheduling.status === "active") {
      
      // SPECIAL CASE: User is going back to the current active plan
      // Example: Featured (active) → Basic (scheduled) → Featured (back to active)
      // In this case, update immediately and clear scheduled fields
      if (activeSubscriptionForScheduling.plan === args.plan) {
        console.log(`🔄 RETURNING TO CURRENT ACTIVE PLAN: User is going back to ${args.plan} plan (current active plan)`);
        console.log(`   This updates the current plan immediately and clears scheduled changes`);
        
        // Update the active subscription immediately
        await ctx.db.patch(activeSubscriptionForScheduling._id, {
          clerk_customer_id: args.clerkCustomerId,
          clerk_subscription_id: args.clerkSubscriptionId,
          status: args.status,
          current_period_end: finalPeriodEnd,
          scheduled_plan: undefined, // Clear scheduled plan - we're back to original
          scheduled_plan_activation_date: undefined,
          cancel_at_period_end: false,
          updated_at: Date.now(),
        });
        
        // Delete any upcoming subscriptions for this plan (they're no longer needed)
        const upcomingSubscriptions = await ctx.db
          .query("subscriptions")
          .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
          .filter((q) => q.eq(q.field("status"), "upcoming"))
          .filter((q) => q.eq(q.field("plan"), args.plan))
          .collect();
        
        for (const upcoming of upcomingSubscriptions) {
          await ctx.db.delete(upcoming._id);
          console.log(`Deleted upcoming ${args.plan} subscription ${upcoming._id} - no longer needed`);
        }
        
        // Update clubs and user immediately since we're updating the current active plan
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
        
        await ctx.db.patch(user._id, {
          plan: args.plan,
        });
        
        console.log(`✅ Updated current active ${args.plan} plan immediately - cleared scheduled changes`);
        console.log(`✅ Updated ${userClubs.length} club(s) and user to ${args.plan} plan`);
        
        return {
          success: true,
          immediate: true,
          plan: args.plan,
          message: `Updated current active ${args.plan} plan - cleared scheduled changes`,
        };
      }
      
      // PLAN CHANGE: New plan is different from current active plan - MUST schedule it
      // This is a scheduled plan change - update scheduled fields on the active subscription
      // Use the existing subscription's expiry date for ALL scheduled changes
      const activationDate = activeSubscriptionForScheduling.current_period_end;
      
      const planChangeType = 
        (activeSubscriptionForScheduling.plan === "featured" && args.plan === "business") ? "Downgrade" :
        (activeSubscriptionForScheduling.plan === "featured" && args.plan === "basic") ? "Downgrade" :
        (activeSubscriptionForScheduling.plan === "business" && args.plan === "basic") ? "Downgrade" :
        (activeSubscriptionForScheduling.plan === "basic" && args.plan === "business") ? "Upgrade" :
        (activeSubscriptionForScheduling.plan === "basic" && args.plan === "featured") ? "Upgrade" :
        (activeSubscriptionForScheduling.plan === "business" && args.plan === "featured") ? "Upgrade" :
        "Change";
      
      const periodEndStr3 = activeSubscriptionForScheduling.current_period_end ? new Date(activeSubscriptionForScheduling.current_period_end).toISOString() : "unknown";
      const activationDateStr3 = activationDate ? new Date(activationDate).toISOString() : "unknown";
      console.log(`📅 SCHEDULED PLAN ${planChangeType.toUpperCase()}: User ${user._id} has active ${activeSubscriptionForScheduling.plan} plan, scheduling ${args.plan} plan`);
      console.log(`   Current plan: ${activeSubscriptionForScheduling.plan} (stays active until ${periodEndStr3})`);
      console.log(`   Scheduled plan: ${args.plan} (will activate on ${activationDateStr3})`);
      console.log(`   Status: ${args.status}`);
      console.log(`   ⚠️ CLUBS AND USERS WILL NOT BE UPDATED - they stay on current plan`);
      
      // CRITICAL: Update scheduled fields on the active subscription
      // DO NOT change the plan or status - keep them as they are
      await ctx.db.patch(activeSubscriptionForScheduling._id, {
        scheduled_plan: args.plan,
        scheduled_plan_activation_date: activationDate,
        cancel_at_period_end: false,
        updated_at: Date.now(),
        // Keep existing plan and status unchanged
      });
      
      // Delete any existing upcoming subscriptions for this plan (replace with new one)
      const existingUpcoming = await ctx.db
        .query("subscriptions")
        .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
        .filter((q) => q.eq(q.field("status"), "upcoming"))
        .filter((q) => q.eq(q.field("plan"), args.plan))
        .collect();
      
      for (const upcoming of existingUpcoming) {
        await ctx.db.delete(upcoming._id);
        console.log(`Deleted existing upcoming ${args.plan} subscription ${upcoming._id}`);
      }
      
      // ALWAYS create an upcoming subscription record for the new plan
      const newSubscriptionId = await ctx.db.insert("subscriptions", {
        owner_user_id: user._id,
        club_id: undefined,
        clerk_customer_id: args.clerkCustomerId,
        clerk_subscription_id: args.clerkSubscriptionId,
        plan: args.plan,
        status: "upcoming",
        current_period_end: activationDate,
        scheduled_plan: args.plan,
        scheduled_plan_activation_date: activationDate,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      
      console.log(`✅ Updated scheduled fields on active subscription ${activeSubscriptionForScheduling._id}:`);
      console.log(`   - scheduled_plan: ${args.plan}`);
      console.log(`   - scheduled_plan_activation_date: ${new Date(activationDate).toISOString()}`);
      console.log(`   - updated_at: ${new Date(Date.now()).toISOString()}`);
      console.log(`✅ Created upcoming subscription ${newSubscriptionId} for plan ${args.plan} (activates ${new Date(activationDate).toISOString()})`);
      
      // Return early - do NOT update clubs/users immediately
      return {
        success: true,
        scheduled: true,
        current_plan: activeSubscriptionForScheduling.plan,
        scheduled_plan: args.plan,
        activation_date: activationDate,
      };
    }
    
    // SIMPLIFIED: Just match Clerk exactly - update the subscription with the exact plan and status from Clerk
    if (existingSubscription) {
      console.log(`📝 UPDATING EXISTING SUBSCRIPTION: ${existingSubscription.plan} (${existingSubscription.status}) → ${args.plan} (${args.status})`);
      
      // If this is the same plan and status, just update the fields
      if (existingSubscription.plan === args.plan && existingSubscription.status === args.status) {
        await ctx.db.patch(existingSubscription._id, {
          clerk_customer_id: args.clerkCustomerId,
          clerk_subscription_id: args.clerkSubscriptionId,
          current_period_end: finalPeriodEnd,
          updated_at: Date.now(),
        });
        console.log(`✅ Updated subscription ${existingSubscription._id} with new period end`);
        
        // If active, update clubs/users
        if (args.status === "active") {
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
      
      // If status is "upcoming", this is a scheduled change
      // Update the existing subscription and set scheduled fields on active subscription
      if (args.status === "upcoming") {
        // Find active subscription to set scheduled_plan
        if (activeSubscriptionForScheduling) {
          await ctx.db.patch(activeSubscriptionForScheduling._id, {
            scheduled_plan: args.plan,
            scheduled_plan_activation_date: activeSubscriptionForScheduling.current_period_end,
            updated_at: Date.now(),
          });
        }
        
        // Update or create the upcoming subscription
        // Convert "upcoming" to "active" for storage (we track scheduled changes via scheduled_plan)
        const statusToStore = args.status === "upcoming" ? "active" : args.status;
        
        await ctx.db.patch(existingSubscription._id, {
          clerk_customer_id: args.clerkCustomerId,
          clerk_subscription_id: args.clerkSubscriptionId,
          plan: args.plan,
          status: statusToStore,
          current_period_end: finalPeriodEnd,
          updated_at: Date.now(),
        });
        
        console.log(`✅ Updated subscription ${existingSubscription._id} to ${args.plan} (${args.status})`);
        return { success: true, scheduled: true };
      }
      
      // If status is "active", update the subscription and clubs/users
      if (args.status === "active") {
        await ctx.db.patch(existingSubscription._id, {
          clerk_customer_id: args.clerkCustomerId,
          clerk_subscription_id: args.clerkSubscriptionId,
          plan: args.plan,
          status: args.status,
          current_period_end: finalPeriodEnd,
          scheduled_plan: undefined,
          scheduled_plan_activation_date: undefined,
          cancel_at_period_end: false,
          updated_at: Date.now(),
        });
        
        // Update clubs and user
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
        
        console.log(`✅ Updated subscription ${existingSubscription._id} to ${args.plan} (${args.status}) and updated clubs/users`);
        return { success: true };
      }
      
      // For other statuses, just update the subscription
      await ctx.db.patch(existingSubscription._id, {
        clerk_customer_id: args.clerkCustomerId,
        clerk_subscription_id: args.clerkSubscriptionId,
        plan: args.plan,
        status: args.status,
        current_period_end: finalPeriodEnd,
        updated_at: Date.now(),
      });
      
      console.log(`✅ Updated subscription ${existingSubscription._id} to ${args.plan} (${args.status})`);
      return { success: true };
    } else {
      // Create new subscription - match Clerk exactly
      console.log(`➕ CREATING NEW SUBSCRIPTION: ${args.plan} (${args.status})`);
      
      // CRITICAL: If Basic plan and there are active subscriptions (shouldn't happen, but safety check)
      // Check if user has any active subscriptions that we might have missed
      const allUserSubscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
        .collect();
      
      const anyActiveSubscriptions = allUserSubscriptions.filter(sub => 
        ["active", "trialing", "past_due"].includes(sub.status)
      );
      
      // If Basic plan and user has active business/featured subscriptions, this should be scheduled, not immediate
      // New users (no active business/featured subscription) get Basic plan immediately
      const activeBusinessOrFeatured = anyActiveSubscriptions.filter(sub => 
        sub.plan === "business" || sub.plan === "featured"
      );
      
      if (args.plan === "basic" && activeBusinessOrFeatured.length > 0) {
        const activeSub = activeBusinessOrFeatured[0];
        const activationDate = activeSub.current_period_end;
        
        // Update scheduled fields on active subscription
        await ctx.db.patch(activeSub._id, {
          scheduled_plan: "basic",
          scheduled_plan_activation_date: activationDate,
          cancel_at_period_end: false,
          updated_at: Date.now(),
        });
        
        // Create upcoming Basic subscription
        const newSubscriptionId = await ctx.db.insert("subscriptions", {
          owner_user_id: user._id,
          club_id: undefined,
          clerk_customer_id: args.clerkCustomerId,
          clerk_subscription_id: args.clerkSubscriptionId,
          plan: "basic",
          status: "upcoming",
          current_period_end: activationDate,
          scheduled_plan: "basic",
          scheduled_plan_activation_date: activationDate,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        
        const activationDateStr4 = activationDate ? new Date(activationDate).toISOString() : "unknown";
        console.log(`✅ Scheduled Basic plan downgrade (found active subscription) - will activate on ${activationDateStr4}`);
        
        // Return early - do NOT update clubs/users immediately
        return {
          success: true,
          scheduled: true,
          current_plan: activeSub.plan,
          scheduled_plan: "basic",
          activation_date: activationDate,
        };
      }
      
      // Create new subscription (user-based, no club_id required)
      // IMPORTANT: Create subscription even if status is "incomplete" - it will be updated when payment completes
      console.log(`Creating new subscription for user ${user._id}`);
      console.log(`  Plan: ${args.plan}, Status: ${args.status}, Clerk Subscription ID: ${args.clerkSubscriptionId}`);
      
      const newSubscriptionData: any = {
        owner_user_id: user._id,
        club_id: undefined, // User-based subscription, not tied to a specific club
        clerk_customer_id: args.clerkCustomerId,
        clerk_subscription_id: args.clerkSubscriptionId,
        plan: args.plan,
        status: args.status,
        current_period_end: args.currentPeriodEnd,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      
      // If status is "upcoming", set scheduled fields
      if (args.status === "upcoming") {
        newSubscriptionData.scheduled_plan = args.plan;
        newSubscriptionData.scheduled_plan_activation_date = args.currentPeriodEnd;
      }
      
      const newSubscriptionId = await ctx.db.insert("subscriptions", newSubscriptionData);
      console.log(`✅ Created new subscription ${newSubscriptionId} for user ${user._id} with plan ${args.plan}, status ${args.status}`);
    }

    // FINAL SAFETY CHECK: Check for ANY active subscriptions with different plan
    // This catches cases where earlier checks might have missed active subscriptions
    // ALL plan changes MUST be scheduled when user has active subscription - NEVER immediate
    const allUserSubscriptionsForCheck = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .collect();
    
    const activeSubscriptionsForCheck = allUserSubscriptionsForCheck.filter(sub => 
      ["active", "trialing", "past_due"].includes(sub.status) && 
      sub.plan !== args.plan
    );
    
    if (activeSubscriptionsForCheck.length > 0) {
      // User has active subscription with different plan - new plan MUST be scheduled
      const activeSub = activeSubscriptionsForCheck.sort((a, b) => b.created_at - a.created_at)[0];
      const activationDate = activeSub.current_period_end;
      
      console.log(`🚨 FINAL SAFETY CHECK: User has active ${activeSub.plan} subscription - ${args.plan} plan MUST be scheduled, NOT immediate`);
      
      // Update scheduled fields on active subscription if not already set
      if (!activeSub.scheduled_plan || activeSub.scheduled_plan !== args.plan) {
        await ctx.db.patch(activeSub._id, {
          scheduled_plan: args.plan,
          scheduled_plan_activation_date: activationDate,
          cancel_at_period_end: false,
          updated_at: Date.now(),
        });
        console.log(`✅ Updated scheduled_plan on active subscription ${activeSub._id}`);
      }
      
      // Create upcoming subscription if it doesn't exist
      const existingUpcoming = allUserSubscriptionsForCheck.find(sub => 
        sub.status === "upcoming" && sub.plan === args.plan
      );
      
      if (!existingUpcoming) {
        await ctx.db.insert("subscriptions", {
          owner_user_id: user._id,
          club_id: undefined,
          clerk_customer_id: args.clerkCustomerId,
          clerk_subscription_id: args.clerkSubscriptionId,
          plan: args.plan,
          status: "upcoming",
          current_period_end: activationDate,
          scheduled_plan: args.plan,
          scheduled_plan_activation_date: activationDate,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        console.log(`✅ Created upcoming subscription for ${args.plan} plan`);
      }
      
      const activationDateStr5 = activationDate ? new Date(activationDate).toISOString() : "unknown";
      console.log(`⚠️ FINAL SAFETY CHECK: Plan change detected - skipping immediate club/user updates. Plan will activate at scheduled date.`);
      console.log(`   Active subscription: ${activeSub.plan} (expires ${activationDateStr5})`);
      console.log(`   Scheduled plan: ${args.plan} (activates ${activationDateStr5})`);
      console.log(`   ⚠️ CLUBS AND USERS WILL NOT BE UPDATED UNTIL PLAN ACTIVATES`);
      
      return {
        success: true,
        scheduled: true,
        current_plan: activeSub.plan,
        scheduled_plan: args.plan,
        activation_date: activationDate,
      };
    }
    
    // Apply plan to ALL clubs owned by this user
    // ALWAYS update clubs and user plan field to match subscription plan (regardless of status, except canceled)
    // This ensures all tables stay in sync
    const userClubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), user._id))
      .collect();
    
    // Check if user was just verified (within last 5 minutes)
    // If so, and this is a synthetic/test subscription, don't override basic plan
    const recentlyVerified = user.club_verified_at && 
                              (Date.now() - user.club_verified_at < 5 * 60 * 1000); // 5 minutes
    const isSyntheticSubscription = args.clerkSubscriptionId.startsWith("basic_sub_") ||
                                     args.clerkSubscriptionId.startsWith("sync_") ||
                                     args.clerkSubscriptionId.startsWith("manual_");
    
    // For recently verified users with synthetic subscriptions, only apply if it's basic
    // This prevents webhooks from incorrectly assigning business/featured plans to new users
    if (recentlyVerified && isSyntheticSubscription && effectivePlan !== "basic") {
      console.log(`⚠️ Skipping plan update for recently verified user ${user._id} - synthetic subscription with ${effectivePlan} plan detected, keeping basic`);
      return { success: true, skipped: true, reason: "recently_verified_synthetic" };
    }
    
    // CRITICAL: Only update clubs and user plan if this is a NEW user with NO existing subscriptions
    // OR if this is updating the SAME plan (not a plan change)
    // ALL plan changes MUST be scheduled - NEVER update clubs/users immediately for plan changes
    
    // Check if user has ANY active subscription with a DIFFERENT plan
    const hasActiveDifferentPlan = allUserSubscriptionsForCheck.some(sub => 
      ["active", "trialing", "past_due"].includes(sub.status) && 
      sub.plan !== args.plan
    );
    
    // Check if user has an active subscription with the SAME plan
    const hasActiveSamePlan = allUserSubscriptionsForCheck.some(sub => 
      ["active", "trialing", "past_due"].includes(sub.status) && 
      sub.plan === args.plan
    );
    
    // Only update clubs/users if:
    // 1. Status is "active" (not "upcoming", not "canceled")
    // 2. User has NO active subscription with different plan (not a plan change)
    // 3. This is either:
    //    - A new user (no subscriptions at all), OR
    //    - Updating the same plan (same plan as active subscription)
    const isNewUser = allUserSubscriptionsForCheck.length === 0;
    const isUpdatingSamePlan = hasActiveSamePlan && !hasActiveDifferentPlan;
    const shouldUpdateClubsAndUser = 
      args.status === "active" && 
      !hasActiveDifferentPlan &&
      (isNewUser || isUpdatingSamePlan);
    
    if (shouldUpdateClubsAndUser) {
      // This is a new user or updating the same plan - update clubs/users immediately
      console.log(`✅ Updating clubs/users for ${isNewUser ? 'new user' : 'same plan update'}`);
      console.log(`Found ${userClubs.length} club(s) for user ${user._id}, applying ${effectivePlan} plan (status: ${args.status})`);
      
      for (const club of userClubs) {
        await ctx.db.patch(club._id, {
          plan: effectivePlan,
          is_featured: effectivePlan === "featured",
        });
        console.log(`Updated club ${club._id} (${club.name}) to ${effectivePlan} plan`);
      }
      
      console.log(`✅ Applied ${effectivePlan} plan to ${userClubs.length} club(s) for user ${user._id}`);
      
      // Update user's plan field to match subscription plan
      await ctx.db.patch(user._id, {
        plan: effectivePlan,
      });
      console.log(`✅ Updated user ${user._id} plan to ${effectivePlan} (status: ${args.status})`);
    } else if (args.status === "canceled") {
      // If canceled and no active subscription, revert to basic
      if (!hasActiveDifferentPlan && !hasActiveSamePlan) {
        for (const club of userClubs) {
          await ctx.db.patch(club._id, {
            plan: "basic",
            is_featured: false,
          });
        }
        
        await ctx.db.patch(user._id, {
          plan: "basic",
        });
        
        console.log(`Reverted ${userClubs.length} club(s) and user ${user._id} to basic plan`);
      } else {
        console.log(`⚠️ Subscription canceled but user has active subscription - keeping current plan until expiry`);
      }
    } else {
      // Plan change detected - do NOT update clubs/users
      console.log(`🚨 PLAN CHANGE DETECTED: ${args.plan} plan with status ${args.status}`);
      console.log(`   ⚠️ NOT updating clubs/users immediately - they will update when plan activates`);
      console.log(`   ⚠️ Current plan stays active until scheduled activation date`);
      if (hasActiveDifferentPlan) {
        console.log(`   ⚠️ User has active subscription with different plan - this is a scheduled change`);
      }
    }

    return { success: true };
  },
});

/**
 * Cancel subscription from webhook (no auth required)
 */
export const cancelSubscriptionFromWebhook = mutation({
  args: {
    clerkUserId: v.string(),
    clerkSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by Clerk user ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", args.clerkUserId)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_subscription_id", (q) =>
        q.eq("clerk_subscription_id", args.clerkSubscriptionId)
      )
      .first();

    if (!subscription) {
      console.warn("Subscription not found:", args.clerkSubscriptionId);
      return { success: false, message: "Subscription not found" };
    }

    // Mark subscription as canceled
    await ctx.db.patch(subscription._id, {
      status: "canceled",
    });

    // Revert all clubs owned by this user to basic plan
    const userClubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), user._id))
      .collect();
    
    for (const club of userClubs) {
      await ctx.db.patch(club._id, {
        plan: "basic",
        is_featured: false,
      });
      console.log(`Reverted club ${club._id} (${club.name}) to basic plan`);
    }

    // Update user's plan to basic
    await ctx.db.patch(user._id, {
      plan: "basic",
    });
    console.log(`✅ Reverted user ${user._id} plan to basic`);

    return { success: true };
  },
});

/**
 * Cancel subscription (user-based)
 */
export const cancelSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find active subscription for this user
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "trialing"),
          q.eq(q.field("status"), "past_due")
        )
      )
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    // Schedule cancellation at period end instead of immediate cancellation
    // User keeps access until current_period_end
    await ctx.db.patch(subscription._id, {
      cancel_at_period_end: true,
      scheduled_plan: "basic", // Will revert to basic at period end
      scheduled_plan_activation_date: subscription.current_period_end,
      updated_at: Date.now(),
    });

    const cancelDate = subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : "unknown";
    console.log(`✅ Scheduled subscription ${subscription._id} for cancellation at period end (${cancelDate})`);

    return { 
      success: true,
      message: "Subscription will be canceled at the end of the billing period",
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: true,
    };
  },
});

/**
 * Downgrade subscription (schedules plan change at period end)
 */
export const downgradeSubscription = mutation({
  args: {
    newPlan: v.union(v.literal("basic"), v.literal("business")), // Can only downgrade to business or basic
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find active subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "trialing"),
          q.eq(q.field("status"), "past_due")
        )
      )
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    // Validate downgrade (can't downgrade to same or higher plan)
    const planOrder = { basic: 1, business: 2, featured: 3 };
    if (planOrder[args.newPlan] >= planOrder[subscription.plan]) {
      throw new Error(`Cannot downgrade from ${subscription.plan} to ${args.newPlan}`);
    }

    // If subscription is cancelled, allow scheduling a new plan instead of reverting to basic
    // Schedule downgrade at period end (or new plan if cancelled)
    await ctx.db.patch(subscription._id, {
      scheduled_plan: args.newPlan,
      scheduled_plan_activation_date: subscription.current_period_end,
      cancel_at_period_end: false, // Clear cancellation - user wants a different plan instead
      updated_at: Date.now(),
    });

    const downgradeDate = subscription.current_period_end ? new Date(subscription.current_period_end).toISOString() : "unknown";
    console.log(`✅ Scheduled downgrade from ${subscription.plan} to ${args.newPlan} at period end (${downgradeDate})`);

    return {
      success: true,
      message: `Subscription will be downgraded to ${args.newPlan} at the end of the billing period`,
      current_plan: subscription.plan,
      scheduled_plan: args.newPlan,
      activation_date: subscription.current_period_end,
      current_period_end: subscription.current_period_end,
    };
  },
});

/**
 * Upgrade subscription (immediate activation)
 */
export const upgradeSubscription = mutation({
  args: {
    newPlan: v.union(v.literal("business"), v.literal("featured")), // Can only upgrade to business or featured
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find active subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "trialing"),
          q.eq(q.field("status"), "past_due")
        )
      )
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    // Validate upgrade (can't upgrade to same or lower plan)
    const planOrder = { basic: 1, business: 2, featured: 3 };
    if (planOrder[args.newPlan] <= planOrder[subscription.plan]) {
      throw new Error(`Cannot upgrade from ${subscription.plan} to ${args.newPlan}`);
    }

    // If subscription is cancelled, schedule upgrade at period end instead of immediate
    // This allows user to change from cancelled -> new plan at period end
    if (subscription.cancel_at_period_end) {
      // Schedule upgrade at period end (replaces the cancellation)
      await ctx.db.patch(subscription._id, {
        scheduled_plan: args.newPlan,
        scheduled_plan_activation_date: subscription.current_period_end,
        cancel_at_period_end: false, // Clear cancellation - user wants new plan instead
        updated_at: Date.now(),
      });

      console.log(`✅ Scheduled upgrade from ${subscription.plan} to ${args.newPlan} at period end (replacing cancellation)`);

      return {
        success: true,
        message: `Subscription will be upgraded to ${args.newPlan} at the end of the billing period`,
        previous_plan: subscription.plan,
        scheduled_plan: args.newPlan,
        activation_date: subscription.current_period_end,
        current_period_end: subscription.current_period_end,
      };
    }

    // Upgrade immediately - update subscription, clubs, and user
    await ctx.db.patch(subscription._id, {
      plan: args.newPlan,
      scheduled_plan: undefined, // Clear any scheduled changes
      scheduled_plan_activation_date: undefined,
      cancel_at_period_end: false, // Clear cancellation if upgrading
      updated_at: Date.now(),
    });

    // Update all clubs immediately
    const userClubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), user._id))
      .collect();

    for (const club of userClubs) {
      await ctx.db.patch(club._id, {
        plan: args.newPlan,
        is_featured: args.newPlan === "featured",
      });
      console.log(`Upgraded club ${club._id} (${club.name}) to ${args.newPlan} plan`);
    }

    // Update user's plan field
    await ctx.db.patch(user._id, {
      plan: args.newPlan,
    });

    console.log(`✅ Upgraded subscription from ${subscription.plan} to ${args.newPlan} immediately`);

    return {
      success: true,
      message: `Subscription upgraded to ${args.newPlan} immediately`,
      previous_plan: subscription.plan,
      new_plan: args.newPlan,
      clubs_updated: userClubs.length,
    };
  },
});

/**
 * Get subscription by club (legacy - for backward compatibility)
 */
export const getSubscriptionByClub = query({
  args: {
    clubId: v.id("clubs"),
  },
  handler: async (ctx, args) => {
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

    // Get user's subscription (user-based, not club-based)
    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "trialing"),
          q.eq(q.field("status"), "past_due")
        )
      )
      .collect();

    return subscriptions.length > 0 ? subscriptions[0] : null;
  },
});

/**
 * Sync subscription status for the current user
 * This ensures the user's subscription status is properly stored in Convex
 * Should be called when user logs in or visits subscription page
 * Also syncs all clubs' plans to match the owner's subscription
 */
export const syncMySubscriptionStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all subscriptions for this user
    const allSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .collect();

    // Get all clubs owned by this user
    const userClubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), user._id))
      .collect();

    // Find the highest plan from active subscriptions
    let highestPlan: "basic" | "business" | "featured" = "basic";
    const activeSubscriptions = allSubscriptions.filter(
      (sub) => ["active", "trialing", "past_due"].includes(sub.status)
    );

    if (activeSubscriptions.length > 0) {
      for (const sub of activeSubscriptions) {
        if (sub.plan === "featured") {
          highestPlan = "featured";
          break;
        } else if (sub.plan === "business" && highestPlan === "basic") {
          highestPlan = "business";
        }
      }
    }

    // Also check all subscriptions (including incomplete)
    if (highestPlan === "basic") {
      for (const sub of allSubscriptions) {
        if (sub.plan === "featured") {
          highestPlan = "featured";
          break;
        } else if (sub.plan === "business" && highestPlan === "basic") {
          highestPlan = "business";
        }
      }
    }

    // Determine effective plan from subscriptions ONLY (not from clubs)
    // Clubs should get their plan from subscriptions, not the other way around
    // This prevents incorrectly assigning paid plans to users who haven't paid
    let effectivePlan: "basic" | "business" | "featured" = highestPlan;

    // NEVER create subscriptions based on club plans - subscriptions should only come from actual payments
    // If clubs have paid plans but no subscription, it means the clubs were incorrectly set
    // In that case, we should revert clubs to basic, not create a fake subscription
    
    // Check if clubs have incorrect plans (paid plans without a matching subscription)
    const clubPlans = userClubs.map(club => club.plan);
    const hasBusinessClub = clubPlans.includes("business");
    const hasFeaturedClub = clubPlans.includes("featured");
    
    // If clubs have paid plans but user only has basic subscription (or no subscription), revert clubs to basic
    if ((hasBusinessClub || hasFeaturedClub) && highestPlan === "basic") {
      console.log(`⚠️ [syncMySubscriptionStatus] User has paid plan clubs (${hasFeaturedClub ? 'featured' : 'business'}) but only basic subscription. Reverting clubs to basic.`);
      
      // Revert all clubs to basic
      let clubsReverted = 0;
      for (const club of userClubs) {
        if (club.plan !== "basic") {
          await ctx.db.patch(club._id, {
            plan: "basic",
            is_featured: false,
          });
          clubsReverted++;
        }
      }
      
      if (clubsReverted > 0) {
        console.log(`✅ Reverted ${clubsReverted} club(s) to basic plan for user ${user._id}`);
      }
    }

    // Update all clubs to match the subscription plan (not the other way around)
    let clubsUpdated = 0;
    for (const club of userClubs) {
      if (club.plan !== effectivePlan) {
        await ctx.db.patch(club._id, {
          plan: effectivePlan,
          is_featured: effectivePlan === "featured",
        });
        clubsUpdated++;
      }
    }

    // Update user's plan field to match subscription plan
    // This ensures the plan is linked directly to the user
    if (user.plan !== effectivePlan) {
      await ctx.db.patch(user._id, {
        plan: effectivePlan,
      });
      console.log(`✅ Updated user ${user._id} plan field to ${effectivePlan}`);
    }

    return {
      success: true,
      plan: effectivePlan,
      clubsUpdated,
      totalClubs: userClubs.length,
      subscriptionsCount: allSubscriptions.length,
      activeSubscriptionsCount: activeSubscriptions.length,
      userPlanUpdated: user.plan !== effectivePlan,
      message: `Subscription status synced. Plan: ${effectivePlan}`,
    };
  },
});

/**
 * Force update user's clubs to match their subscription plan
 * This can be used if webhook didn't update clubs correctly
 */
export const forceUpdateClubPlans = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all subscriptions for this user
    const allSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .collect();

    // Find the highest plan from active subscriptions
    let highestPlan: "basic" | "business" | "featured" = "basic";
    const activeSubscriptions = allSubscriptions.filter(
      (sub) => ["active", "trialing", "past_due"].includes(sub.status)
    );

    if (activeSubscriptions.length > 0) {
      for (const sub of activeSubscriptions) {
        if (sub.plan === "featured") {
          highestPlan = "featured";
          break;
        } else if (sub.plan === "business" && highestPlan === "basic") {
          highestPlan = "business";
        }
      }
    }

    // Also check all subscriptions (including incomplete)
    if (highestPlan === "basic") {
      for (const sub of allSubscriptions) {
        if (sub.plan === "featured") {
          highestPlan = "featured";
          break;
        } else if (sub.plan === "business" && highestPlan === "basic") {
          highestPlan = "business";
        }
      }
    }

    // Get all clubs owned by this user
    const userClubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), user._id))
      .collect();

    // Update all clubs to match the subscription plan
    let updated = 0;
    for (const club of userClubs) {
      if (club.plan !== highestPlan) {
        await ctx.db.patch(club._id, {
          plan: highestPlan,
          is_featured: highestPlan === "featured",
        });
        updated++;
      }
    }

    // Update user's plan field to match subscription plan
    let userPlanUpdated = false;
    if (user.plan !== highestPlan) {
      await ctx.db.patch(user._id, {
        plan: highestPlan,
      });
      userPlanUpdated = true;
      console.log(`✅ Updated user ${user._id} plan field to ${highestPlan}`);
    }

    return {
      success: true,
      plan: highestPlan,
      clubsUpdated: updated,
      totalClubs: userClubs.length,
      userPlanUpdated,
    };
  },
});

/**
 * Fix existing subscriptions - updates user and clubs based on existing subscription records
 * This is useful when subscriptions exist but user/clubs weren't updated
 */
export const fixExistingSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all subscriptions for this user
    const allSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .collect();

    if (allSubscriptions.length === 0) {
      return {
        success: true,
        message: "No subscriptions found",
        plan: user.plan || "basic",
        clubsUpdated: 0,
        userPlanUpdated: false,
      };
    }

    // Find the highest plan from all subscriptions (including incomplete)
    let highestPlan: "basic" | "business" | "featured" = "basic";
    for (const sub of allSubscriptions) {
      if (sub.plan === "featured") {
        highestPlan = "featured";
        break;
      } else if (sub.plan === "business" && highestPlan === "basic") {
        highestPlan = "business";
      }
    }

    // Prioritize real Clerk subscriptions over synthetic ones
    const realSubscriptions = allSubscriptions.filter(
      sub => !sub.clerk_subscription_id?.startsWith("basic_sub_") &&
             !sub.clerk_subscription_id?.startsWith("sync_") &&
             !sub.clerk_subscription_id?.startsWith("manual_")
    );
    
    // If we have real subscriptions, use those to determine plan
    if (realSubscriptions.length > 0) {
      highestPlan = "basic";
      for (const sub of realSubscriptions) {
        if (sub.plan === "featured") {
          highestPlan = "featured";
          break;
        } else if (sub.plan === "business" && highestPlan === "basic") {
          highestPlan = "business";
        }
      }
    }

    console.log(`[fixExistingSubscriptions] Found ${allSubscriptions.length} subscription(s) (${realSubscriptions.length} real), highest plan: ${highestPlan}`);

    // Get all clubs owned by this user
    const userClubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), user._id))
      .collect();

    // Update all clubs to match the subscription plan
    let clubsUpdated = 0;
    for (const club of userClubs) {
      if (club.plan !== highestPlan) {
        await ctx.db.patch(club._id, {
          plan: highestPlan,
          is_featured: highestPlan === "featured",
        });
        clubsUpdated++;
        console.log(`Updated club ${club._id} (${club.name}) to ${highestPlan} plan`);
      }
    }

    // Update user's plan field to match subscription plan
    let userPlanUpdated = false;
    if (user.plan !== highestPlan) {
      await ctx.db.patch(user._id, {
        plan: highestPlan,
      });
      userPlanUpdated = true;
      console.log(`✅ Updated user ${user._id} plan field to ${highestPlan}`);
    }

    return {
      success: true,
      plan: highestPlan,
      clubsUpdated,
      userPlanUpdated,
      subscriptionsCount: allSubscriptions.length,
      message: `Fixed subscriptions: ${clubsUpdated} clubs updated, user plan ${userPlanUpdated ? "updated" : "unchanged"}`,
    };
  },
});

/**
 * Update subscription plan directly - for manual fixes
 * This updates an existing subscription's plan and applies it to user and clubs
 */
export const updateSubscriptionPlan = mutation({
  args: {
    subscriptionId: v.optional(v.id("subscriptions")),
    plan: v.union(v.literal("business"), v.literal("featured")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Find subscription to update
    let subscription;
    if (args.subscriptionId) {
      subscription = await ctx.db.get(args.subscriptionId);
      if (!subscription || subscription.owner_user_id !== user._id) {
        throw new Error("Subscription not found or access denied");
      }
    } else {
      // Get user's subscriptions
      const userSubscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
        .collect();
      
      if (userSubscriptions.length === 0) {
        throw new Error("No subscriptions found");
      }
      
      // Prefer real Clerk subscriptions over synthetic ones
      const realSub = userSubscriptions.find(
        sub => !sub.clerk_subscription_id?.startsWith("basic_sub_") &&
               !sub.clerk_subscription_id?.startsWith("sync_") &&
               !sub.clerk_subscription_id?.startsWith("manual_")
      );
      subscription = realSub || userSubscriptions[0];
    }

    console.log(`[updateSubscriptionPlan] Updating subscription ${subscription._id} from ${subscription.plan} to ${args.plan}`);

    // Update subscription plan
    await ctx.db.patch(subscription._id, {
      plan: args.plan,
      updated_at: Date.now(),
    });

    // Get all clubs owned by this user
    const userClubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), user._id))
      .collect();

    // Update all clubs to match the new plan
    let clubsUpdated = 0;
    for (const club of userClubs) {
      if (club.plan !== args.plan) {
        await ctx.db.patch(club._id, {
          plan: args.plan,
          is_featured: args.plan === "featured",
        });
        clubsUpdated++;
        console.log(`Updated club ${club._id} (${club.name}) to ${args.plan} plan`);
      }
    }

    // Update user's plan field
    let userPlanUpdated = false;
    if (user.plan !== args.plan) {
      await ctx.db.patch(user._id, {
        plan: args.plan,
      });
      userPlanUpdated = true;
      console.log(`✅ Updated user ${user._id} plan field to ${args.plan}`);
    }

    return {
      success: true,
      plan: args.plan,
      clubsUpdated,
      userPlanUpdated,
      subscriptionId: subscription._id,
      message: `Updated subscription to ${args.plan} plan`,
    };
  },
});

/**
 * Process scheduled subscription changes (runs at period end)
 * This should be called by a scheduled job or cron
 */
export const processScheduledSubscriptionChanges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find all subscriptions that have scheduled changes at or before now
    const allSubscriptions = await ctx.db
      .query("subscriptions")
      .collect();
    
    const subscriptionsToProcess = allSubscriptions.filter(
      (sub) => 
        sub.status === "active" &&
        sub.current_period_end !== undefined &&
        sub.current_period_end <= now &&
        (sub.scheduled_plan !== undefined || sub.cancel_at_period_end === true)
    );

    console.log(`[processScheduledSubscriptionChanges] Found ${subscriptionsToProcess.length} subscription(s) to process`);

    let processed = 0;
    for (const subscription of subscriptionsToProcess) {
      try {
        const user = await ctx.db.get(subscription.owner_user_id);
        if (!user) {
          console.warn(`User ${subscription.owner_user_id} not found for subscription ${subscription._id}`);
          continue;
        }

        const userClubs = await ctx.db
          .query("clubs")
          .filter((q) => q.eq(q.field("owner_user_id"), user._id))
          .collect();

        if (subscription.cancel_at_period_end && !subscription.scheduled_plan) {
          // Cancel subscription - revert to basic (only if no scheduled plan)
          await ctx.db.patch(subscription._id, {
            status: "canceled",
            plan: "basic",
            cancel_at_period_end: false,
            scheduled_plan: undefined,
            scheduled_plan_activation_date: undefined,
            updated_at: now,
          });

          // Revert clubs and user to basic
          for (const club of userClubs) {
            await ctx.db.patch(club._id, {
              plan: "basic",
              is_featured: false,
            });
          }

          await ctx.db.patch(user._id, {
            plan: "basic",
          });

          console.log(`✅ Processed cancellation for subscription ${subscription._id}`);
        } else if (subscription.scheduled_plan) {
          // If there's a scheduled plan, use that instead of reverting to basic
          // This handles the case where user cancelled but then scheduled a new plan
          // Apply scheduled plan change
          await ctx.db.patch(subscription._id, {
            plan: subscription.scheduled_plan,
            status: subscription.scheduled_plan === "basic" ? "canceled" : "active", // Only mark as canceled if going to basic
            scheduled_plan: undefined,
            scheduled_plan_activation_date: undefined,
            cancel_at_period_end: false, // Clear cancellation flag
            updated_at: now,
          });

          // Update clubs and user
          for (const club of userClubs) {
            await ctx.db.patch(club._id, {
              plan: subscription.scheduled_plan,
              is_featured: subscription.scheduled_plan === "featured",
            });
          }

          await ctx.db.patch(user._id, {
            plan: subscription.scheduled_plan,
          });

          console.log(`✅ Processed scheduled plan change for subscription ${subscription._id}: ${subscription.plan} → ${subscription.scheduled_plan}`);
        }

        processed++;
      } catch (error: any) {
        console.error(`Error processing subscription ${subscription._id}:`, error);
      }
    }

    return {
      success: true,
      processed,
      total: subscriptionsToProcess.length,
    };
  },
});

/**
 * Clean up duplicate subscriptions for the current user
 * Keeps only the most recent active subscription and marks others as canceled
 */
export const cleanupDuplicateSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all subscriptions for this user
    const allSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .collect();

    if (allSubscriptions.length <= 1) {
      return {
        success: true,
        message: "No duplicates found",
        kept: allSubscriptions.length,
        canceled: 0,
      };
    }

    // Find active subscriptions
    const activeSubscriptions = allSubscriptions.filter(sub => 
      ["active", "trialing", "past_due"].includes(sub.status)
    );

    if (activeSubscriptions.length <= 1) {
      // No active duplicates, but mark old canceled ones as such
      const canceledCount = allSubscriptions.filter(sub => 
        sub.status !== "canceled" && sub.status !== "incomplete_expired"
      ).length;
      
      for (const sub of allSubscriptions) {
        if (sub.status !== "canceled" && sub.status !== "incomplete_expired" && sub.status !== "active" && sub.status !== "trialing" && sub.status !== "past_due") {
          await ctx.db.patch(sub._id, {
            status: "canceled",
            updated_at: Date.now(),
          });
        }
      }
      
      return {
        success: true,
        message: "No active duplicates found",
        kept: activeSubscriptions.length,
        canceled: canceledCount,
      };
    }

    // Sort by creation date (most recent first)
    activeSubscriptions.sort((a, b) => b.created_at - a.created_at);
    
    // Keep the most recent one
    const keepSubscription = activeSubscriptions[0];
    const toCancel = activeSubscriptions.slice(1);

    // Cancel duplicates
    for (const sub of toCancel) {
      await ctx.db.patch(sub._id, {
        status: "canceled",
        updated_at: Date.now(),
      });
      console.log(`Canceled duplicate subscription ${sub._id} (plan: ${sub.plan}, created: ${new Date(sub.created_at).toISOString()})`);
    }

    // Also cancel any non-active subscriptions that aren't already canceled
    const otherSubscriptions = allSubscriptions.filter(sub => 
      !activeSubscriptions.includes(sub) && 
      sub.status !== "canceled" && 
      sub.status !== "incomplete_expired"
    );
    
    for (const sub of otherSubscriptions) {
      await ctx.db.patch(sub._id, {
        status: "canceled",
        updated_at: Date.now(),
      });
    }

    return {
      success: true,
      message: `Kept subscription ${keepSubscription._id}, canceled ${toCancel.length + otherSubscriptions.length} duplicate(s)`,
      kept: keepSubscription._id,
      canceled: toCancel.length + otherSubscriptions.length,
      keptPlan: keepSubscription.plan,
      keptStatus: keepSubscription.status,
    };
  },
});

/**
 * Delete duplicate subscriptions for the current user
 * Actually deletes (not just marks as canceled) all subscriptions except the most recent active one
 */
export const deleteDuplicateSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get all subscriptions for this user
    const allSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
      .collect();

    if (allSubscriptions.length <= 1) {
      return {
        success: true,
        message: "No duplicates to delete",
        kept: allSubscriptions.length,
        deleted: 0,
      };
    }

    // Find active subscriptions
    const activeSubscriptions = allSubscriptions.filter(sub => 
      ["active", "trialing", "past_due"].includes(sub.status)
    );

    // Sort by creation date (most recent first)
    allSubscriptions.sort((a, b) => b.created_at - a.created_at);
    
    // Keep the most recent active subscription, or if none, the most recent one
    const keepSubscription = activeSubscriptions.length > 0 
      ? activeSubscriptions.sort((a, b) => b.created_at - a.created_at)[0]
      : allSubscriptions[0];
    
    const toDelete = allSubscriptions.filter(sub => sub._id !== keepSubscription._id);

    // Delete duplicates
    let deleted = 0;
    for (const sub of toDelete) {
      try {
        await ctx.db.delete(sub._id);
        deleted++;
        console.log(`Deleted duplicate subscription ${sub._id} (plan: ${sub.plan}, created: ${new Date(sub.created_at).toISOString()})`);
      } catch (error: any) {
        console.error(`Error deleting subscription ${sub._id}:`, error);
      }
    }

    return {
      success: true,
      message: `Kept subscription ${keepSubscription._id}, deleted ${deleted} duplicate(s)`,
      kept: keepSubscription._id,
      deleted,
      keptPlan: keepSubscription.plan,
      keptStatus: keepSubscription.status,
    };
  },
});
