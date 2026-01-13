import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

/**
 * Get all clubs owned by the current authenticated user
 */
export const getMyClubs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty array instead of throwing for better UX
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

    // Get all clubs owned by this user
    const clubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), user._id))
      .collect();

    return clubs;
  },
});

/**
 * Get analytics for a specific club (owner only)
 */
export const getClubAnalytics = query({
  args: {
    clubId: v.id("clubs"),
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

    // Verify user owns this club
    const club = await ctx.db.get(args.clubId);
    if (!club || club.owner_user_id !== user._id) {
      throw new Error("Club not found or access denied");
    }

    // Analytics requires Business or Featured plan
    if (club.plan !== "business" && club.plan !== "featured" && user.plan !== "business" && user.plan !== "featured") {
      throw new Error("Analytics requires Business or Featured plan. Please upgrade to access analytics.");
    }

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get all analytics events for this club
    const allEvents = await ctx.db
      .query("analytics_events")
      .withIndex("by_club", (q) => q.eq("club_id", args.clubId))
      .collect();

    // Get leads for this club
    const allLeads = await ctx.db
      .query("leads")
      .withIndex("by_club", (q) => q.eq("club_id", args.clubId))
      .collect();

    // Calculate metrics
    const totalViews = allEvents.filter((e) => e.type === "view").length;
    const totalBookingClicks = allEvents.filter((e) => e.type === "booking_click").length;
    const totalLeads = allLeads.length;
    const totalFacebookClicks = allEvents.filter((e) => e.type === "facebook_click").length;
    const totalInstagramClicks = allEvents.filter((e) => e.type === "instagram_click").length;
    const totalLinkedInClicks = allEvents.filter((e) => e.type === "linkedin_click").length;
    const totalTwitterClicks = allEvents.filter((e) => e.type === "twitter_click").length;
    const totalSocialClicks = totalFacebookClicks + totalInstagramClicks + totalLinkedInClicks + totalTwitterClicks;

    // Last 30 days metrics
    const recentEvents = allEvents.filter((e) => e.created_at >= thirtyDaysAgo);
    const recentLeads = allLeads.filter((l) => l.created_at >= thirtyDaysAgo);

    const views30d = recentEvents.filter((e) => e.type === "view").length;
    const bookingClicks30d = recentEvents.filter((e) => e.type === "booking_click").length;
    const leads30d = recentLeads.length;
    const facebookClicks30d = recentEvents.filter((e) => e.type === "facebook_click").length;
    const instagramClicks30d = recentEvents.filter((e) => e.type === "instagram_click").length;
    const linkedInClicks30d = recentEvents.filter((e) => e.type === "linkedin_click").length;
    const twitterClicks30d = recentEvents.filter((e) => e.type === "twitter_click").length;
    const socialClicks30d = facebookClicks30d + instagramClicks30d + linkedInClicks30d + twitterClicks30d;

    // Get recent leads (last 10)
    const recentLeadsList = allLeads
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 10)
      .map((lead) => ({
        name: lead.name,
        email: lead.email,
        message: lead.message,
        created_at: lead.created_at,
      }));

    return {
      totalViews,
      totalBookingClicks,
      totalLeads,
      views30d,
      bookingClicks30d,
      leads30d,
      totalFacebookClicks,
      totalInstagramClicks,
      totalLinkedInClicks,
      totalTwitterClicks,
      totalSocialClicks,
      facebookClicks30d,
      instagramClicks30d,
      linkedInClicks30d,
      twitterClicks30d,
      socialClicks30d,
      recentLeads: recentLeadsList,
    };
  },
});

/**
 * Get dashboard summary for owner (all their clubs combined)
 */
export const getOwnerDashboard = query({
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

    // Get all clubs owned by this user
    const clubs = await ctx.db
      .query("clubs")
      .filter((q) => q.eq(q.field("owner_user_id"), user._id))
      .collect();

    // Check if user has Business or Featured plan (via clubs or user plan)
    const hasBusinessOrFeatured = clubs.some(c => c.plan === "business" || c.plan === "featured") || 
                                  user.plan === "business" || user.plan === "featured";
    
    // Analytics dashboard requires Business or Featured plan
    if (!hasBusinessOrFeatured) {
      throw new Error("Analytics dashboard requires Business or Featured plan. Please upgrade to access analytics.");
    }

    // Note: Club plan syncing should be done via mutations, not queries
    // Queries are read-only and cannot modify data

    if (clubs.length === 0) {
      return {
        totalClubs: 0,
        totalViews: 0,
        totalBookingClicks: 0,
        totalLeads: 0,
        views30d: 0,
        bookingClicks30d: 0,
        leads30d: 0,
        totalFacebookClicks: 0,
        totalInstagramClicks: 0,
        totalLinkedInClicks: 0,
        totalTwitterClicks: 0,
        totalSocialClicks: 0,
        facebookClicks30d: 0,
        instagramClicks30d: 0,
        linkedInClicks30d: 0,
        twitterClicks30d: 0,
        socialClicks30d: 0,
        totalWebsiteClicks: 0,
        totalPhoneClicks: 0,
        websiteClicks30d: 0,
        phoneClicks30d: 0,
        averageSessionTime: 0,
        averageSessionTime30d: 0,
        bounceRate: 0,
        bounceRate30d: 0,
        clubs: [],
      };
    }

    const clubIds = clubs.map((c) => c._id);
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get all analytics events for all clubs
    const allEvents = await Promise.all(
      clubIds.map((clubId) =>
        ctx.db
          .query("analytics_events")
          .withIndex("by_club", (q) => q.eq("club_id", clubId))
          .collect()
      )
    );
    const flatEvents = allEvents.flat();

    // Get all leads for all clubs
    const allLeads = await Promise.all(
      clubIds.map((clubId) =>
        ctx.db
          .query("leads")
          .withIndex("by_club", (q) => q.eq("club_id", clubId))
          .collect()
      )
    );
    const flatLeads = allLeads.flat();

    // Filter out owner's own events
    const filteredEvents = flatEvents.filter((e) => !e.is_owner);
    
    // Calculate aggregate metrics (excluding owner events)
    const totalViews = filteredEvents.filter((e) => e.type === "view").length;
    const totalBookingClicks = filteredEvents.filter((e) => e.type === "booking_click").length;
    const totalLeads = flatLeads.length;
    const totalFacebookClicks = filteredEvents.filter((e) => e.type === "facebook_click").length;
    const totalInstagramClicks = filteredEvents.filter((e) => e.type === "instagram_click").length;
    const totalLinkedInClicks = filteredEvents.filter((e) => e.type === "linkedin_click").length;
    const totalTwitterClicks = filteredEvents.filter((e) => e.type === "twitter_click").length;
    const totalSocialClicks = totalFacebookClicks + totalInstagramClicks + totalLinkedInClicks + totalTwitterClicks;
    const totalWebsiteClicks = filteredEvents.filter((e) => e.type === "website_click").length;
    const totalPhoneClicks = filteredEvents.filter((e) => e.type === "phone_click").length;
    
    // Calculate average session time from session_end events
    const sessionEndEvents = filteredEvents.filter((e) => e.type === "session_end" && e.session_duration);
    const totalSessionTime = sessionEndEvents.reduce((sum, e) => sum + (e.session_duration || 0), 0);
    const averageSessionTime = sessionEndEvents.length > 0 ? totalSessionTime / sessionEndEvents.length : 0;
    
    // Calculate bounce rate (sessions < 10 seconds)
    const quickSessions = sessionEndEvents.filter((e) => (e.session_duration || 0) < 10000).length;
    const bounceRate = sessionEndEvents.length > 0 ? (quickSessions / sessionEndEvents.length) * 100 : 0;

    const recentEvents = filteredEvents.filter((e) => e.created_at >= thirtyDaysAgo);
    const recentLeads = flatLeads.filter((l) => l.created_at >= thirtyDaysAgo);

    const views30d = recentEvents.filter((e) => e.type === "view").length;
    const bookingClicks30d = recentEvents.filter((e) => e.type === "booking_click").length;
    const leads30d = recentLeads.length;
    const facebookClicks30d = recentEvents.filter((e) => e.type === "facebook_click").length;
    const instagramClicks30d = recentEvents.filter((e) => e.type === "instagram_click").length;
    const linkedInClicks30d = recentEvents.filter((e) => e.type === "linkedin_click").length;
    const twitterClicks30d = recentEvents.filter((e) => e.type === "twitter_click").length;
    const socialClicks30d = facebookClicks30d + instagramClicks30d + linkedInClicks30d + twitterClicks30d;
    const websiteClicks30d = recentEvents.filter((e) => e.type === "website_click").length;
    const phoneClicks30d = recentEvents.filter((e) => e.type === "phone_click").length;
    
    // Recent session metrics
    const recentSessionEnds = recentEvents.filter((e) => e.type === "session_end" && e.session_duration);
    const recentTotalSessionTime = recentSessionEnds.reduce((sum, e) => sum + (e.session_duration || 0), 0);
    const averageSessionTime30d = recentSessionEnds.length > 0 ? recentTotalSessionTime / recentSessionEnds.length : 0;
    const recentQuickSessions = recentSessionEnds.filter((e) => (e.session_duration || 0) < 10000).length;
    const bounceRate30d = recentSessionEnds.length > 0 ? (recentQuickSessions / recentSessionEnds.length) * 100 : 0;

    // Get per-club metrics
    const clubsWithMetrics = await Promise.all(
      clubs.map(async (club) => {
        const clubEvents = filteredEvents.filter((e) => e.club_id === club._id);
        const clubLeads = flatLeads.filter((l) => l.club_id === club._id);
        const clubRecentEvents = clubEvents.filter((e) => e.created_at >= thirtyDaysAgo);
        const clubRecentLeads = clubLeads.filter((l) => l.created_at >= thirtyDaysAgo);
        
        // Calculate session metrics for this club
        const clubSessionEnds = clubEvents.filter((e) => e.type === "session_end" && e.session_duration);
        const clubTotalSessionTime = clubSessionEnds.reduce((sum, e) => sum + (e.session_duration || 0), 0);
        const clubAverageSessionTime = clubSessionEnds.length > 0 ? clubTotalSessionTime / clubSessionEnds.length : 0;
        
        const clubRecentSessionEnds = clubRecentEvents.filter((e) => e.type === "session_end" && e.session_duration);
        const clubRecentTotalSessionTime = clubRecentSessionEnds.reduce((sum, e) => sum + (e.session_duration || 0), 0);
        const clubAverageSessionTime30d = clubRecentSessionEnds.length > 0 ? clubRecentTotalSessionTime / clubRecentSessionEnds.length : 0;

        const clubFacebookClicks = clubEvents.filter((e) => e.type === "facebook_click").length;
        const clubInstagramClicks = clubEvents.filter((e) => e.type === "instagram_click").length;
        const clubLinkedInClicks = clubEvents.filter((e) => e.type === "linkedin_click").length;
        const clubTwitterClicks = clubEvents.filter((e) => e.type === "twitter_click").length;
        const clubSocialClicks = clubFacebookClicks + clubInstagramClicks + clubLinkedInClicks + clubTwitterClicks;
        const clubWebsiteClicks = clubEvents.filter((e) => e.type === "website_click").length;
        const clubPhoneClicks = clubEvents.filter((e) => e.type === "phone_click").length;
        
        const clubRecentFacebookClicks = clubRecentEvents.filter((e) => e.type === "facebook_click").length;
        const clubRecentInstagramClicks = clubRecentEvents.filter((e) => e.type === "instagram_click").length;
        const clubRecentLinkedInClicks = clubRecentEvents.filter((e) => e.type === "linkedin_click").length;
        const clubRecentTwitterClicks = clubRecentEvents.filter((e) => e.type === "twitter_click").length;
        const clubSocialClicks30d = clubRecentFacebookClicks + clubRecentInstagramClicks + clubRecentLinkedInClicks + clubRecentTwitterClicks;
        const clubWebsiteClicks30d = clubRecentEvents.filter((e) => e.type === "website_click").length;
        const clubPhoneClicks30d = clubRecentEvents.filter((e) => e.type === "phone_click").length;

        return {
          _id: club._id,
          name: club.name,
          city: club.city,
          slug: club.slug,
          is_featured: club.is_featured,
          plan: club.plan,
          totalViews: clubEvents.filter((e) => e.type === "view").length,
          totalBookingClicks: clubEvents.filter((e) => e.type === "booking_click").length,
          totalLeads: clubLeads.length,
          views30d: clubRecentEvents.filter((e) => e.type === "view").length,
          bookingClicks30d: clubRecentEvents.filter((e) => e.type === "booking_click").length,
          leads30d: clubRecentLeads.length,
          totalFacebookClicks: clubFacebookClicks,
          totalInstagramClicks: clubInstagramClicks,
          totalLinkedInClicks: clubLinkedInClicks,
          totalTwitterClicks: clubTwitterClicks,
          totalSocialClicks: clubSocialClicks,
          totalWebsiteClicks: clubWebsiteClicks,
          totalPhoneClicks: clubPhoneClicks,
          facebookClicks30d: clubRecentFacebookClicks,
          instagramClicks30d: clubRecentInstagramClicks,
          linkedInClicks30d: clubRecentLinkedInClicks,
          twitterClicks30d: clubRecentTwitterClicks,
          socialClicks30d: clubSocialClicks30d,
          websiteClicks30d: clubWebsiteClicks30d,
          phoneClicks30d: clubPhoneClicks30d,
          averageSessionTime: clubAverageSessionTime,
          averageSessionTime30d: clubAverageSessionTime30d,
        };
      })
    );

    return {
      totalClubs: clubs.length,
      totalViews,
      totalBookingClicks,
      totalLeads,
      views30d,
      bookingClicks30d,
      leads30d,
      totalFacebookClicks,
      totalInstagramClicks,
      totalLinkedInClicks,
      totalTwitterClicks,
      totalSocialClicks,
      facebookClicks30d,
      instagramClicks30d,
      linkedInClicks30d,
      twitterClicks30d,
      socialClicks30d,
      totalWebsiteClicks,
      totalPhoneClicks,
      websiteClicks30d,
      phoneClicks30d,
      averageSessionTime,
      averageSessionTime30d,
      bounceRate,
      bounceRate30d,
      clubs: clubsWithMetrics,
    };
  },
});

/**
 * Update club listing (owner only)
 */
export const updateClubListing = mutation({
  args: {
    clubId: v.id("clubs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()), // We'll add this field to schema if needed
    website: v.optional(v.string()),
    booking_url: v.optional(v.string()),
    phone: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    opening_hours_raw: v.optional(v.string()),
    street_address: v.optional(v.string()),
    full_address: v.optional(v.string()),
    city: v.optional(v.string()),
    postcode: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    number_of_courts: v.optional(v.number()),
    additional_features: v.optional(v.string()),
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

    // Verify user owns this club
    const club = await ctx.db.get(args.clubId);
    if (!club || club.owner_user_id !== user._id) {
      throw new Error("Club not found or access denied");
    }

    // Build update object (only update provided fields)
    const updates: Partial<Doc<"clubs">> = {};
    if (args.name !== undefined) updates.name = args.name.trim();
    if (args.website !== undefined) updates.website = args.website?.trim() || undefined;
    if (args.booking_url !== undefined) {
      // Only allow booking_url if club has business or featured plan
      if (club.plan === "basic" && args.booking_url) {
        throw new Error("Booking URL requires Business plan. Please upgrade to add a booking link.");
      }
      updates.booking_url = args.booking_url?.trim() || undefined;
    }
    if (args.phone !== undefined) updates.phone = args.phone?.trim() || undefined;
    if (args.contact_email !== undefined) {
      // Only allow contact_email if club has business or featured plan
      if (club.plan === "basic" && args.contact_email) {
        throw new Error("Contact email requires Business plan. Please upgrade to add a contact email.");
      }
      updates.contact_email = args.contact_email?.trim() || undefined;
    }
    if (args.opening_hours_raw !== undefined) updates.opening_hours_raw = args.opening_hours_raw?.trim() || undefined;
    // Image fields removed - using royalty-free placeholder images only
    if (args.amenities !== undefined) updates.amenities = args.amenities;
    if (args.number_of_courts !== undefined) updates.number_of_courts = args.number_of_courts;
    if (args.additional_features !== undefined) updates.additional_features = args.additional_features?.trim() || undefined;
    if (args.street_address !== undefined) updates.street_address = args.street_address?.trim() || undefined;
    if (args.full_address !== undefined) updates.full_address = args.full_address?.trim() || undefined;
    if (args.city !== undefined) updates.city = args.city?.trim() || undefined;
    if (args.postcode !== undefined) updates.postcode = args.postcode?.trim() || undefined;

    // Update club
    await ctx.db.patch(args.clubId, updates);

    return { success: true };
  },
});

