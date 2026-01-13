/**
 * Layout for Club Detail Pages
 * Adds metadata and SEO for individual club pages
 */

import { Metadata } from "next";
import { getClubMetadata, generateCitySlug } from "@/lib/seo";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // Note: In Next.js App Router, we can't use preloadQuery in generateMetadata
  // For now, return basic metadata - the component will handle full metadata
  // For production, consider using server-side data fetching
  
  return {
    title: "Padel Club | Find Padel Clubs",
    description: "Discover padel clubs across the UK. Find courts, book sessions, and join the fastest-growing racket sport.",
  };
}

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

