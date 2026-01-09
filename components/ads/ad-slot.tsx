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
}

export function AdSlot({ 
  id, 
  className = "", 
  style,
  format = "auto",
  slot 
}: AdSlotProps) {
  // Only show ads in production
  if (process.env.NODE_ENV !== "production") {
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

  // Production: Render actual ad slot
  // Google AdSense format
  if (slot) {
    return (
      <div className={`ad-slot ${className}`} style={style}>
        <ins
          className="adsbygoogle"
          style={{ display: "block", ...style }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your AdSense publisher ID
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (adsbygoogle = window.adsbygoogle || []).push({});
            `,
          }}
        />
      </div>
    );
  }

  // Mediavine or other ad networks
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
 * AdSense Script Loader
 * Call this once in your root layout or _document
 */
export function AdSenseScript() {
  // Only load in production
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}

