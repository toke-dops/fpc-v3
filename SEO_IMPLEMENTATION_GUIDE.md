# SEO & Production Optimization Implementation Guide

## Overview

This guide documents the complete SEO and production optimization implementation for Find Padel Clubs (findpadelclubs.co.uk). All code follows Next.js 14 App Router conventions and TypeScript best practices.

---

## 1. Domain & Routing Setup ✅

### Production Domain Configuration

**Current Status:**
- ✅ Production domain: `https://findpadelclubs.co.uk`
- ✅ Canonical URLs configured via `lib/seo.ts`
- ✅ `next.config.js` updated with production settings
- ✅ `app/layout.tsx` uses production domain for metadata

### Environment Variables

Create/update `.env.production`:
```env
NEXT_PUBLIC_SITE_URL=https://findpadelclubs.co.uk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
CONVEX_URL=your_convex_url
```

---

## 2. URL Slug Strategy

### Current Route Structure

**Existing Routes:**
- `/` - Homepage
- `/clubs` - Directory listing
- `/clubs/[slug]` - Individual club (needs refactoring to `/padel-clubs/[city]/[slug]`)
- `/city/[citySlug]` - City directory (needs refactoring to `/padel-clubs/[city]`)
- `/about` - About page
- `/contact` - Contact page
- `/list-your-club` - Submission page (needs renaming to `/for-club-owners`)
- `/sign-up-club-owner` - Owner registration

**Recommended New Structure:**

```
/
├── /padel-clubs (directory index)
│   ├── /[city-slug] (e.g., /padel-clubs/london)
│   │   └── /[club-slug] (e.g., /padel-clubs/london/greenwich-padel-club)
├── /pickleball-clubs (future - if needed)
├── /about
├── /contact
├── /for-club-owners (renamed from /list-your-club)
├── /pricing (new)
├── /privacy-policy (new)
├── /terms-of-service (new)
└── /blog (future)
    └── /[slug]
```

### Slug Generation Rules

**Implemented in `lib/seo.ts`:**
- Lowercase conversion
- Hyphen-separated
- Special characters removed
- Multiple hyphens collapsed
- Max length: 100 characters
- Stop-word removal (optional enhancement)

**Slug Patterns:**
- Club: `club-name-city` (e.g., `greenwich-padel-club-london`)
- City: `city-name` (e.g., `london`, `manchester`)
- Blog: `blog-post-title` (e.g., `how-to-find-padel-clubs-near-you`)

---

## 3. SEO Metadata Implementation ✅

### Central SEO Module: `lib/seo.ts`

**Functions Available:**
- `getHomeMetadata()` - Homepage metadata
- `getDirectoryMetadata()` - Directory index metadata
- `getCityMetadata(cityName, clubCount)` - City page metadata
- `getClubMetadata(clubName, city, description, rating, courtCount)` - Club page metadata
- `getStaticPageMetadata(page, title, description)` - Static page metadata

### Page Metadata Examples

#### Homepage (`app/page.tsx`)
**Status:** ⚠️ Needs conversion to server component for metadata export

**Implementation:**
```typescript
// Currently a client component - needs refactoring
// Option 1: Extract metadata to layout.tsx for this route
// Option 2: Convert to server component and use Suspense for client parts
```

#### Directory Page (`app/clubs/page.tsx`)
**Status:** ⚠️ Needs metadata export

**Required:**
1. Convert to server component OR
2. Create `app/clubs/layout.tsx` with metadata export

#### Club Detail Page (`app/clubs/[slug]/page.tsx`)
**Status:** ⚠️ Needs metadata export and JSON-LD

**Required Implementation:**
```typescript
// Option: Create app/clubs/[slug]/layout.tsx with generateMetadata
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const club = await getClubBySlug(params.slug);
  if (!club) return { title: "Club Not Found" };
  
  return getClubMetadata(
    club.name,
    club.city,
    club.description,
    club.rating,
    club.number_of_courts
  );
}
```

**Also add JSON-LD:**
```tsx
import { JsonLd } from "@/components/json-ld";
import { generateClubSchema } from "@/lib/seo";

// In component:
<JsonLd data={generateClubSchema(club)} />
```

---

## 4. Schema.org Structured Data ✅

### Implemented Schemas

**1. WebSite Schema** (Homepage)
- ✅ Implemented in `app/layout.tsx`
- Includes search action for `/padel-clubs?search=`

**2. LocalBusiness/SportsActivityLocation** (Club pages)
- ✅ Function: `generateClubSchema()` in `lib/seo.ts`
- ⚠️ Not yet injected into club detail pages

**3. BreadcrumbList** (All pages)
- ✅ Function: `generateBreadcrumbSchema()` in `lib/seo.ts`
- ⚠️ Not yet used

**4. Article** (Blog posts - future)
- ✅ Function: `generateArticleSchema()` in `lib/seo.ts`
- Ready for blog implementation

### Implementation Status

**Homepage:** ✅ JSON-LD injected
**Club Pages:** ⚠️ Needs JSON-LD injection
**City Pages:** ⚠️ Needs JSON-LD (BreadcrumbList)
**Static Pages:** ⚠️ Needs JSON-LD (BreadcrumbList)

---

## 5. Content & On-Page Structure

### Heading Hierarchy

**Current Status:**
- ✅ Homepage has proper H1: "Find Your Perfect Padel Court"
- ✅ Club pages have H1: Club name
- ⚠️ City pages need proper H1 structure
- ⚠️ Need to verify single H1 per page

### Required Updates

**1. Club Detail Page (`app/clubs/[slug]/page.tsx`):**
- ✅ H1 exists: Club name
- ✅ H2 sections: "About the Club", "Features & Amenities", etc.
- ✅ Number of courts displayed
- ✅ Additional features displayed
- ⚠️ Needs internal links to city page

**2. City Page (`app/city/[citySlug]/page.tsx`):**
- ⚠️ Needs proper H1: "Padel Clubs in [City]"
- ⚠️ Needs intro paragraph
- ⚠️ Needs internal linking to clubs

**3. Directory Page (`app/clubs/page.tsx`):**
- ⚠️ Needs proper H1: "Padel Clubs Directory"
- ⚠️ Needs intro paragraph

### Internal Linking Strategy

**From Homepage → Link to:**
- Top cities (London, Manchester, etc.)
- Key guides (if blog exists)

**From Club Pages → Link to:**
- City directory page: `/padel-clubs/[city]`
- Main directory: `/padel-clubs`

**From City Pages → Link to:**
- All clubs in that city
- Main directory: `/padel-clubs`

---

## 6. Mobile-First & Performance

### Current Status

**Performance Optimizations:**
- ✅ Next.js Image optimization enabled
- ✅ Dynamic imports for heavy components (maps)
- ✅ Font optimization enabled
- ✅ Compression enabled
- ✅ SWC minification enabled

**Mobile Optimizations:**
- ✅ Responsive layouts throughout
- ✅ Mobile-first CSS approach
- ✅ Touch-friendly buttons and spacing

### Core Web Vitals Checklist

**LCP (Largest Contentful Paint):**
- ✅ Images use Next.js Image component
- ✅ Priority loading for hero images
- ⚠️ Consider lazy loading below-fold images

**FID (First Input Delay):**
- ✅ Code splitting with dynamic imports
- ⚠️ Review JavaScript bundle size

**CLS (Cumulative Layout Shift):**
- ✅ Fixed image dimensions where possible
- ⚠️ Ad slots need dimension placeholders
- ⚠️ Defer non-critical JavaScript

---

## 7. AdSense/Mediavine Readiness ✅

### Ad Slot Component

**Created:** `components/ads/ad-slot.tsx`

**Features:**
- ✅ Development mode placeholder (shows ad slot position)
- ✅ Production mode renders actual ads
- ✅ Supports Google AdSense and Mediavine
- ✅ Lazy loading strategy

### Ad Placement Strategy

**Recommended Positions:**
1. **Above content** (after header, before main content)
2. **In-content** (after first section)
3. **Sidebar** (desktop only, if sidebar exists)
4. **Below content** (before footer)

**Implementation Example:**
```tsx
import { AdSlot } from "@/components/ads/ad-slot";

// In your page:
<AdSlot 
  id="above-content" 
  slot="1234567890" 
  format="auto"
  className="mb-8"
/>
```

### Required Pages for Approval

**✅ Created:**
- `/privacy-policy` - Includes cookie/ad information
- `/terms-of-service` - Legal terms

**✅ Already Exists:**
- `/contact` - Contact form/email

**Policy Compliance:**
- ✅ No scraped content
- ✅ Original, helpful content
- ✅ No pop-ups or aggressive interstitials
- ✅ Fast, readable pages

---

## 8. Technical SEO ✅

### Sitemap

**Created:** `app/sitemap.ts`

**Current Status:**
- ✅ Basic structure with static pages
- ⚠️ Needs dynamic club and city pages

**Enhancement Required:**
```typescript
// In app/sitemap.ts, add:
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all clubs and cities from Convex
  const clubs = await preloadQuery(api.clubs.list, {});
  const cities = await preloadQuery(api.clubs.getCities, {});
  
  // Generate dynamic URLs
  const clubPages = clubs.map(club => ({
    url: `${baseUrl}/padel-clubs/${club.citySlug}/${club.slug}`,
    lastModified: club.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  // ... (rest of implementation)
}
```

### Robots.txt

**Created:** `app/robots.ts`

**Current Configuration:**
- ✅ Allows all public pages
- ✅ Disallows admin, owner, API routes
- ✅ References sitemap.xml
- ✅ Special rules for Googlebot/Bingbot

**Accessible at:** `/robots.txt`

---

## 9. Implementation Checklist

### Immediate Actions Required

**Priority 1 - Critical SEO:**
- [ ] Refactor routing: `/clubs/[slug]` → `/padel-clubs/[city]/[club-slug]`
- [ ] Add metadata exports to all page types
- [ ] Inject JSON-LD into club detail pages
- [ ] Enhance sitemap with dynamic club/city URLs
- [ ] Add breadcrumb navigation and JSON-LD

**Priority 2 - Content Optimization:**
- [ ] Add intro paragraphs to directory and city pages
- [ ] Implement internal linking strategy
- [ ] Verify single H1 per page
- [ ] Add alt text to all images (if missing)

**Priority 3 - Performance:**
- [ ] Audit and optimize JavaScript bundles
- [ ] Implement lazy loading for below-fold content
- [ ] Add dimension placeholders for ad slots
- [ ] Defer non-critical JavaScript

**Priority 4 - AdSense/Mediavine:**
- [ ] Get AdSense publisher ID
- [ ] Replace placeholder in `ad-slot.tsx`
- [ ] Add AdSense script to root layout
- [ ] Place ad slots in recommended positions
- [ ] Test ad rendering in production

---

## 10. Route Refactoring Plan

### Current vs. Target Structure

**Current:**
```
/clubs → /padel-clubs (directory)
/clubs/[slug] → /padel-clubs/[city]/[club-slug] (club detail)
/city/[citySlug] → /padel-clubs/[city] (city directory)
```

**Implementation Steps:**

1. **Create new routes:**
   - Create `app/padel-clubs/page.tsx` (copy from `app/clubs/page.tsx`)
   - Create `app/padel-clubs/[city]/page.tsx` (copy from `app/city/[citySlug]/page.tsx`)
   - Create `app/padel-clubs/[city]/[slug]/page.tsx` (copy from `app/clubs/[slug]/page.tsx`)

2. **Add redirects in `next.config.js`:**
   ```javascript
   async redirects() {
     return [
       {
         source: '/clubs',
         destination: '/padel-clubs',
         permanent: true,
       },
       {
         source: '/clubs/:slug',
         destination: '/padel-clubs/uk/:slug', // Temporary - need city lookup
         permanent: true,
       },
       {
         source: '/city/:slug',
         destination: '/padel-clubs/:slug',
         permanent: true,
       },
     ];
   }
   ```

3. **Update internal links:**
   - Search codebase for `/clubs` and `/city/` links
   - Replace with new routes

4. **Update Convex queries:**
   - Ensure club slugs include city
   - Update slug generation to match new format

---

## 11. Metadata Implementation Examples

### Server Component with Metadata

**Example: Static Page**
```typescript
// app/about/page.tsx
import { Metadata } from "next";
import { getStaticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getStaticPageMetadata(
  "about",
  "About Find Padel Clubs",
  "Learn about Find Padel Clubs, the UK's leading padel directory..."
);

export default function AboutPage() {
  return (
    // ... page content
  );
}
```

### Dynamic Route with generateMetadata

**Example: Club Page**
```typescript
// app/padel-clubs/[city]/[slug]/page.tsx (or layout.tsx)
import { Metadata } from "next";
import { getClubMetadata } from "@/lib/seo";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function generateMetadata({ 
  params 
}: { 
  params: { city: string; slug: string } 
}): Promise<Metadata> {
  const club = await preloadQuery(
    api.clubs.getBySlug, 
    { slug: params.slug }
  );
  
  if (!club) {
    return { title: "Club Not Found" };
  }
  
  return getClubMetadata(
    club.name,
    club.city,
    club.description,
    club.rating,
    club.number_of_courts
  );
}
```

---

## 12. Testing Checklist

### Pre-Launch SEO Audit

- [ ] Verify all canonical URLs use production domain
- [ ] Test sitemap.xml accessibility
- [ ] Verify robots.txt configuration
- [ ] Check all metadata exports render correctly
- [ ] Validate JSON-LD with Google Rich Results Test
- [ ] Test mobile responsiveness on multiple devices
- [ ] Verify Core Web Vitals (LCP, FID, CLS)
- [ ] Check internal linking structure
- [ ] Verify all images have alt text
- [ ] Test ad slots render correctly (production only)

### Tools for Testing

- **Google Search Console:** Submit sitemap, monitor indexing
- **Google Rich Results Test:** Validate structured data
- **PageSpeed Insights:** Performance and Core Web Vitals
- **Lighthouse:** SEO, performance, accessibility audit
- **Mobile-Friendly Test:** Verify mobile optimization

---

## 13. Environment Configuration

### Production Environment Variables

Create `.env.production`:
```env
NEXT_PUBLIC_SITE_URL=https://findpadelclubs.co.uk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# AdSense (when available)
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-...
```

### Build Configuration

```bash
# Production build
npm run build

# Verify build output
npm run start
```

---

## 14. Future Enhancements

### Blog Implementation (Optional)

If adding a blog:
1. Create `app/blog/page.tsx` (blog listing)
2. Create `app/blog/[slug]/page.tsx` (blog post)
3. Use `generateArticleSchema()` for JSON-LD
4. Add blog posts to sitemap
5. Link from homepage and directory pages

### Advanced SEO

- Implement hreflang tags if expanding internationally
- Add FAQ schema for FAQ pages
- Implement review schema if collecting reviews
- Add event schema for tournaments/events
- Implement organization schema for company info

---

## Summary

**Completed:**
✅ Central SEO utility module
✅ Production domain configuration
✅ Robots.txt and sitemap structure
✅ Static pages (privacy, terms, pricing, for-club-owners)
✅ Ad slot component
✅ JSON-LD schema generators
✅ Root layout with WebSite schema

**Remaining:**
⚠️ Route refactoring to `/padel-clubs/[city]/[slug]` pattern
⚠️ Metadata exports for dynamic pages
⚠️ JSON-LD injection into club/city pages
⚠️ Dynamic sitemap generation
⚠️ Internal linking implementation
⚠️ Breadcrumb navigation

**Estimated Time:** 4-6 hours for full implementation

---

## Quick Start

1. Review this guide
2. Prioritize route refactoring (if needed) or add metadata to existing routes
3. Add JSON-LD to club detail pages
4. Enhance sitemap with dynamic URLs
5. Test all changes locally
6. Deploy to production
7. Submit sitemap to Google Search Console

For questions or issues, refer to the code comments in `lib/seo.ts` and individual page implementations.

