import { Metadata } from "next";
import { getStaticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getStaticPageMetadata(
  "partner-programme",
  "Partner Programme - Find Padel Clubs",
  "Join the Find Padel Clubs Partner Programme. Collaborate with the UK's leading padel directory. Exclusive benefits, revenue sharing, and mutual growth opportunities for padel clubs, equipment suppliers, and service providers."
);

export default function PartnerProgrammeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

