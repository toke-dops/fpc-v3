"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // ConvexProviderWithClerk handles token fetching automatically
  // It uses the "convex" template by default
  // IMPORTANT: Make sure CLERK_JWT_ISSUER_DOMAIN is set in Convex Dashboard
  // and JWT template "convex" is created in Clerk Dashboard
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

