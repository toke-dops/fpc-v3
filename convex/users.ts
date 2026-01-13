import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the current user from the auth token
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
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

      return user;
    } catch (error: any) {
      // Log the error for debugging
      console.error("[getCurrentUser] Error:", error);
      console.error("[getCurrentUser] This usually means:");
      console.error("  1. CLERK_JWT_ISSUER_DOMAIN is not set in Convex Dashboard");
      console.error("  2. JWT template 'convex' is not configured in Clerk");
      console.error("  3. The issuer domain doesn't match your Clerk configuration");
      // Return null instead of throwing to prevent breaking the UI
      return null;
    }
  },
});

/**
 * Get user by ID
 */
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get user by Clerk user ID
 */
export const getUserByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", args.clerkUserId)
      )
      .first();
    
    return user;
  },
});

/**
 * Get or create user from Clerk user data
 * Used by backend endpoints to ensure Convex user exists
 */
export const getOrCreateUserFromClerk = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.optional(v.union(v.literal("club_owner"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    // Try to find existing user
    let user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", args.clerkUserId)
      )
      .first();

    if (user) {
      // Update existing user if needed
      const updates: any = {};
      if (user.email !== args.email) updates.email = args.email;
      if (user.name !== args.name) updates.name = args.name;
      // Update clerk_user_id if provided and different
      if (args.clerkUserId && user.clerk_user_id !== args.clerkUserId) {
        updates.clerk_user_id = args.clerkUserId;
      }
      
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates);
        user = await ctx.db.get(user._id);
      }
      
      return user;
    }

    // Double-check for race condition - another process might have created the user
    const doubleCheckUser = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", args.clerkUserId)
      )
      .first();
    
    if (doubleCheckUser) {
      // User was created by another process, update and return
      const updates: any = {};
      if (doubleCheckUser.email !== args.email) updates.email = args.email;
      if (doubleCheckUser.name !== args.name) updates.name = args.name;
      if (args.clerkUserId && doubleCheckUser.clerk_user_id !== args.clerkUserId) {
        updates.clerk_user_id = args.clerkUserId;
      }
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(doubleCheckUser._id, updates);
        return await ctx.db.get(doubleCheckUser._id);
      }
      return doubleCheckUser;
    }

    // Create new user
    const newUser = await ctx.db.insert("users", {
      auth_provider_user_id: args.clerkUserId,
      clerk_user_id: args.clerkUserId, // Set alias for clarity
      email: args.email,
      name: args.name,
      role: args.role || "club_owner",
      created_at: Date.now(),
      has_listed_club: false,
      has_claimed_club: false,
      plan: "basic", // Initialize with basic plan
    });

    return await ctx.db.get(newUser);
  },
});

// listAllUsers moved to admin_users.ts (admin only)

/**
 * Sync user from Clerk auth token
 * This should be called after login to create/update user record
 */
export const syncUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.optional(v.union(v.literal("club_owner"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    // Debug: Try to get identity and log what we receive
    let identity;
    try {
      identity = await ctx.auth.getUserIdentity();
    } catch (error: any) {
      console.error("[syncUser] Error getting identity:", error);
      throw new Error(`Failed to get identity: ${error.message}`);
    }
    
    if (!identity) {
      // Additional debugging: Check if auth is configured
      console.error("[syncUser] No identity found. Auth may not be configured correctly.");
      console.error("[syncUser] Check:");
      console.error("  1. Is CLERK_JWT_ISSUER_DOMAIN set in Convex Dashboard?");
      console.error("  2. Does it match the issuer in the JWT token?");
      console.error("  3. Was 'npx convex dev' restarted after setting the env var?");
      throw new Error("Not authenticated");
    }
    
    // Log identity for debugging
    console.log("[syncUser] Identity received:", {
      subject: identity.subject,
      issuer: identity.issuer,
      name: identity.name,
      email: identity.email,
    });

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    if (existingUser) {
      // Update existing user (preserve created_at if it exists)
      const updates: any = {
        email: args.email,
        name: args.name,
      };
      
      // CRITICAL: Never overwrite admin role - preserve it if user is already admin
      // Only update role if:
      // 1. Role is provided in args AND
      // 2. User is NOT already an admin (admins should keep their role)
      if (args.role && existingUser.role !== "admin") {
        updates.role = args.role;
      }
      // If user is admin, preserve admin role regardless of args.role
      
      // Initialize fields if they don't exist (for legacy users)
      if (existingUser.created_at === undefined) {
        updates.created_at = Date.now();
      }
      if (existingUser.has_listed_club === undefined) {
        updates.has_listed_club = false;
      }
      if (existingUser.has_claimed_club === undefined) {
        updates.has_claimed_club = false;
      }
      
      await ctx.db.patch(existingUser._id, updates);
      return existingUser._id;
    } else {
      // Double-check for race condition - another process might have created the user
      const doubleCheckUser = await ctx.db
        .query("users")
        .withIndex("by_auth_provider_user_id", (q) =>
          q.eq("auth_provider_user_id", identity.subject)
        )
        .first();
      
      if (doubleCheckUser) {
        // User was created by another process, update and return
        const updates: any = {
          email: args.email,
          name: args.name,
        };
        if (args.role && doubleCheckUser.role !== "admin") {
          updates.role = args.role;
        }
        await ctx.db.patch(doubleCheckUser._id, updates);
        return doubleCheckUser._id;
      }
      
      // Create new user with default role "club_owner" or provided role
      const userId = await ctx.db.insert("users", {
        auth_provider_user_id: identity.subject,
        email: args.email,
        name: args.name,
        role: args.role ?? "club_owner",
        created_at: Date.now(),
        has_listed_club: false,
        has_claimed_club: false,
        plan: "basic", // Initialize with basic plan
      });
      return userId;
    }
  },
});

/**
 * Check if club owner account should be deleted (not verified within 7 days)
 * Can be called manually or by scheduled function
 */
export const checkAndDeleteInactiveClubOwners = mutation({
  args: {},
  handler: async (ctx) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Find all club_owner users created more than 7 days ago who haven't listed or claimed a club
    const allClubOwners = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "club_owner"))
      .collect();
    
    // Filter for inactive users (created > 7 days ago, no listing/claim)
    // Handle legacy users without created_at field
    const inactiveUsers = allClubOwners.filter((user) => {
      const createdAt = user.created_at ?? Date.now(); // Default to now if missing (legacy user)
      const hasListed = user.has_listed_club ?? false;
      const hasClaimed = user.has_claimed_club ?? false;
      return createdAt < sevenDaysAgo && !hasListed && !hasClaimed;
    });

    // Unclaim clubs and delete inactive users
    let clubsUnclaimed = 0;
    for (const user of inactiveUsers) {
      // Unclaim all clubs owned by this user before deleting
      const userClubs = await ctx.db
        .query("clubs")
        .filter((q) => q.eq(q.field("owner_user_id"), user._id))
        .collect();

      for (const club of userClubs) {
        await ctx.db.patch(club._id, {
          status: "unclaimed",
          owner_user_id: undefined,
          plan: "basic",
          is_featured: false,
        });
        clubsUnclaimed++;
      }

      await ctx.db.delete(user._id);
    }

    return { deleted: inactiveUsers.length, clubsUnclaimed };
  },
});

/**
 * Internal version for scheduled functions
 */
export const checkAndDeleteInactiveClubOwnersInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Find all club_owner users created more than 7 days ago who haven't listed or claimed a club
    const allClubOwners = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "club_owner"))
      .collect();
    
    // Filter for inactive users (created > 7 days ago, no listing/claim)
    // Handle legacy users without created_at field
    const inactiveUsers = allClubOwners.filter((user) => {
      const createdAt = user.created_at ?? Date.now(); // Default to now if missing (legacy user)
      const hasListed = user.has_listed_club ?? false;
      const hasClaimed = user.has_claimed_club ?? false;
      return createdAt < sevenDaysAgo && !hasListed && !hasClaimed;
    });

    // Unclaim clubs and delete inactive users
    let clubsUnclaimed = 0;
    for (const user of inactiveUsers) {
      // Unclaim all clubs owned by this user before deleting
      const userClubs = await ctx.db
        .query("clubs")
        .filter((q) => q.eq(q.field("owner_user_id"), user._id))
        .collect();

      for (const club of userClubs) {
        await ctx.db.patch(club._id, {
          status: "unclaimed",
          owner_user_id: undefined,
          plan: "basic",
          is_featured: false,
        });
        clubsUnclaimed++;
      }

      await ctx.db.delete(user._id);
    }

    return { deleted: inactiveUsers.length, clubsUnclaimed };
  },
});

/**
 * Get account status for club owners (days remaining, verification status)
 */
export const getAccountStatus = query({
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

    // Only club owners need verification (admins are exempt)
    if (!user || user.role !== "club_owner") {
      return null;
    }

    const hasListedClub = user.has_listed_club ?? false;
    const hasClaimedClub = user.has_claimed_club ?? false;
    const isVerified = hasListedClub || hasClaimedClub;
    const createdAt = user.created_at ?? Date.now(); // Default to now if missing (legacy user)
    const daysSinceCreation = Math.floor((Date.now() - createdAt) / (24 * 60 * 60 * 1000));
    const daysRemaining = Math.max(0, 7 - daysSinceCreation);
    const shouldBeDeleted = !isVerified && daysRemaining === 0;

    return {
      isVerified,
      daysRemaining,
      shouldBeDeleted,
      hasListedClub,
      hasClaimedClub,
      createdAt,
      verifiedAt: user.club_verified_at,
    };
  },
});

/**
 * Clean up orphaned clubs (clubs with owner_user_id pointing to non-existent users)
 * This should be run periodically to fix any data inconsistencies
 */
export const cleanupOrphanedClubs = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all claimed clubs
    const claimedClubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("status"), "claimed"))
      .collect();

    let cleaned = 0;
    for (const club of claimedClubs) {
      if (club.owner_user_id) {
        // Check if the owner user still exists
        const owner = await ctx.db.get(club.owner_user_id);
        if (!owner) {
          // Owner doesn't exist, unclaim the club
          await ctx.db.patch(club._id, {
            status: "unclaimed",
            owner_user_id: undefined,
            plan: "basic",
            is_featured: false,
          });
          cleaned++;
        }
      } else {
        // Club is marked as claimed but has no owner_user_id, fix it
        await ctx.db.patch(club._id, {
          status: "unclaimed",
          plan: "basic",
          is_featured: false,
        });
        cleaned++;
      }
    }

    return { cleaned };
  },
});
