# Monetization Readiness Checklist

This document outlines the current state of monetization, analytics, and SEO implementation for Find Padel Clubs.

## ✅ Completed

### SEO Optimization
- ✅ **Metadata**: Comprehensive metadata for all pages (title, description, Open Graph, Twitter cards)
- ✅ **Structured Data**: JSON-LD schemas (WebSite, LocalBusiness, SportsActivityLocation, BreadcrumbList)
- ✅ **Sitemap**: Dynamic sitemap generation (`/sitemap.xml`)
- ✅ **Robots.txt**: Properly configured (`/robots.txt`)
- ✅ **Canonical URLs**: All pages have canonical URLs
- ✅ **URL Slugs**: SEO-friendly, lowercase, hyphen-separated slugs
- ✅ **Mobile Optimization**: Responsive design, mobile-first approach
- ✅ **Image Optimization**: Next.js Image component with WebP/AVIF formats
- ✅ **Performance**: Code splitting, lazy loading, caching headers

### Legal & Compliance
- ✅ **Privacy Policy**: Complete privacy policy page (`/privacy-policy`)
- ✅ **Terms of Service**: Complete terms of service page (`/terms-of-service`)
- ✅ **Contact Information**: Email address displayed (`findpadelclubs@gmail.com`)

### Ad Infrastructure
- ✅ **Ad Slot Component**: Reusable component for AdSense/Mediavine (`components/ads/ad-slot.tsx`)
- ✅ **AdSense Script Loader**: Component ready for integration
- ✅ **Development Safety**: Ads disabled in development mode

### Analytics Infrastructure
- ✅ **Google Analytics Component**: Ready for integration (`components/analytics/google-analytics.tsx`)
- ✅ **Custom Analytics**: Internal analytics system for club views, clicks, leads

## ⚠️ Needs Configuration

### Google Analytics
**Status**: Component created, needs Measurement ID

**Action Required**:
1. Create a Google Analytics 4 property: https://analytics.google.com/
2. Get your Measurement ID (format: `G-XXXXXXXXXX`)
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
4. Optional: Enable in development (for testing):
   ```
   NEXT_PUBLIC_ENABLE_GA_DEV=true
   ```

### Google AdSense / Mediavine
**Status**: Components created, needs Publisher ID and ad slot placement

**Action Required**:
1. **For Google AdSense**:
   - Apply for AdSense: https://www.google.com/adsense/
   - Get your Publisher ID (format: `ca-pub-XXXXXXXXXX`)
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXX
     ```
   - Create ad units in AdSense dashboard and get ad slot IDs
   - Place `<AdSlot>` components on key pages (see below)

2. **For Mediavine**:
   - Apply for Mediavine: https://www.mediavine.com/
   - Follow their integration guide
   - Replace AdSense components with Mediavine scripts

### Ad Placement Strategy

**Recommended Ad Locations**:

1. **Homepage** (`app/page.tsx`):
   - Top banner (728x90 or responsive)
   - Between featured clubs section
   - Bottom of page (728x90 or responsive)

2. **Clubs Listing Page** (`app/clubs/page.tsx`):
   - Top of results (728x90)
   - After first 5-10 results (300x250 or responsive)
   - Bottom of results (728x90)

3. **Club Detail Page** (`app/clubs/[slug]/page.tsx`):
   - Top of content (728x90)
   - After hero section (300x250)
   - In sidebar (if applicable)
   - Bottom of page (728x90)

4. **City Pages** (`app/city/[citySlug]/page.tsx`):
   - Top of listings
   - Between club cards
   - Bottom of page

**Example Implementation**:
```tsx
import { AdSlot } from "@/components/ads/ad-slot";

// In your page component:
<AdSlot 
  id="homepage-top"
  slot="1234567890" // Your AdSense ad slot ID
  publisherId={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
  format="auto"
  className="my-8"
/>
```

### Google Search Console
**Status**: Verification code placeholder exists

**Action Required**:
1. Go to Google Search Console: https://search.google.com/search-console
2. Add your property: `https://findpadelclubs.co.uk`
3. Get verification code (meta tag or HTML file)
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code
   ```
5. Submit sitemap: `https://findpadelclubs.co.uk/sitemap.xml`

## 📊 Current Analytics

### Internal Analytics
- ✅ Club view tracking
- ✅ Click tracking (booking, social links, website)
- ✅ Lead submission tracking
- ✅ Session duration tracking
- ✅ Owner view filtering (excludes owner views from stats)

### Available in Admin Dashboard
- Total views per club
- Click-through rates
- Lead submissions
- Popular clubs
- Time-based analytics (7d, 30d, 90d)

## 🚀 Next Steps for Full Monetization

1. **Apply for Ad Networks**:
   - Google AdSense (easiest to get approved)
   - Mediavine (requires 50k+ monthly sessions)
   - Ezoic (alternative to Mediavine)

2. **Set Up Google Analytics**:
   - Create GA4 property
   - Add Measurement ID to environment variables
   - Set up conversion tracking (if needed)

3. **Place Ad Slots**:
   - Add ad slots to high-traffic pages
   - Test ad placement and user experience
   - Monitor Core Web Vitals (ads can impact performance)

4. **Optimize for Ad Revenue**:
   - Ensure good content-to-ad ratio (not too many ads)
   - Place ads above the fold (but not intrusive)
   - Use responsive ad formats
   - Monitor bounce rate and user engagement

5. **Legal Compliance**:
   - Review privacy policy for ad tracking disclosures
   - Add cookie consent banner (if required for GDPR)
   - Ensure terms of service cover ad content

## 📈 Performance Monitoring

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Tools
- Google PageSpeed Insights: https://pagespeed.web.dev/
- Google Search Console: https://search.google.com/search-console
- Google Analytics: https://analytics.google.com/

## 🔒 Security & Privacy

- ✅ HTTPS enabled (required for AdSense)
- ✅ Privacy Policy in place
- ✅ Terms of Service in place
- ⚠️ Cookie consent banner (may be required for GDPR compliance)

## 📝 Environment Variables Needed

Add these to your `.env.local`:

```bash
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google AdSense
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXX

# Google Search Console Verification
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code

# Optional: Enable analytics/ads in development (for testing)
NEXT_PUBLIC_ENABLE_GA_DEV=false
NEXT_PUBLIC_ENABLE_ADS_DEV=false
```

## ✅ Summary

**Ready for Monetization**: ✅ YES (with configuration)

**What's Ready**:
- ✅ SEO fully optimized
- ✅ Legal pages complete
- ✅ Ad infrastructure built
- ✅ Analytics infrastructure built
- ✅ Performance optimized

**What's Needed**:
- ⚠️ Google Analytics Measurement ID
- ⚠️ AdSense/Mediavine Publisher ID
- ⚠️ Ad slot placement on pages
- ⚠️ Google Search Console verification
- ⚠️ Optional: Cookie consent banner

**Estimated Time to Full Monetization**: 1-2 weeks
- Ad network approval: 1-7 days (varies by network)
- Configuration: 1-2 hours
- Testing: 1-2 days

