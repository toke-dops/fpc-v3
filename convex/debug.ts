import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Debug query to check authentication and user matching
 * This helps diagnose why getCurrentUser returns null
 */
export const debugAuth = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      return {
        authenticated: false,
        message: "No identity found - Convex auth not working",
        identity: null,
      };
    }

    // Get all users to see what we have
    const allUsers = await ctx.db.query("users").collect();
    
    // Try to find user by auth_provider_user_id
    const userByAuthId = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", (q) =>
        q.eq("auth_provider_user_id", identity.subject)
      )
      .first();

    return {
      authenticated: true,
      identitySubject: identity.subject, // This is what Clerk sends
      allUsers: allUsers.map((u) => ({
        id: u._id,
        email: u.email,
        auth_provider_user_id: u.auth_provider_user_id,
        role: u.role,
      })),
      matchedUser: userByAuthId
        ? {
            id: userByAuthId._id,
            email: userByAuthId.email,
            role: userByAuthId.role,
          }
        : null,
      message: userByAuthId
        ? "User found!"
        : `No user found with auth_provider_user_id matching "${identity.subject}". Check if the User ID in Convex matches this value.`,
    };
  },
});

