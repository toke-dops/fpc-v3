import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ConvexClientProvider } from "@/components/convex-provider";
import { UserSync } from "@/components/user-sync";
import { SubscriptionSync } from "@/components/subscription-sync";
import { JsonLd } from "@/components/json-ld";
import { getHomeMetadata, generateWebSiteSchema, SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: getHomeMetadata().title,
    template: `%s | ${SITE_NAME}`,
  },
  description: getHomeMetadata().description,
  keywords: getHomeMetadata().keywords,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    ...getHomeMetadata().openGraph,
  },
  twitter: {
    ...getHomeMetadata().twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en-GB" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <body className="min-h-screen bg-background font-sans antialiased">
          {/* JSON-LD Structured Data - WebSite schema for homepage */}
          <JsonLd data={generateWebSiteSchema()} />
          <ConvexClientProvider>
            <UserSync />
            <SubscriptionSync />
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

