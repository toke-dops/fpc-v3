# Fix Subscription Sync Issue

## Problem
- Payment was successful in Clerk
- Subscription status shows "Basic" instead of "Business"
- User got redirected to home page (error occurred)

## Immediate Fix Steps

### Step 1: Check Webhook Logs
1. Go to your **server logs** (where you're running `npm run dev`)
2. Look for webhook events with:
   - `"=== WEBHOOK: Handling subscription update ==="`
   - `"=== PLAN DETECTION ==="`
   - `"Final plan determination:"`
3. Check for any error messages

### Step 2: Check Clerk Dashboard
1. Go to **Clerk Dashboard → Billing → Subscriptions**
2. Find your subscription
3. Check:
   - Subscription ID (copy it)
   - Status (should be "active")
   - Product/Plan name (should contain "business" or "Business")
4. Go to **Clerk Dashboard → Webhooks**
5. Check webhook delivery logs for `/api/billing/webhook`
6. Look for any failed deliveries

### Step 3: Manual Sync (Try This First)
1. Go to `/owner/subscriptions` page
2. Click the **"Sync from Clerk"** button (newly added)
3. This will check if subscription exists and try to sync
4. Refresh the page

### Step 4: Retrigger Webhook (If Manual Sync Doesn't Work)
1. Go to **Clerk Dashboard → Webhooks**
2. Find your webhook endpoint
3. Click on it to view details
4. Find the `subscription.created` or `subscription.updated` event
5. Click **"Retry"** or **"Resend"** to retrigger the webhook
6. Check server logs to see if it processes correctly

### Step 5: Check Plan Detection
The webhook now has improved logging. Check server logs for:
- `"=== PLAN DETECTION ==="`
- `"Subscription object keys:"`
- `"Subscription items array length:"`
- `"✅ Detected Business plan"` or `"⚠️ Could not detect plan"`

If you see `"⚠️ Could not detect plan"`, the issue is that Clerk's product name doesn't contain "business". 

**Fix:** In Clerk Dashboard → Billing → Products, ensure your Business plan product name contains the word "business" (case-insensitive).

## What I've Fixed

### 1. Improved Plan Detection (`app/api/billing/webhook/route.ts`)
- Added extensive logging for plan detection
- Checks multiple fields: `subscription.plan`, `items`, `product.name`, `product.id`, `price.id`, `item.name`
- Checks subscription `name`, `description`, and `metadata`
- Logs full subscription object for debugging

### 2. Added Manual Sync Button (`app/owner/subscriptions/page.tsx`)
- "Sync from Clerk" button to manually trigger sync check
- Helps if webhook didn't process

### 3. Improved Logging (`convex/subscriptions.ts`)
- Added detailed logging when creating/updating subscriptions
- Logs when applying plan to clubs
- Better error messages

### 4. Created Manual Sync Endpoint (`app/api/billing/manual-sync/route.ts`)
- Can check subscription status
- Can verify if subscription exists in Convex

## Next Steps

1. **Click "Sync from Clerk" button** on `/owner/subscriptions` page
2. **Check server logs** for webhook processing
3. **Verify product name in Clerk** contains "business"
4. **Retrigger webhook** from Clerk Dashboard if needed
5. **Check subscription in Convex** - should show plan as "business"

## If Still Not Working

1. **Check Clerk Product Name:**
   - Go to Clerk Dashboard → Billing → Products
   - Your Business plan product name MUST contain "business" (case-insensitive)
   - If it's named something else, either:
     - Rename it to include "business", OR
     - Update the webhook code to detect your specific product name

2. **Check Webhook URL:**
   - Ensure webhook URL is correct: `https://yourdomain.com/api/billing/webhook`
   - Webhook must be accessible from internet

3. **Check User Sync:**
   - Ensure you're logged into the application
   - User must exist in Convex (check `/owner/dashboard` - if it loads, user exists)

4. **Manual Fix (Last Resort):**
   - If webhook keeps failing, you can manually update the subscription in Convex Dashboard
   - Find the subscription record
   - Update `plan` field to `"business"`
   - Update `status` field to `"active"` (if not already)
   - Update all your clubs' `plan` field to `"business"`

## Debug Information Needed

If issue persists, collect:
1. Server logs showing webhook processing
2. Clerk Dashboard subscription details (screenshot)
3. Clerk product name (exact name)
4. Convex subscription record (if exists)
5. Browser console errors (if any)

