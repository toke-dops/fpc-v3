# How to Create Admin User in Production

## Overview

To create an admin user in production, you need to:
1. Get your Clerk User ID from Clerk Dashboard
2. Run the sync script with the `admin` role
3. The script will create/update the user in Convex with admin role

## Step-by-Step Instructions

### Step 1: Get Your Clerk User ID

1. Go to **Clerk Dashboard**: https://dashboard.clerk.com
2. Select your application
3. Go to **Users** in the left sidebar
4. Find your user (the one you want to make admin)
5. Click on the user to open details
6. Copy the **User ID** (it starts with `user_`, e.g., `user_abc123xyz`)

### Step 2: Get Your User Details

You'll need:
- **Clerk User ID**: From step 1 (e.g., `user_abc123xyz`)
- **Email**: Your user's email address
- **Name**: Your user's name (e.g., "Admin User" or your name)

### Step 3: Run the Sync Script

From your local machine, run:

```bash
npm run sync:user <clerk_user_id> <email> <name> admin
```

**Example:**
```bash
npm run sync:user user_abc123xyz admin@example.com "Admin User" admin
```

Or directly with tsx:
```bash
npx tsx scripts/sync-clerk-user.ts user_abc123xyz admin@example.com "Admin User" admin
```

**Important Parameters:**
- First parameter: Clerk User ID (must start with `user_`)
- Second parameter: Email address
- Third parameter: Name (use quotes if it contains spaces)
- Fourth parameter: Role (`admin` or `club_owner`)

### Step 4: Verify

After running the script:
1. Check the output - it should show "User created" or "User updated"
2. Sign in to your production app
3. Go to `/admin` - you should have access
4. Check Convex Dashboard → Data → users table
5. Your user should have `role: "admin"`

## Important Notes

### About the Script

- The script uses your **production Convex URL** from `.env.local`
- It creates/updates the user in production Convex database
- If the user already exists, it will update them (but preserve admin role if they're already admin)
- The user must exist in Clerk first

### If User Doesn't Exist in Clerk

If you don't have a Clerk user yet:
1. Sign up/sign in to your production app first
2. This creates the user in Clerk
3. Then run the sync script to add them to Convex with admin role

### Making Existing User Admin

If your user already exists in Convex (but not as admin):
1. Run the sync script with `admin` role
2. The script will update the user's role to admin

### Multiple Admins

You can create multiple admin users by running the script for each user.

## Alternative: Via Convex Dashboard (Manual)

If the script doesn't work, you can manually update via Convex Dashboard:

1. Go to **Convex Dashboard** → **Data** → **users**
2. Find your user
3. Click **Edit**
4. Change `role` from `"club_owner"` to `"admin"`
5. Save

## Troubleshooting

### Error: "User ID must start with 'user_'"

**Fix**: Make sure you're using the Clerk User ID (starts with `user_`), not the Convex user ID.

### Error: "Role must be either 'club_owner' or 'admin'"

**Fix**: The role parameter must be exactly `admin` or `club_owner` (lowercase).

### Error: "NEXT_PUBLIC_CONVEX_URL is not set"

**Fix**: Make sure `.env.local` contains:
```
NEXT_PUBLIC_CONVEX_URL=https://blessed-clownfish-908.convex.cloud
```

### User Created But Not Admin

**Fix**: 
1. Check if you included `admin` as the 4th parameter
2. Run the script again with `admin` role
3. Or manually update via Convex Dashboard

### Script Runs But User Not Created

**Check**:
1. Is the Clerk User ID correct?
2. Does the user exist in Clerk Dashboard?
3. Check Convex Dashboard → Logs for errors

## Summary

1. ✅ Get Clerk User ID from Clerk Dashboard
2. ✅ Run: `npm run sync:user <user_id> <email> <name> admin`
3. ✅ Verify user has admin role in Convex Dashboard
4. ✅ Sign in and test admin access

The script connects to your production Convex deployment (from `.env.local`) and creates/updates the user with admin role.

