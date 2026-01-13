/**
 * Layout for Contact Page
 * Adds metadata and SEO
 */

import { Metadata } from "next";
import { getStaticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = getStaticPageMetadata(
  "contact",
  "Contact Find Padel Clubs",
  "Get in touch with Find Padel Clubs. Have a question, feedback, or need help? Contact us via email or use our contact form. We're here to help players and club owners."
);

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

