/**
 * Layout for Clubs Directory Pages
 * Adds metadata and SEO for directory pages
 */

import { Metadata } from "next";
import { getDirectoryMetadata } from "@/lib/seo";

export const metadata: Metadata = getDirectoryMetadata();

export default function ClubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

