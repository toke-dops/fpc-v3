import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Set current user as admin (one-time setup)
 * This is a temporary function for initial admin setup
 * After first admin is created, use updateUserRole instead
 */
export const setCurrentUserAsAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!user) {
      throw new Error("User not found. Please sign in first.");
    }

    // Check if there are any existing admins
    const existingAdmins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    // Allow setting as admin if no admins exist yet, or if user is already admin
    if (existingAdmins.length === 0 || user.role === "admin") {
      await ctx.db.patch(user._id, {
        role: "admin",
      });
      return { success: true, message: "User set as admin" };
    }

    throw new Error("Admin already exists. Use updateUserRole mutation instead.");
  },
});

/**
 * Set a user as admin by email (for initial setup only)
 * This bypasses the "no existing admins" check for first-time setup
 * Use this if you need to set the first admin manually
 * 
 * IMPORTANT: This can only be called from Convex Dashboard (backend only)
 * It does NOT require authentication - use with caution!
 */
export const setUserAsAdminByEmail = mutation({
  args: {
    email: v.string(),
    force: v.optional(v.boolean()), // If true, bypasses the "no existing admins" check
  },
  handler: async (ctx, args) => {
    // Check if there are any existing admins (unless force is true)
    if (!args.force) {
      const existingAdmins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();

      // Only allow if no admins exist (first-time setup)
      if (existingAdmins.length > 0) {
        throw new Error(
          "Admin already exists. Set force: true to override, or use updateUserRole mutation instead."
        );
      }
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase().trim()))
      .first();

    if (!user) {
      throw new Error(`User with email ${args.email} not found. Make sure the user has signed in at least once to create their account.`);
    }

    // Set as admin
    await ctx.db.patch(user._id, {
      role: "admin",
    });

    return { 
      success: true, 
      message: `User ${args.email} set as admin`,
      userId: user._id,
      userName: user.name,
    };
  },
});

/**
 * Get all users (admin only)
 */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Check if user is admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      return null;
    }

    const users = await ctx.db.query("users").collect();
    return users;
  },
});

