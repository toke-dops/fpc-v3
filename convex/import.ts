import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Type for the imported club data
const clubDataValidator = v.object({
  name: v.string(),
  categories: v.array(v.string()),
  amenities: v.optional(v.array(v.string())),
  street_address: v.optional(v.string()),
  full_address: v.optional(v.string()),
  city: v.optional(v.string()),
  region: v.optional(v.string()),
  postcode: v.optional(v.string()),
  country: v.string(),
  country_code: v.string(),
  phone: v.optional(v.string()),
  website: v.optional(v.string()),
  contact_email: v.optional(v.string()),
  facebook: v.optional(v.string()),
  instagram: v.optional(v.string()),
  linkedin: v.optional(v.string()),
  twitter: v.optional(v.string()),
  maps_url: v.optional(v.string()),
  booking_url: v.optional(v.string()),
  lat: v.optional(v.number()),
  lng: v.optional(v.number()),
  rating: v.optional(v.number()),
  rating_count: v.optional(v.number()),
  opening_hours_raw: v.optional(v.string()),
  image_url: v.optional(v.string()),
  description: v.optional(v.string()),
  slug: v.string(),
});

export const importClubs = mutation({
  args: {
    clubs: v.array(clubDataValidator),
    replaceAll: v.optional(v.boolean()), // If true, replace existing clubs instead of skipping
  },
  handler: async (ctx, args) => {
    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const clubData of args.clubs) {
      try {
        // Check if club with same slug already exists
        const existing = await ctx.db
          .query("clubs")
          .withIndex("by_slug", (q) => q.eq("slug", clubData.slug))
          .first();

        if (existing) {
          if (args.replaceAll) {
            // Update existing club, but preserve owner and status if claimed
            // Remove image_url if it exists to ensure we only use Pexels images
            const { image_url, ...clubDataWithoutImages } = clubData;
            await ctx.db.patch(existing._id, {
              ...clubDataWithoutImages,
              // Preserve owner and status if club is claimed
              status: existing.status === "claimed" ? "claimed" : "unclaimed",
              owner_user_id: existing.owner_user_id,
              // Preserve plan and featured status if club is claimed
              plan: existing.status === "claimed" ? existing.plan : "basic",
              is_featured: existing.status === "claimed" ? existing.is_featured : false,
            });
            results.updated++;
          } else {
            results.skipped++;
          }
          continue;
        }

        // Insert the club - remove image_url if it exists to ensure we only use Pexels
        const { image_url, ...clubDataWithoutImages } = clubData;
        await ctx.db.insert("clubs", {
          ...clubDataWithoutImages,
          status: "unclaimed",
          is_featured: false,
          plan: "basic",
        });

        results.imported++;
      } catch (error) {
        results.errors.push(`Failed to import ${clubData.name}: ${error}`);
      }
    }

    return results;
  },
});

export const clearAllClubs = mutation({
  args: {},
  handler: async (ctx) => {
    const clubs = await ctx.db.query("clubs").collect();
    let deleted = 0;

    for (const club of clubs) {
      await ctx.db.delete(club._id);
      deleted++;
    }

    return { deleted };
  },
});

