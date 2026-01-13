# Convex Authentication Setup Guide

## The Error

If you're seeing this error:
```
Error: [CONVEX Q(users:getCurrentUser)] [Request ID: ...] Server Error
```

This means Convex cannot authenticate the user from Clerk. The authentication chain is broken.

## Required Configuration

### 1. Clerk Dashboard Setup

1. Go to your Clerk Dashboard → JWT Templates
2. Create a new JWT Template named **"convex"** (exactly this name)
3. Configure it with:
   - **Token Lifetime**: 1 hour (or as needed)
   - **Signing Algorithm**: RS256
   - **Claims**: Include `sub`, `email`, `name` at minimum

### 2. Convex Dashboard Setup

1. Go to your Convex Dashboard → Settings → Environment Variables
2. Add the following environment variable:
   - **Name**: `CLERK_JWT_ISSUER_DOMAIN`
   - **Value**: Your Clerk JWT issuer domain (e.g., `https://your-app.clerk.accounts.dev`)
   
   To find your issuer domain:
   - Go to Clerk Dashboard → API Keys
   - Look for "JWT Issuer" or check your Clerk configuration
   - It should look like: `https://[your-app].clerk.accounts.dev`

### 3. Vercel Environment Variables

Make sure these are set in Vercel:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `CLERK_JWT_ISSUER_DOMAIN` - Same value as in Convex (e.g., `https://your-app.clerk.accounts.dev`)
- `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL

### 4. Verify Configuration

After setting up:

1. **Restart Convex**: If you're running `npx convex dev`, restart it after adding the environment variable
2. **Redeploy**: Redeploy your Vercel application
3. **Check Logs**: Check Convex Dashboard logs for authentication errors

## Common Issues

### Issue 1: "Server Error" from getCurrentUser

**Cause**: `CLERK_JWT_ISSUER_DOMAIN` is not set or incorrect in Convex Dashboard

**Fix**: 
- Set `CLERK_JWT_ISSUER_DOMAIN` in Convex Dashboard → Settings → Environment Variables
- Value should match your Clerk JWT issuer (e.g., `https://your-app.clerk.accounts.dev`)
- Restart Convex if running locally

### Issue 2: "Not authenticated" errors

**Cause**: JWT template "convex" is not created in Clerk

**Fix**:
- Go to Clerk Dashboard → JWT Templates
- Create a template named exactly **"convex"**
- Configure it with RS256 signing algorithm

### Issue 3: Token mismatch

**Cause**: The issuer domain in Convex doesn't match the one in Clerk

**Fix**:
- Verify `CLERK_JWT_ISSUER_DOMAIN` in Convex matches your Clerk configuration
- Check Clerk Dashboard → API Keys for the correct issuer domain

## Testing

After setup, test authentication:

1. Sign in to your application
2. Check browser console for errors
3. Check Convex Dashboard → Logs for authentication errors
4. The `getCurrentUser` query should return the user object, not null

## Debug Query

You can use the debug query in `convex/debug.ts`:

```typescript
const debug = useQuery(api.debug.debugAuth);
```

This will show:
- Whether authentication is working
- The identity subject from Clerk
- All users in the database
- Whether a matching user was found

