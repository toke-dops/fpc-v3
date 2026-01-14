# How to Import Clubs to Production Convex

## Overview

After deploying to Vercel, your production Convex deployment is empty. You need to import the clubs from your CSV file into your **production** Convex deployment.

## Important: Dev vs Production

**Convex dev and production databases are separate!** You cannot directly "copy" data from dev to prod. Instead, you need to:

1. Run the import script **locally** (from your machine)
2. Point it at your **production** Convex URL
3. The script will import all clubs from the CSV file

## Step-by-Step Instructions

### Step 1: Get Your Production Convex URL

Your production Convex URL should be in your `.env.local` file or Vercel environment variables. It looks like:
```
https://blessed-clownfish-908.convex.cloud
```

From your deployment, your URL is: `https://blessed-clownfish-908.convex.cloud`

### Step 2: Set Environment Variable

Make sure your `.env.local` file has the production Convex URL:

```env
NEXT_PUBLIC_CONVEX_URL=https://blessed-clownfish-908.convex.cloud
CONVEX_URL=https://blessed-clownfish-908.convex.cloud
```

**Note**: The import script uses `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL` from `.env.local`.

### Step 3: Fix Platform Mismatch (if needed)

If you get the esbuild error (Linux vs Windows platform mismatch), run:

```bash
npm install
```

This will reinstall dependencies for your current platform.

### Step 4: Run the Import Script

From your local machine, run:

```bash
npm run import:csv
```

This will:
- Read the CSV file from `data/fpc-results-v4.csv`
- Filter to UK clubs only
- Clear existing clubs in production (if any)
- Import all clubs in batches of 50
- Show progress as it imports

### Step 5: Verify

After the import completes:
1. Check your production app - clubs should appear
2. Check Convex Dashboard → Data → clubs table
3. You should see all the imported clubs

## Alternative: Import via Convex Dashboard (Manual)

If the script doesn't work, you can:
1. Go to Convex Dashboard → Data → clubs
2. Manually add clubs one by one (not recommended for large datasets)

## Using Dev Database Data

**You cannot directly copy dev database to production**, but you can:

1. **Export from dev** (if Convex supports it - check Dashboard)
2. **Re-import to production** using the same script
3. Or **run the import script twice** - once against dev, once against prod

The recommended approach is to run the import script against production since you have the CSV file.

## Troubleshooting

### Error: "CONVEX_URL environment variable is not set"

**Fix**: Make sure `.env.local` contains:
```
NEXT_PUBLIC_CONVEX_URL=https://blessed-clownfish-908.convex.cloud
```

### Error: esbuild platform mismatch

**Fix**: Run `npm install` to reinstall dependencies for your platform.

### Import is slow

**Normal**: The script imports in batches of 50. For hundreds of clubs, this can take a few minutes.

### Some clubs failed to import

Check the error output. Common issues:
- Duplicate slugs (script handles this automatically)
- Invalid data in CSV
- Network issues (retry the import)

## Summary

1. ✅ Make sure `.env.local` has your production Convex URL
2. ✅ Fix any platform/dependency issues (`npm install` if needed)
3. ✅ Run `npm run import:csv`
4. ✅ Verify clubs appear in your production app

The import script connects to whatever Convex URL is in your `.env.local` file, so make sure it's set to your **production** URL, not dev!

