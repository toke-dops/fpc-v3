# Pexels API Integration

This project uses the Pexels API to fetch royalty-free images for club listings.

## Setup

1. Get your Pexels API key:
   - Sign up at https://www.pexels.com/api/
   - Request an API key from your account dashboard
   - The API is free with limits: 200 requests/hour, 20,000 requests/month

2. Add your API key to environment variables:
   - Create or update `.env.local`:
   ```
   PEXELS_API_KEY=your_api_key_here
   ```

3. The API key is used server-side in:
   - `app/api/pexels-image/route.ts` - API route for fetching images
   - `lib/pexels-images.ts` - Utility functions for image URLs

## How It Works

### Client-Side (Direct URLs)
For client-side components, we use direct Pexels image URLs with deterministic selection based on club slug:
- `getPexelsImageDirect(slug, width, height)` - Returns a direct Pexels image URL
- Uses a hash of the club slug to select from a curated list of photo IDs
- Ensures the same club always gets the same image

### Server-Side (API Route)
For better image selection, use the API route:
- `/api/pexels-image?query=padel&width=400&height=300&index=0`
- Fetches images from Pexels API server-side
- Returns JSON with image URL and photographer attribution
- Cached by Next.js for performance

## Usage

```typescript
import { getPexelsImageDirect } from "@/lib/pexels-images";

// In a component
const imageUrl = getPexelsImageDirect(club.slug, 400, 300);
```

## Attribution

Pexels requires attribution when using their images. The API route returns photographer information that should be displayed:

```typescript
const response = await fetch('/api/pexels-image?query=padel');
const { url, photographer, photographer_url } = await response.json();
// Display: "Photo by {photographer} on Pexels"
```

## Rate Limits

- Default: 200 requests/hour, 20,000 requests/month
- For higher limits, contact Pexels support
- The direct URL method doesn't count against API limits

## Documentation

- Pexels API Docs: https://www.pexels.com/api/documentation/
- Search examples: https://www.pexels.com/search/padel/

