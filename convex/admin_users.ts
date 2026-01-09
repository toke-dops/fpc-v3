import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

/**
 * List all users (admin only)
 */
export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
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

    const allUsers = await ctx.db.query("users").collect();
    return allUsers.map((user) => ({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      auth_provider_user_id: user.auth_provider_user_id,
      created_at: user.created_at,
      has_listed_club: user.has_listed_club ?? false,
      has_claimed_club: user.has_claimed_club ?? false,
      club_verified_at: user.club_verified_at,
    }));
  },
});

/**
 * Update user (admin only)
 */
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(v.union(v.literal("club_owner"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Get user to update
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Build update object
    const updates: Partial<Doc<"users">> = {};
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.email !== undefined) updates.email = args.email.trim().toLowerCase();
    if (args.role !== undefined) updates.role = args.role;

    // Update user
    await ctx.db.patch(args.userId, updates);

    return { success: true };
  },
});

/**
 * Delete user (admin only)
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Prevent deleting yourself
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user._id === admin._id) {
      throw new Error("Cannot delete your own account");
    }

    // Unclaim all clubs owned by this user before deleting
    const userClubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), args.userId))
      .collect();

    let clubsUnclaimed = 0;
    for (const club of userClubs) {
      await ctx.db.patch(club._id, {
        status: "unclaimed",
        owner_user_id: undefined,
        plan: "basic",
        is_featured: false,
      });
      clubsUnclaimed++;
    }

    // Delete user
    await ctx.db.delete(args.userId);

    return { success: true, clubsUnclaimed };
  },
});

/**
 * Create admin user (admin only)
 * This creates a Convex user record for a Clerk user
 */
export const createAdminUser = mutation({
  args: {
    auth_provider_user_id: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required");
    }

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

/**
 * Set user as admin (admin only)
 * Updates an existing user's role to admin
 */
export const setUserAsAdmin = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Require admin authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const admin = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Get user to update
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Update role to admin
    await ctx.db.patch(args.userId, {
      role: "admin",
    });

    return { success: true };
  },
});

