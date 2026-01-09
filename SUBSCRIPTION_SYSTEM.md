# Subscription System Implementation

## Overview

This document describes the subscription system that handles upgrades (immediate) and downgrades (scheduled) using Clerk Billing as the source of truth.

## Schema

The `subscriptions` collection includes:

```typescript
{
  plan: "basic" | "business" | "featured", // Current effective plan
  scheduled_plan: "basic" | "business" | "featured" | null, // Next plan after period end
  scheduled_at_period_end: number | null, // When scheduled plan activates
  scheduled_plan_activation_date: number | null, // Alias (backward compatibility)
  status: "active" | "incomplete" | "canceled" | "past_due" | "trialing" | "incomplete_expired",
  current_period_end: number | null,
  cancel_at_period_end: boolean,
}
```

## Key Functions

### `convex/subscription-sync.ts`

**`syncSubscriptionFromWebhook`** - Main webhook handler that:
- **Upgrades**: Immediately updates `plan`, clears `scheduled_plan`, updates clubs/users
- **Downgrades**: Keeps current `plan`, sets `scheduled_plan` and `scheduled_at_period_end`, does NOT update clubs/users
- **Period End**: When a scheduled plan activates, updates `plan` from `scheduled_plan` and clears scheduled fields

### `convex/subscription-helpers.ts`

**`getCurrentPlanForUser(userId)`** - Returns the current effective plan
**`getSubscriptionDisplayState()`** - Returns all subscription display data for dashboard

## Behavior

### Upgrades (Immediate)
- Examples: basic → business, basic → featured, business → featured
- Updates `plan` immediately
- Clears `scheduled_plan`
- Updates clubs and users immediately

### Downgrades (Scheduled)
- Examples: featured → business, featured → basic, business → basic
- Keeps current `plan` unchanged
- Sets `scheduled_plan` to the lower plan
- Sets `scheduled_at_period_end` to current period end
- Does NOT update clubs/users until period ends

### Period End Activation
- When `scheduled_at_period_end` is reached:
  - `plan` = `scheduled_plan`
  - `scheduled_plan` = null
  - `scheduled_at_period_end` = null
  - Updates clubs and users

## Dashboard Usage

The dashboard uses `getSubscriptionDisplayState()` to:
- Show current plan from `plan` field
- Show scheduled changes from `scheduled_plan` and `scheduled_at_period_end`
- Display: "You are on {plan} until {date}. Your plan will then change to {scheduled_plan}."

## Webhook Integration

The webhook handler in `app/api/billing/webhook/route.ts` calls `syncSubscriptionFromWebhook` with data from Clerk, which determines upgrade vs downgrade and handles accordingly.

