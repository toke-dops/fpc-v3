import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const submitClubListing = mutation({
  args: {
    club_name: v.string(),
    city: v.string(),
    website: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate required fields
    if (!args.club_name || args.club_name.trim().length === 0) {
      throw new Error("Club name is required");
    }
    if (!args.city || args.city.trim().length === 0) {
      throw new Error("City is required");
    }
    if (!args.email || args.email.trim().length === 0) {
      throw new Error("Email is required");
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email address");
    }
    if (!args.message || args.message.trim().length === 0) {
      throw new Error("Message is required");
    }

    // Create submission
    const submissionId = await ctx.db.insert("club_submissions", {
      club_name: args.club_name.trim(),
      city: args.city.trim(),
      website: args.website?.trim() || undefined,
      email: args.email.trim().toLowerCase(),
      phone: args.phone?.trim() || undefined,
      message: args.message.trim(),
      created_at: Date.now(),
      status: "new",
    });

    // If user is authenticated and is a club_owner, mark them as having listed a club
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_auth_provider_user_id", (q) =>
          q.eq("auth_provider_user_id", identity.subject)
        )
        .first();

      if (user && user.role === "club_owner" && !(user.has_listed_club ?? false)) {
        const wasVerified = (user.has_listed_club ?? false) || (user.has_claimed_club ?? false);
        
        await ctx.db.patch(user._id, {
          has_listed_club: true,
          club_verified_at: user.club_verified_at ?? Date.now(),
        });

        // If user is now verified (wasn't before), assign Basic plan
        if (!wasVerified) {
          // Check if user already has a subscription
          const existingSubscriptions = await ctx.db
            .query("subscriptions")
            .withIndex("by_owner", (q) => q.eq("owner_user_id", user._id))
            .collect();

          // If user doesn't have a subscription, create Basic plan subscription
          if (existingSubscriptions.length === 0) {
            await ctx.db.insert("subscriptions", {
              owner_user_id: user._id,
              club_id: undefined,
              clerk_customer_id: `basic_${user._id}`,
              clerk_subscription_id: `basic_sub_${user._id}_${Date.now()}`,
              plan: "basic",
              status: "active",
              current_period_end: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
              created_at: Date.now(),
            });

            // Update user's plan field
            await ctx.db.patch(user._id, {
              plan: "basic",
            });

            console.log(`✅ Assigned Basic plan to user ${user._id} after listing club`);
          }
        }
      }
    }

    return { id: submissionId, success: true };
  },
});

export const submitClubClaim = mutation({
  args: {
    club_id: v.id("clubs"),
    club_name_snapshot: v.string(),
    club_city_snapshot: v.optional(v.string()),
    claimant_name: v.string(),
    claimant_email: v.string(),
    claimant_role: v.union(
      v.literal("owner"),
      v.literal("manager"),
      v.literal("staff"),
      v.literal("other")
    ),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // REQUIRE authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be signed in to claim a club listing");
    }

    // Get authenticated user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User account not found. Please try signing in again.");
    }

    // Validate required fields
    if (!args.claimant_name || args.claimant_name.trim().length === 0) {
      throw new Error("Your name is required");
    }
    if (!args.claimant_email || args.claimant_email.trim().length === 0) {
      throw new Error("Email is required");
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.claimant_email)) {
      throw new Error("Invalid email address");
    }
    if (!args.claimant_role || args.claimant_role.trim().length === 0) {
      throw new Error("Your role is required");
    }
    if (!args.message || args.message.trim().length === 0) {
      throw new Error("Message is required");
    }

    // Verify club exists
    const club = await ctx.db.get(args.club_id);
    if (!club) {
      throw new Error("Club not found");
    }

    // Check if there's already a pending claim from this user for this club
    const existingClaim = await ctx.db
      .query("club_claims")
      .withIndex("by_club", (q) => q.eq("club_id", args.club_id))
      .filter((q) => q.eq(q.field("user_id"), user._id))
      .filter((q) => q.eq(q.field("status"), "new"))
      .first();

    if (existingClaim) {
      throw new Error("You already have a pending claim for this club.");
    }

    const userId = user._id;

    // Create claim with user_id (required now)
    const claimId = await ctx.db.insert("club_claims", {
      club_id: args.club_id,
      user_id: userId, // Required - user is authenticated
      club_name_snapshot: args.club_name_snapshot,
      club_city_snapshot: args.club_city_snapshot || club.city || undefined,
      claimant_name: args.claimant_name.trim(),
      claimant_email: args.claimant_email.trim().toLowerCase(),
      claimant_role: args.claimant_role.trim(),
      message: args.message.trim(),
      created_at: Date.now(),
      status: "new",
    });

    // Mark user as having claimed a club
    if (user.role === "club_owner" && !(user.has_claimed_club ?? false)) {
      const wasVerified = (user.has_listed_club ?? false) || (user.has_claimed_club ?? false);
      
      await ctx.db.patch(userId, {
        has_claimed_club: true,
        club_verified_at: user.club_verified_at ?? Date.now(),
      });

      // If user is now verified (wasn't before), assign Basic plan
      // Note: The club ownership will be assigned when the claim is approved
      if (!wasVerified) {
        // Check if user already has a subscription
        const existingSubscriptions = await ctx.db
          .query("subscriptions")
          .withIndex("by_owner", (q) => q.eq("owner_user_id", userId))
          .collect();

        // If user doesn't have a subscription, create Basic plan subscription
        if (existingSubscriptions.length === 0) {
          await ctx.db.insert("subscriptions", {
            owner_user_id: userId,
            club_id: undefined,
            clerk_customer_id: `basic_${userId}`,
            clerk_subscription_id: `basic_sub_${userId}_${Date.now()}`,
            plan: "basic",
            status: "active",
            current_period_end: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
            created_at: Date.now(),
          });

          // Update user's plan field
          await ctx.db.patch(userId, {
            plan: "basic",
          });

          console.log(`✅ Assigned Basic plan to user ${userId} after claiming club`);
        }
      }
    }

    return { id: claimId, success: true };
  },
});

export const getSubmissions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const submissions = await ctx.db
      .query("club_submissions")
      .withIndex("by_created")
      .collect();

    // Sort by created_at descending and limit
    return submissions
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, args.limit ?? 50);
  },
});

/**
 * Get claims and submissions for the current user
 */
export const getMyClaimsAndSubmissions = query({
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
      return { claims: [], submissions: [] };
    }

    // Get all claims by this user
    const allClaims = await ctx.db
      .query("club_claims")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Get all submissions by this user (match by email)
    const allSubmissions = await ctx.db
      .query("club_submissions")
      .filter((q) => q.eq(q.field("email"), user.email))
      .collect();

    // Sort by created_at descending
    const sortedClaims = allClaims.sort((a, b) => b.created_at - a.created_at);
    const sortedSubmissions = allSubmissions.sort((a, b) => b.created_at - a.created_at);

    // Fetch club details for claims
    const claimsWithDetails = await Promise.all(
      sortedClaims.map(async (claim) => {
        const club = await ctx.db.get(claim.club_id);
        return {
          ...claim,
          club: club ? { name: club.name, city: club.city, slug: club.slug, _id: club._id } : null,
        };
      })
    );

    return {
      claims: claimsWithDetails,
      submissions: sortedSubmissions,
    };
  },
});

export const getClaims = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.union(v.literal("new"), v.literal("approved"), v.literal("rejected"))),
  },
  handler: async (ctx, args) => {
    let claims;

    if (args.status) {
      // Query by status index
      const query = ctx.db
        .query("club_claims")
        .withIndex("by_status", (q) => q.eq("status", args.status!));
      claims = await query.collect();
    } else {
      // Query by created index, ordered descending
      const query = ctx.db
        .query("club_claims")
        .withIndex("by_created");
      claims = await query.collect();
    }

    // Sort by created_at descending and limit
    claims = claims
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, args.limit ?? 50);

    // Fetch club and user details for each claim
    const claimsWithDetails = await Promise.all(
      claims.map(async (claim) => {
        const club = await ctx.db.get(claim.club_id);
        const user = claim.user_id ? await ctx.db.get(claim.user_id) : null;
        return {
          ...claim,
          club: club ? { name: club.name, city: club.city } : null,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );

    return claimsWithDetails;
  },
});

export const approveClaim = mutation({
  args: {
    claimId: v.id("club_claims"),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
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

    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }
    
    // Get claim
    const claim = await ctx.db.get(args.claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }

    if (claim.status !== "new") {
      throw new Error("Claim has already been processed");
    }

    // Get club
    const club = await ctx.db.get(claim.club_id);
    if (!club) {
      throw new Error("Club not found");
    }

    // Update club ownership - user_id is now required for new claims
    if (claim.user_id) {
      const claimUserId = claim.user_id; // Type guard
      await ctx.db.patch(claim.club_id, {
        owner_user_id: claimUserId,
        status: "claimed",
        plan: "basic", // Assign Basic (free) plan by default
      });

      // Ensure user has Basic plan subscription
      // claim.user_id is required for new claims, but check for type safety
      if (claim.user_id) {
        const claimUserId = claim.user_id; // Type guard
        const user = await ctx.db.get(claimUserId);
        if (user) {
          const existingSubscriptions = await ctx.db
            .query("subscriptions")
            .withIndex("by_owner", (q) => q.eq("owner_user_id", claimUserId))
            .collect();

          // If user doesn't have a subscription, create Basic plan subscription
          if (existingSubscriptions.length === 0) {
            await ctx.db.insert("subscriptions", {
              owner_user_id: claimUserId,
              club_id: undefined,
              clerk_customer_id: `basic_${claimUserId}`,
              clerk_subscription_id: `basic_sub_${claimUserId}_${Date.now()}`,
              plan: "basic",
              status: "active",
              current_period_end: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
              created_at: Date.now(),
            });

            // Update user's plan field
            await ctx.db.patch(claimUserId, {
              plan: "basic",
            });

            console.log(`✅ Assigned Basic plan to user ${claimUserId} after claim approval`);
          } else {
            // User already has subscription, just ensure club plan is set
            // (already done above)
          }
        }
      }
    } else {
      // Legacy claim without user_id - just mark as claimed (shouldn't happen for new claims)
      await ctx.db.patch(claim.club_id, {
        status: "claimed",
        plan: "basic", // Assign Basic (free) plan by default
      });
    }

    // Update claim status
    await ctx.db.patch(args.claimId, {
      status: "approved",
    });

    return { success: true };
  },
});

export const rejectClaim = mutation({
  args: {
    claimId: v.id("club_claims"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
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

    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Get claim
    const claim = await ctx.db.get(args.claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }

    if (claim.status !== "new") {
      throw new Error("Claim has already been processed");
    }

    // Update claim status
    await ctx.db.patch(args.claimId, {
      status: "rejected",
      notes: args.notes?.trim() || undefined,
    });

    return { success: true };
  },
});

