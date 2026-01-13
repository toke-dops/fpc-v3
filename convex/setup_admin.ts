import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time setup: Set temitope875@gmail.com as admin
 * This should be run once from Convex Dashboard
 * 
 * Usage:
 * 1. Get the Clerk User ID for temitope875@gmail.com from Clerk Dashboard
 * 2. Run this mutation in Convex Dashboard with:
 *    {
 *      "auth_provider_user_id": "user_...", // Clerk User ID
 *      "email": "temitope875@gmail.com",
 *      "name": "Admin User"
 *    }
 */
export const setupAdmin = mutation({
  args: {
    auth_provider_user_id: v.string(),
    email: v.string(),
    name: v.string(),
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
      // Update existing user to admin
      await ctx.db.patch(existingUser._id, {
        role: "admin",
        email: args.email.trim().toLowerCase(),
        name: args.name.trim(),
      });
      return { success: true, userId: existingUser._id, created: false };
    }

    // Create new admin user
    const userId = await ctx.db.insert("users", {
      auth_provider_user_id: args.auth_provider_user_id,
      email: args.email.trim().toLowerCase(),
      name: args.name.trim(),
      role: "admin",
      created_at: Date.now(),
      has_listed_club: false,
      has_claimed_club: false,
    });

    return { success: true, userId, created: true };
  },
});

