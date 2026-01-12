/**
 * Layout for City Pages
 * Adds metadata and SEO for city directory pages
 */

import { Metadata } from "next";
import { getCityMetadata, generateCitySlug } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: { citySlug: string };
}): Promise<Metadata> {
  // Basic metadata - can be enhanced with dynamic city data
  const cityName = params.citySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return getCityMetadata(cityName);
}

export default function CityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

