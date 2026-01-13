# Docker Environment Variables Setup Guide

This guide explains how to set environment variables for your Docker container.

## Quick Start

### Method 1: Using .env file (Recommended)

1. **Create a `.env` file** in your project root (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your actual values:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   # ... etc
   ```

3. **Run with docker-compose** (automatically loads .env):
   ```bash
   docker-compose up
   ```

4. **Or run with docker** (manually specify env file):
   ```bash
   docker build -t fpc-v3 .
   docker run --env-file .env -p 3000:3000 fpc-v3
   ```

### Method 2: Using -e flags (Command Line)

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud \
  -e CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx \
  -e CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev \
  -e NEXT_PUBLIC_SITE_URL=https://yourdomain.com \
  -e RESEND_API_KEY=re_xxxxxxxxxxxxx \
  -e ADMIN_PASSWORD_HASH=$2b$10$... \
  fpc-v3
```

### Method 3: Using docker-compose.yml

The `docker-compose.yml` file is already configured to read from `.env`. Just:

1. Create `.env` file with your variables
2. Run: `docker-compose up`

## Required Environment Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex database URL | Run `npx convex dev` or check Convex dashboard |
| `CONVEX_URL` | Same as above (for server-side) | Same as above |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | Clerk secret key | [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer domain | Format: `https://your-app.clerk.accounts.dev` |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (for webhooks) | Your production domain |
| `NEXT_PUBLIC_APP_URL` | Your app URL (for redirects) | Your production domain |
| `RESEND_API_KEY` | Resend API key for emails | [Resend Dashboard](https://resend.com/api-keys) |
| `ADMIN_PASSWORD_HASH` | Admin password hash | Generate with `npx tsx scripts/generate-password-hash.ts` |

## Optional Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID (format: `G-XXXXXXXXXX`) |
| `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` | Google AdSense Publisher ID (format: `ca-pub-XXXXXXXXXX`) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console verification code |

## For Spaceship Starlight Hyperlift

When deploying to Spaceship Starlight Hyperlift:

1. **In the Spaceship dashboard**, go to your project settings
2. **Navigate to Environment Variables** section
3. **Add each required variable** from the list above
4. **Set the values** for your production environment
5. **Redeploy** your application

The Dockerfile will automatically use these environment variables when the container starts.

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit `.env` files** to git (already in `.gitignore`)
2. **Use different values** for development and production
3. **Rotate secrets** regularly, especially if exposed
4. **Use secrets management** for production (e.g., Docker secrets, Kubernetes secrets, or cloud provider secret managers)

## Testing Your Setup

After setting up environment variables, test that they're loaded correctly:

```bash
# Build the image
docker build -t fpc-v3 .

# Run and check environment (this will show all env vars - be careful!)
docker run --env-file .env fpc-v3 env | grep NEXT_PUBLIC

# Or run the app
docker run --env-file .env -p 3000:3000 fpc-v3
```

## Troubleshooting

### "Environment variable not found" errors

- Check that your `.env` file is in the project root
- Verify variable names match exactly (case-sensitive)
- Ensure no extra spaces around `=` sign
- Restart the container after changing `.env`

### Webhooks not working

- Ensure `NEXT_PUBLIC_SITE_URL` is set to your actual domain (not localhost)
- Verify the URL is accessible from the internet
- Check that webhook endpoints are configured in Clerk/Stripe dashboards

### Database connection issues

- Verify `NEXT_PUBLIC_CONVEX_URL` is correct
- Check that your Convex deployment is active
- Ensure network connectivity from Docker container

