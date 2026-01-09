# Production Deployment Checklist for Find Padel Clubs

## Pre-Deployment SEO & Production Readiness

### ✅ Completed

1. **SEO Foundation**
   - ✅ Central SEO utility module (`lib/seo.ts`)
   - ✅ Production domain configuration (`https://findpadelclubs.co.uk`)
   - ✅ Robots.txt configured (`app/robots.ts`)
   - ✅ Sitemap structure created (`app/sitemap.ts`)
   - ✅ Root layout with production metadata
   - ✅ WebSite JSON-LD schema injected

2. **Structured Data**
   - ✅ Club JSON-LD schema generator
   - ✅ Breadcrumb schema generator
   - ✅ Article schema generator (for future blog)
   - ✅ JSON-LD injected into club detail pages

3. **Static Pages**
   - ✅ Privacy Policy (`/privacy-policy`)
   - ✅ Terms of Service (`/terms-of-service`)
   - ✅ Pricing (`/pricing`)
   - ✅ For Club Owners (`/for-club-owners`)
   - ✅ About page exists
   - ✅ Contact page exists

4. **AdSense/Mediavine Ready**
   - ✅ Ad slot component created (`components/ads/ad-slot.tsx`)
   - ✅ Development mode placeholders
   - ✅ Production-ready ad rendering

5. **Performance**
   - ✅ Next.js Image optimization
   - ✅ Dynamic imports for heavy components
   - ✅ Compression and minification enabled
   - ✅ Mobile-first responsive design

---

## ⚠️ Remaining Tasks

### Priority 1: Critical SEO Fixes

#### 1. Enhance Sitemap with Dynamic URLs

**File:** `app/sitemap.ts`

**Current:** Static pages only
**Required:** Add dynamic club and city URLs

**Implementation:**
```typescript
// Option 1: Use Convex HTTP action
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  
  // Fetch all clubs
  const clubs = await client.query(api.clubs.list, {});
  const clubPages = clubs.map(club => ({
    url: getCanonicalUrl(`/clubs/${club.slug}`), // Update when routes refactored
    lastModified: new Date(club._creationTime),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  // Fetch all cities
  const cities = await client.query(api.clubs.getCities, {});
  const cityPages = cities.map(city => ({
    url: getCanonicalUrl(`/city/${city.slug}`), // Update when routes refactored
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // Combine static and dynamic
  return [...staticPages, ...clubPages, ...cityPages];
}
```

#### 2. Add Metadata to Dynamic Pages

**Club Detail Pages:**
- ✅ JSON-LD added
- ⚠️ Metadata export needs enhancement

**Option A:** Keep current client component structure, metadata handled in layout.tsx
**Option B:** Convert to server component with generateMetadata (recommended for full SEO)

**City Pages:**
- ⚠️ Need metadata export
- ⚠️ Need JSON-LD breadcrumb

**Directory Page:**
- ✅ Layout with metadata created
- ✅ Ready to use

#### 3. Route Refactoring (Optional but Recommended)

**Decision:** Keep current routes OR refactor to `/padel-clubs/[city]/[slug]`

**If keeping current routes:**
- Update breadcrumb URLs in JSON-LD
- Update sitemap URLs
- Update internal links

**If refactoring:**
- Create new route structure
- Add redirects from old routes
- Update all internal links
- Update Convex slug generation

**Recommendation:** For faster deployment, keep current routes and update internal links/breadcrumbs.

---

### Priority 2: Content Enhancement

#### 1. Add Intro Paragraphs

**Directory Page (`app/clubs/page.tsx`):**
- Add H1: "Padel Clubs Directory"
- Add intro paragraph (2-3 sentences)

**City Page (`app/city/[citySlug]/page.tsx`):**
- Verify H1: "Padel Clubs in [City]"
- Add intro paragraph mentioning city, padel scene, etc.

#### 2. Internal Linking

**From Club Pages:**
- Link to city page: `/city/[citySlug]` or `/padel-clubs/[city]`
- Link to directory: `/clubs` or `/padel-clubs`

**From City Pages:**
- Link all clubs listed
- Link to main directory

**From Homepage:**
- Link to top cities (already done in city section)
- Link to key guides (when blog exists)

#### 3. Heading Structure

Verify single H1 per page:
- ✅ Homepage: "Find Your Perfect Padel Court"
- ✅ Club pages: Club name
- ⚠️ City pages: Verify H1
- ⚠️ Directory page: Add H1

---

### Priority 3: Performance Optimization

#### 1. Image Optimization
- ✅ Next.js Image component used
- ✅ Alt text added to club images
- ⚠️ Verify all images have descriptive alt text

#### 2. JavaScript Bundle
- ✅ Dynamic imports for maps
- ⚠️ Audit bundle size (run `npm run build` and check)
- ⚠️ Remove unused dependencies
- ⚠️ Consider code splitting for large components

#### 3. Core Web Vitals
- ✅ Fixed image dimensions where possible
- ⚠️ Add dimension placeholders for ad slots
- ⚠️ Defer non-critical JavaScript
- ⚠️ Minimize layout shift

**Testing:**
```bash
# Run Lighthouse audit
npm run build
npm run start
# Open in browser and run Lighthouse
```

---

### Priority 4: AdSense Setup

#### 1. Get AdSense Account
- Apply for Google AdSense
- Get publisher ID: `ca-pub-XXXXXXXXXX`

#### 2. Update Ad Slot Component

**File:** `components/ads/ad-slot.tsx`

Replace placeholder:
```typescript
data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
```

With your actual publisher ID:
```typescript
data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
```

#### 3. Add AdSense Script

**File:** `app/layout.tsx`

Add to `<head>`:
```tsx
{process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && (
  <script
    async
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
    crossOrigin="anonymous"
  />
)}
```

#### 4. Place Ad Slots

**Recommended positions:**
1. **Above content** (after header on directory/club pages)
2. **In-content** (after first section on club pages)
3. **Sidebar** (desktop only, if sidebar exists)
4. **Below content** (before footer)

**Example:**
```tsx
import { AdSlot } from "@/components/ads/ad-slot";

// In your page component:
<div className="container mx-auto">
  <AdSlot 
    id="above-content"
    slot="1234567890"
    format="auto"
    className="mb-8"
  />
  {/* Your content */}
</div>
```

---

## Environment Variables

### Production `.env.production`

```env
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://findpadelclubs.co.uk
NODE_ENV=production

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=...

# AdSense (when approved)
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-...

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-...
```

---

## Deployment Steps

### 1. Pre-Deployment Checks

```bash
# Install dependencies
npm install

# Type check
npm run build

# Check for errors
npm run lint

# Test locally
npm run start
```

### 2. Build for Production

```bash
npm run build
```

**Verify:**
- Build completes without errors
- All routes generate correctly
- Sitemap is accessible at `/sitemap.xml`
- Robots.txt is accessible at `/robots.txt`

### 3. Deploy to Production

**Vercel (Recommended for Next.js):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or connect GitHub repo to Vercel dashboard
```

**Other Platforms:**
- Follow platform-specific Next.js deployment guides
- Ensure Node.js 18+ is supported
- Configure environment variables

### 4. Post-Deployment

**Submit to Search Engines:**
1. Google Search Console:
   - Add property: `https://findpadelclubs.co.uk`
   - Submit sitemap: `https://findpadelclubs.co.uk/sitemap.xml`
   - Request indexing for key pages

2. Bing Webmaster Tools:
   - Add site
   - Submit sitemap

**Verify:**
- ✅ All pages load correctly
- ✅ Metadata renders in page source
- ✅ JSON-LD validates (use Google Rich Results Test)
- ✅ Sitemap.xml accessible
- ✅ Robots.txt accessible
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Performance score (Lighthouse)

---

## Testing Checklist

### SEO Testing

- [ ] All pages have unique, descriptive titles
- [ ] All pages have meta descriptions (150-160 chars)
- [ ] Canonical URLs use production domain
- [ ] Open Graph tags render correctly
- [ ] Twitter cards render correctly
- [ ] JSON-LD validates (Google Rich Results Test)
- [ ] Sitemap includes all pages
- [ ] Robots.txt configured correctly
- [ ] No duplicate content issues
- [ ] Internal linking structure in place

### Performance Testing

- [ ] Lighthouse SEO score > 90
- [ ] Lighthouse Performance score > 80
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Mobile-friendly test passes
- [ ] PageSpeed Insights green scores

### Functionality Testing

- [ ] All routes work correctly
- [ ] Search functionality works
- [ ] Filters work correctly
- [ ] Club detail pages load
- [ ] Contact forms submit
- [ ] Authentication works
- [ ] Owner dashboard accessible
- [ ] Image optimization works

---

## Quick Wins (Can be done immediately)

1. **Update Homepage H1**
   - Current: "Find Your Perfect Padel Court"
   - Target: "Find Padel Clubs & Pickleball Courts Near You"

2. **Add Directory H1**
   - File: `app/clubs/page.tsx`
   - Add: `<h1>Padel Clubs Directory</h1>`

3. **Verify City Page H1**
   - File: `app/city/[citySlug]/page.tsx`
   - Ensure: `<h1>Padel Clubs in {cityName}</h1>`

4. **Add Internal Links**
   - Club pages → Link to city page
   - City pages → Link to directory

5. **Enhance Sitemap**
   - Add dynamic club URLs (when Convex integration ready)

---

## Support & Resources

- **SEO Guide:** See `SEO_IMPLEMENTATION_GUIDE.md`
- **Next.js Metadata Docs:** https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- **Schema.org Docs:** https://schema.org/
- **Google Search Console:** https://search.google.com/search-console
- **Rich Results Test:** https://search.google.com/test/rich-results

---

## Summary

**Completed:** ~80% of SEO foundation
**Remaining:** Dynamic sitemap enhancement, metadata refinements, internal linking, AdSense setup

**Estimated Time to Production-Ready:** 2-3 hours for remaining tasks

**Ready for:** Google Search Console submission, AdSense application (pending), deployment

