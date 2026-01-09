"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, LayoutDashboard, Building2, CreditCard, UserCircle } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserButton() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const currentUser = useQuery(api.users.getCurrentUser);
  const subscriptionStatus = useQuery(api.subscriptions.getUserSubscriptionStatus);

  if (!isLoaded) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4" />
      </Button>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </div>
    );
  }

  const displayName = user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || "User";
  const initials = user.fullName
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.imageUrl} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {user.emailAddresses[0]?.emailAddress}
            </p>
            {currentUser && (
              <>
                <p className="text-xs text-muted-foreground capitalize">
                  Role: {currentUser.role}
                </p>
                {currentUser.role === "admin" ? (
                  <p className="text-xs text-muted-foreground capitalize">
                    Account Type: Admin
                  </p>
                ) : subscriptionStatus && (
                  <p className="text-xs text-muted-foreground capitalize">
                    Plan: {subscriptionStatus}
                  </p>
                )}
              </>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        {currentUser && (currentUser.role === "club_owner" || currentUser.role === "admin") && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/owner/dashboard" className="flex items-center">
                <Building2 className="mr-2 h-4 w-4" />
                My Clubs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/owner/subscriptions" className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                My Subscriptions
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/owner/profile" className="flex items-center">
                <UserCircle className="mr-2 h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

