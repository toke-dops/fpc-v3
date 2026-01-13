// Route segment config - MUST be at the top
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";

/**
 * DEPRECATED: This endpoint is no longer used.
 * We're using Clerk Billing which handles payments internally.
 * 
 * Subscription data is now managed via:
 * - Clerk webhooks → Convex (app/api/billing/webhook)
 * - Convex queries (api.subscriptions.getMySubscriptions)
 * 
 * This endpoint is kept for backward compatibility but returns empty data.
 */
export async function GET(request: NextRequest) {
  console.warn("⚠️ DEPRECATED: /api/billing/clerk-subscriptions called. Use Convex queries instead.");
  
  return NextResponse.json({ 
    subscription: null,
    subscriptions: [],
    error: "This endpoint is deprecated. Use Convex queries (api.subscriptions.getMySubscriptions) instead.",
    deprecated: true,
  });
}
