# Vercel Deployment Fixes

## Issue 1: Build Error - Route Being Statically Generated ✅ FIXED

**Error:** `Route /api/billing/subscription couldn't be rendered statically because it used headers`

**Fix Applied:**
- Moved route segment config (`export const dynamic = 'force-dynamic'`) to the **top of the file** (before imports)
- Added the same config to the deprecated `clerk-subscriptions` route
- This ensures Next.js recognizes these routes as dynamic during the build phase

**Files Changed:**
- `app/api/billing/subscription/route.ts`
- `app/api/billing/clerk-subscriptions/route.ts`

**Status:** ✅ Fixed - Redeploy to Vercel to see the changes

---

## Issue 2: Convex Authentication Error ⚠️ ACTION REQUIRED

**Error:** `[CONVEX Q(users:getCurrentUser)] [Request ID: ...] Server Error`

**Root Cause:**
This error means Convex cannot authenticate users from Clerk. The authentication chain is broken because:
1. `CLERK_JWT_ISSUER_DOMAIN` is not set in Convex Dashboard, OR
2. JWT template "convex" is not created in Clerk Dashboard, OR
3. The issuer domain doesn't match between Clerk and Convex

**Steps to Fix:**

### Step 1: Configure Clerk JWT Template

1. Go to **Clerk Dashboard** → **JWT Templates**
2. Click **"New template"** or find existing "convex" template
3. Name it exactly: **"convex"** (lowercase)
4. Configure:
   - **Signing Algorithm**: RS256
   - **Token Lifetime**: 1 hour (or as needed)
   - **Claims**: Include `sub`, `email`, `name`

### Step 2: Set Environment Variable in Convex Dashboard

1. Go to **Convex Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Click **"Add variable"**
3. Add:
   - **Name**: `CLERK_JWT_ISSUER_DOMAIN`
   - **Value**: Your Clerk JWT issuer domain
   
   To find your issuer domain:
   - Go to **Clerk Dashboard** → **API Keys**
   - Look for "JWT Issuer" - it should look like:
     `https://your-app.clerk.accounts.dev`
   - OR check your Clerk configuration for the issuer URL

### Step 3: Verify Vercel Environment Variables

Ensure these are set in **Vercel** → **Settings** → **Environment Variables**:

- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- ✅ `CLERK_SECRET_KEY`
- ✅ `CLERK_JWT_ISSUER_DOMAIN` (same value as in Convex)
- ✅ `NEXT_PUBLIC_CONVEX_URL`
- ✅ `CONVEX_DEPLOY_KEY`

### Step 4: Restart/Redeploy

1. **If using local Convex dev**: Restart `npx convex dev` after adding the environment variable
2. **For production**: Redeploy your Vercel application after setting all environment variables

### Step 5: Test

After configuration:
1. Sign in to your application
2. Check browser console - the error should be gone
3. Check Convex Dashboard → Logs for any authentication errors

**Status:** ⚠️ Waiting for configuration - Follow steps above

---

## Quick Checklist

Before redeploying to Vercel, verify:

- [ ] `CLERK_JWT_ISSUER_DOMAIN` is set in **Convex Dashboard** → Settings → Environment Variables
- [ ] JWT template "convex" exists in **Clerk Dashboard** → JWT Templates
- [ ] All environment variables are set in **Vercel** → Settings → Environment Variables
- [ ] Code changes have been committed and pushed
- [ ] Redeploy on Vercel

---

## Debugging

If the Convex error persists after configuration:

1. **Check Convex Logs**: Go to Convex Dashboard → Logs to see detailed error messages
2. **Use Debug Query**: In your app, you can use `api.debug.debugAuth` to see authentication status
3. **Verify Issuer Domain**: Ensure the issuer domain in Convex exactly matches the one from Clerk (including `https://`)

The error handling in `convex/users.ts` will now return `null` instead of crashing, which prevents the UI from breaking, but you'll still see the error in the console until authentication is properly configured.

