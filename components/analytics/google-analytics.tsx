"use client";

import Script from "next/script";

interface GoogleAnalyticsProps {
  measurementId?: string;
}

/**
 * Google Analytics Component
 * Loads Google Analytics 4 (gtag.js) for tracking
 * 
 * Usage: Add <GoogleAnalytics measurementId="G-XXXXXXXXXX" /> to your root layout
 * Get your Measurement ID from: https://analytics.google.com/
 */
export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  // Don't load in development unless explicitly enabled
  if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_ENABLE_GA_DEV) {
    return null;
  }

  if (!measurementId) {
    console.warn("Google Analytics: No measurement ID provided");
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

