import { Metadata } from "next";
import { getStaticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getStaticPageMetadata(
  "advertise",
  "Advertise with Us - Find Padel Clubs",
  "Reach thousands of padel enthusiasts across the UK. Advertise your padel club, equipment, or services on Find Padel Clubs. Get maximum visibility with our Featured and Business plans."
);

export default function AdvertiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

