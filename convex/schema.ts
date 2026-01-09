import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    auth_provider_user_id: v.string(), // Clerk user ID (primary identifier)
    clerk_user_id: v.optional(v.string()), // Alias for auth_provider_user_id (for clarity, can be same value)
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("club_owner"),
      v.literal("admin")
    ),
    plan: v.optional(v.union(v.literal("basic"), v.literal("business"), v.literal("featured"))), // User's current subscription plan (linked to subscriptions table)
    created_at: v.optional(v.number()), // Account creation timestamp (optional for legacy users)
    has_listed_club: v.optional(v.boolean()), // Whether they've submitted a club listing (optional for legacy users)
    has_claimed_club: v.optional(v.boolean()), // Whether they've claimed an existing club (optional for legacy users)
    club_verified_at: v.optional(v.number()), // Timestamp when they listed/claimed a club
  })
    .index("by_auth_provider_user_id", ["auth_provider_user_id"])
    .index("by_clerk_user_id", ["clerk_user_id"]) // Additional index for clarity
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_plan", ["plan"]) // Index for quick plan lookups
    .index("by_created_at", ["created_at"]),

  clubs: defineTable({
    name: v.string(),
    categories: v.array(v.string()),
    amenities: v.optional(v.array(v.string())), // e.g., ["parking", "cafe", "3 courts"]
    number_of_courts: v.optional(v.number()), // Number of padel courts
    additional_features: v.optional(v.string()), // Additional features and amenities description
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
    facebook: v.optional(v.string()), // Facebook page URL
    instagram: v.optional(v.string()), // Instagram profile URL
    linkedin: v.optional(v.string()), // LinkedIn page URL
    twitter: v.optional(v.string()), // Twitter/X profile URL
    maps_url: v.optional(v.string()),
    booking_url: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    rating: v.optional(v.number()),
    rating_count: v.optional(v.number()),
    opening_hours_raw: v.optional(v.string()),
    image_url: v.optional(v.string()), // Header/hero image
    logo_url: v.optional(v.string()), // Club logo
    gallery_images: v.optional(v.array(v.string())), // Multiple photos for gallery
    description: v.optional(v.string()), // Club description
    slug: v.string(),
    status: v.union(v.literal("unclaimed"), v.literal("claimed")),
    owner_user_id: v.optional(v.id("users")), // Changed from string to id reference
    is_featured: v.boolean(),
    plan: v.union(v.literal("basic"), v.literal("business"), v.literal("featured")), // Subscription plan
  })
    .index("by_slug", ["slug"])
    .index("by_city", ["city"])
    .index("by_status", ["status"])
    .index("by_plan", ["plan"])
    .searchIndex("search_clubs", {
      searchField: "name",
      filterFields: ["city", "status"],
    }),

  leads: defineTable({
    club_id: v.id("clubs"),
    name: v.string(),
    email: v.string(),
    message: v.string(),
    created_at: v.number(),
  })
    .index("by_club", ["club_id"])
    .index("by_created", ["created_at"]),

  analytics_events: defineTable({
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
    created_at: v.number(),
    session_duration: v.optional(v.number()), // Time in milliseconds
    user_agent: v.optional(v.string()),
    referrer: v.optional(v.string()),
    is_owner: v.optional(v.boolean()), // Whether the event is from the club owner
  })
    .index("by_club", ["club_id"])
    .index("by_type", ["type"])
    .index("by_club_and_type", ["club_id", "type"]),

  club_submissions: defineTable({
    club_name: v.string(),
    city: v.string(),
    website: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
    created_at: v.number(),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("approved")
    ),
    notes: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_created", ["created_at"]),

  club_claims: defineTable({
    club_id: v.id("clubs"),
    user_id: v.optional(v.id("users")), // Optional to support legacy claims, but required for new claims
    club_name_snapshot: v.string(),
    club_city_snapshot: v.optional(v.string()),
    claimant_name: v.string(),
    claimant_email: v.string(),
    claimant_role: v.string(),
    message: v.string(),
    created_at: v.number(),
    status: v.union(
      v.literal("new"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    notes: v.optional(v.string()),
  })
    .index("by_club", ["club_id"])
    .index("by_user", ["user_id"])
    .index("by_status", ["status"])
    .index("by_created", ["created_at"]),

  subscriptions: defineTable({
    owner_user_id: v.id("users"),
    club_id: v.optional(v.id("clubs")), // Optional - subscriptions are now user-based, not club-based
    // Clerk billing fields (primary - Clerk handles payment processing internally)
    clerk_customer_id: v.string(), // Clerk customer ID (required)
    clerk_subscription_id: v.string(), // Clerk subscription ID (required)
    clerk_price_id: v.optional(v.string()), // Clerk price ID for the plan
    // Legacy fields kept for migration purposes (not actively used)
    stripe_customer_id: v.optional(v.string()), // Legacy field (not used with Clerk Billing)
    stripe_subscription_id: v.optional(v.string()), // Legacy field (not used with Clerk Billing)
    stripe_price_id: v.optional(v.string()), // Legacy field (not used with Clerk Billing)
    // Plan and status
    plan: v.union(v.literal("basic"), v.literal("business"), v.literal("featured")), // Which plan is active
    status: v.union(
      v.literal("incomplete"), // Payment not completed
      v.literal("active"), // Active subscription
      v.literal("trialing"), // In trial period
      v.literal("past_due"), // Payment failed
      v.literal("canceled"), // Canceled
      v.literal("incomplete_expired"), // Checkout expired
      v.literal("upcoming") // Scheduled plan change (will activate at period end)
    ),
    current_period_end: v.optional(v.number()), // Timestamp when current period ends (null for basic/canceled)
    cancel_at_period_end: v.optional(v.boolean()), // Will cancel at period end (default false)
    scheduled_plan: v.optional(v.union(v.literal("basic"), v.literal("business"), v.literal("featured"))), // Plan that will be active after current_period_end (for downgrades)
    scheduled_at_period_end: v.optional(v.number()), // When the scheduled plan will activate (usually same as current_period_end) - alias for scheduled_plan_activation_date
    scheduled_plan_activation_date: v.optional(v.number()), // When the scheduled plan will activate (kept for backward compatibility)
    // Timestamps
    created_at: v.number(),
    updated_at: v.optional(v.number()), // Last update timestamp (optional for legacy records)
  })
    .index("by_owner", ["owner_user_id"])
    .index("by_club", ["club_id"])
    .index("by_status", ["status"])
    .index("by_clerk_subscription_id", ["clerk_subscription_id"])
    .index("by_clerk_customer_id", ["clerk_customer_id"])
    .index("by_stripe_subscription_id", ["stripe_subscription_id"]) // Legacy index
    .index("by_stripe_customer_id", ["stripe_customer_id"]), // Legacy index
});

