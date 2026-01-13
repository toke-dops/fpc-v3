"use client";

import { SignUp } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function SignUpPage() {
  const { user, isLoaded } = useUser();
  const syncUser = useMutation(api.users.syncUser);

  // When user signs up, sync them with club_owner role (all users are club owners)
  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      const name =
        user.fullName ??
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ??
        email.split("@")[0] ??
        "User";

      if (email) {
        // All sign-ups are club owners (players don't need accounts)
        syncUser({ email, name, role: "club_owner" }).catch((error) => {
          console.error("[SignUp] Failed to sync user:", error);
        });
      }
    }
  }, [isLoaded, user, syncUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Club Owner Sign Up</h1>
          <p className="text-sm text-muted-foreground">
            Create an account to list or claim your padel club. You'll have 7 days to complete your club listing or claim.
          </p>
        </div>
        <SignUp 
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/dashboard"
          afterSignInUrl="/dashboard"
        />
      </div>
    </div>
  );
}

