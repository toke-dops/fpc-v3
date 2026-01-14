"use client";

import { useEffect } from "react";
import Script from "next/script";

/**
 * Ad Slot Component - AdSense/Mediavine Ready
 * Safe abstraction for ad slots that can be toggled off in development
 */

interface AdSlotProps {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  format?: "auto" | "vertical" | "horizontal" | "rectangle";
  slot?: string; // Google AdSense ad slot ID
  publisherId?: string; // Google AdSense publisher ID (ca-pub-XXXXXXXXXX)
}

export function AdSlot({ 
  id, 
  className = "", 
  style,
  format = "auto",
  slot,
  publisherId 
}: AdSlotProps) {
  const isProduction = process.env.NODE_ENV === "production";
  const enableDev = process.env.NEXT_PUBLIC_ENABLE_ADS_DEV === "true";
  const showAds = isProduction || enableDev;

  // Initialize AdSense ad when component mounts
  useEffect(() => {
    if (showAds && slot && publisherId && typeof window !== "undefined") {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense initialization error:", e);
      }
    }
  }, [showAds, slot, publisherId]);

  // Development placeholder
  if (!showAds) {
    return (
      <div 
        className={`bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center ${className}`}
        style={{ minHeight: "250px", ...style }}
      >
        <p className="text-xs text-slate-500 text-center p-4">
          Ad Slot: {id}
          <br />
          <span className="text-[10px]">(Ads disabled in development)</span>
        </p>
      </div>
    );
  }

  // Google AdSense format
  if (slot && publisherId) {
    return (
      <div className={`ad-slot ${className}`} style={style}>
        <ins
          className="adsbygoogle"
          style={{ display: "block", ...style }}
          data-ad-client={publisherId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Mediavine or other ad networks (placeholder div)
  return (
    <div 
      id={id}
      className={`ad-slot ${className}`}
      style={{ minHeight: "250px", ...style }}
      data-ad-slot={id}
    />
  );
}

/**
 * AdSense Script Loader Component
 * Call this once in your root layout
 * 
 * Usage: <AdSenseScript publisherId="ca-pub-XXXXXXXXXX" />
 */
interface AdSenseScriptProps {
  publisherId?: string;
}

export function AdSenseScript({ publisherId }: AdSenseScriptProps) {
  // Use publisher ID from props or environment variable
  const adSenseId = publisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  
  // Only load in production
  if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_ENABLE_ADS_DEV) {
    return null;
  }

  if (!adSenseId) {
    console.warn("AdSense: No publisher ID provided");
    return null;
  }

  // Use afterInteractive strategy - Next.js Script component handles script placement optimally
  // This matches Google's recommended code format
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
