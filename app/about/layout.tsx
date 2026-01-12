/**
 * Layout for About Page
 * Adds metadata and SEO
 */

import { Metadata } from "next";
import { getStaticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getStaticPageMetadata(
  "about",
  "About Find Padel Clubs",
  "Learn about Find Padel Clubs, the UK's leading padel directory. Discover our mission, what we do, and how we help players find the best padel courts across the United Kingdom."
);

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

