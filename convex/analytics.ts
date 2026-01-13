import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

export const trackEvent = mutation({
  args: {
    club_id: v.id("clubs"),
    type: v.union(
      v.literal("view"),
      v.literal("booking_click"),
      v.literal("lead_submitted"),
      v.literal("facebook_click"),
      v.literal("instagram_click"),
      v.literal("linkedin_click"),
      v.literal("twitter_click"),
      v.literal("session_end"),
      v.literal("website_click"),
      v.literal("phone_click")
    ),
    session_duration: v.optional(v.number()),
    user_agent: v.optional(v.string()),
    referrer: v.optional(v.string()),
    is_owner: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if the current user is the club owner
    const identity = await ctx.auth.getUserIdentity();
    let isOwner = false;
    
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_auth_provider_user_id", (q) =>
          q.eq("auth_provider_user_id", identity.subject)
        )
        .first();
      
      if (user) {
        const club = await ctx.db.get(args.club_id);
        if (club && club.owner_user_id === user._id) {
          isOwner = true;
        }
      }
    }

    // Don't track events from the club owner (unless explicitly allowed)
    // The is_owner flag is passed from client, but we verify it here
    if (isOwner && args.type !== "lead_submitted") {
      // Allow lead submissions even from owners (for testing)
      return { skipped: true, reason: "owner_view" };
    }

    const eventId = await ctx.db.insert("analytics_events", {
      club_id: args.club_id,
      type: args.type,
      created_at: Date.now(),
      session_duration: args.session_duration,
      user_agent: args.user_agent,
      referrer: args.referrer,
      is_owner: isOwner,
    });

    return eventId;
  },
});

export const getByClub = query({
  args: { club_id: v.id("clubs") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("analytics_events")
      .withIndex("by_club", (q) => q.eq("club_id", args.club_id))
      .collect();

    const views = events.filter((e) => e.type === "view").length;
    const bookingClicks = events.filter((e) => e.type === "booking_click").length;
    const leadsSubmitted = events.filter((e) => e.type === "lead_submitted").length;

    return {
      views,
      bookingClicks,
      leadsSubmitted,
      total: events.length,
    };
  },
});

export const getOverview = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let events = await ctx.db.query("analytics_events").collect();

    // Filter by date range if provided
    if (args.startDate) {
      events = events.filter((e) => e.created_at >= args.startDate!);
    }
    if (args.endDate) {
      events = events.filter((e) => e.created_at <= args.endDate!);
    }

    const totalViews = events.filter((e) => e.type === "view").length;
    const totalBookingClicks = events.filter((e) => e.type === "booking_click").length;
    const totalLeads = events.filter((e) => e.type === "lead_submitted").length;

    // Group by club
    const byClub = new Map<string, { views: number; clicks: number; leads: number }>();
    events.forEach((event) => {
      const clubId = event.club_id;
      if (!byClub.has(clubId)) {
        byClub.set(clubId, { views: 0, clicks: 0, leads: 0 });
      }
      const stats = byClub.get(clubId)!;
      if (event.type === "view") stats.views++;
      else if (event.type === "booking_click") stats.clicks++;
      else if (event.type === "lead_submitted") stats.leads++;
    });

    return {
      totalViews,
      totalBookingClicks,
      totalLeads,
      totalEvents: events.length,
      clubStats: Object.fromEntries(byClub),
    };
  },
});

/**
 * Get comprehensive admin analytics dashboard data
 * Includes popular clubs, popular locations, and overall stats
 */
export const getAdminDashboard = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Auth removed - analytics are now public (for manual review via Convex Dashboard)
    
    // Get all events
    let events = await ctx.db.query("analytics_events").collect();

    // Filter by date range if provided
    if (args.startDate) {
      events = events.filter((e) => e.created_at >= args.startDate!);
    }
    if (args.endDate) {
      events = events.filter((e) => e.created_at <= args.endDate!);
    }

    // Overall stats
    const totalViews = events.filter((e) => e.type === "view").length;
    const totalBookingClicks = events.filter((e) => e.type === "booking_click").length;
    const totalLeads = events.filter((e) => e.type === "lead_submitted").length;

    // Group by club with club details
    const clubStatsMap = new Map<
      string,
      {
        clubId: string;
        views: number;
        clicks: number;
        leads: number;
        club?: any;
      }
    >();

    events.forEach((event) => {
      const clubId = event.club_id;
      if (!clubStatsMap.has(clubId)) {
        clubStatsMap.set(clubId, {
          clubId,
          views: 0,
          clicks: 0,
          leads: 0,
        });
      }
      const stats = clubStatsMap.get(clubId)!;
      if (event.type === "view") stats.views++;
      else if (event.type === "booking_click") stats.clicks++;
      else if (event.type === "lead_submitted") stats.leads++;
    });

    // Fetch club details for all clubs with stats
    const clubStatsArray = Array.from(clubStatsMap.values());
    for (const stat of clubStatsArray) {
      const club = await ctx.db.get(stat.clubId as any);
      if (club) {
        // Type assertion: we know this is a club because clubId comes from analytics_events.club_id
        const clubDoc = club as Doc<"clubs">;
        stat.club = {
          name: clubDoc.name,
          city: clubDoc.city,
          slug: clubDoc.slug,
          rating: clubDoc.rating,
          rating_count: clubDoc.rating_count,
        };
      }
    }

    // Sort by total engagement (views + clicks + leads)
    clubStatsArray.sort((a, b) => {
      const totalA = a.views + a.clicks + a.leads;
      const totalB = b.views + b.clicks + b.leads;
      return totalB - totalA;
    });

    // Get top N clubs
    const limit = args.limit ?? 20;
    const popularClubs = clubStatsArray.slice(0, limit);

    // Group by city/location
    const cityStatsMap = new Map<
      string,
      {
        city: string;
        views: number;
        clicks: number;
        leads: number;
        clubCount: number;
      }
    >();

    for (const stat of clubStatsArray) {
      if (stat.club?.city) {
        const city = stat.club.city;
        if (!cityStatsMap.has(city)) {
          cityStatsMap.set(city, {
            city,
            views: 0,
            clicks: 0,
            leads: 0,
            clubCount: 0,
          });
        }
        const cityStats = cityStatsMap.get(city)!;
        cityStats.views += stat.views;
        cityStats.clicks += stat.clicks;
        cityStats.leads += stat.leads;
        cityStats.clubCount += 1;
      }
    }

    // Sort cities by total engagement
    const popularLocations = Array.from(cityStatsMap.values())
      .sort((a, b) => {
        const totalA = a.views + a.clicks + a.leads;
        const totalB = b.views + b.clicks + b.leads;
        return totalB - totalA;
      })
      .slice(0, limit);

    return {
      overview: {
        totalViews,
        totalBookingClicks,
        totalLeads,
        totalEvents: events.length,
      },
      popularClubs,
      popularLocations,
    };
  },
});

