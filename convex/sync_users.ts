import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time migration: Sync all existing Clerk users to Convex
 * This should be run from Convex Dashboard Functions tab
 * 
 * Note: This requires manual entry of user data since we can't access Clerk API directly
 * For automated sync, users must sign in through the app (UserSync component handles this)
 */
export const syncUserManually = mutation({
  args: {
    auth_provider_user_id: v.string(), // Clerk user ID (starts with user_)
    email: v.string(),
    name: v.string(),
    role: v.optional(v.union(v.literal("club_owner"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", args.auth_provider_user_id)
      )
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        role: args.role || existingUser.role,
      });
      return { 
        success: true, 
        message: "User updated",
        userId: existingUser._id,
        action: "updated"
      };
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        auth_provider_user_id: args.auth_provider_user_id,
        email: args.email,
        name: args.name,
        role: args.role || "club_owner",
        created_at: Date.now(),
        has_listed_club: false,
        has_claimed_club: false,
      });
      return { 
        success: true, 
        message: "User created",
        userId,
        action: "created"
      };
    }
  },
});

