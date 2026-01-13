# Vercel Deployment Guide

## Environment Variables Required

Set these in your Vercel project settings (Settings → Environment Variables):

### Required Variables

1. **Clerk Authentication**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key (starts with `pk_`)
   - `CLERK_SECRET_KEY` - Your Clerk secret key (starts with `sk_`)
   - `CLERK_JWT_ISSUER_DOMAIN` - Your Clerk JWT issuer domain (e.g., `your-app.clerk.accounts.dev`)

2. **Convex Database**
   - `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL (e.g., `https://your-app.convex.cloud`)
   - `CONVEX_DEPLOY_KEY` - Your Convex deploy key (for codegen during build)

3. **Site URLs**
   - `NEXT_PUBLIC_SITE_URL` - Your production site URL (e.g., `https://findpadelclubs.co.uk`)
   - `NEXT_PUBLIC_APP_URL` - Same as above

### Optional Variables

- `RESEND_API_KEY` - For contact form emails
- `ADMIN_PASSWORD_HASH` - For admin authentication
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics
- `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` - Google AdSense
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` - Google Search Console verification

## Common Issues and Fixes

### 1. Build Error: "Route couldn't be rendered statically"

**Error:** `Dynamic server usage: Route /api/billing/subscription couldn't be rendered statically because it used headers.`

**Fix:** The route is now configured with:
- `export const dynamic = 'force-dynamic'`
- `export const runtime = 'nodejs'`
- `export const fetchCache = 'force-no-store'`
- `export const revalidate = 0`

If the error persists, ensure all API routes using `auth()` or `headers()` have these exports.

### 2. Clerk Loading from Wrong URL

**Error:** `Failed to load resource: net::ERR_NAME_NOT_RESOLVED` for `clerk.findpadelclubs.co.uk`

**Fix:** 
- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly in Vercel
- The `ClerkProvider` now explicitly uses the publishable key
- If you're using a custom Clerk domain, ensure it's configured correctly in your Clerk dashboard

### 3. Convex Connection Error

**Error:** `[CONVEX Q(users:getCurrentUser)] Server Error`

**Fix:**
- Ensure `NEXT_PUBLIC_CONVEX_URL` is set in Vercel
- Ensure `CONVEX_DEPLOY_KEY` is set for build-time codegen
- Verify your Convex deployment is active

### 4. Network Errors (ERR_NAME_NOT_RESOLVED, ERR_BLOCKED_BY_CLIENT)

- `ERR_BLOCKED_BY_CLIENT` for `adsbygoogle.js` - This is normal if you have an ad blocker
- `ERR_NAME_NOT_RESOLVED` - Usually means environment variables are missing or incorrect

## Build Configuration

The project uses:
- `output: 'standalone'` in `next.config.js` for optimized Docker builds
- `prebuild` script in `package.json` to run `convex codegen` before build
- `vercel.json` to configure build commands

## Deployment Steps

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set all required environment variables in Vercel dashboard
4. Deploy

The build should complete successfully once all environment variables are set.

