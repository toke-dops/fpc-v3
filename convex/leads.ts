import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    club_id: v.id("clubs"),
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Create the lead
    const leadId = await ctx.db.insert("leads", {
      club_id: args.club_id,
      name: args.name,
      email: args.email,
      message: args.message,
      created_at: Date.now(),
    });

    // Also track the analytics event
    await ctx.db.insert("analytics_events", {
      club_id: args.club_id,
      type: "lead_submitted",
      created_at: Date.now(),
    });

    return leadId;
  },
});

export const getByClub = query({
  args: { club_id: v.id("clubs") },
  handler: async (ctx, args) => {
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_club", (q) => q.eq("club_id", args.club_id))
      .collect();

    // Sort by created_at descending
    return leads.sort((a, b) => b.created_at - a.created_at);
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_created")
      .collect();

    // Sort by created_at descending and limit
    return leads
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, args.limit ?? 10);
  },
});

