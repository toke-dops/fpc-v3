import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const ADMIN_EMAIL = "temitope875@gmail.com";

/**
 * Require admin authentication using Clerk
 * Redirects to sign-in if not authenticated
 * Redirects to dashboard if authenticated but not admin
 */
export async function requireAdminAuth() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in?redirect_url=/admin");
  }

  // Get user from Clerk
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in?redirect_url=/admin");
  }

  // Check if user is the admin email
  const email = user.emailAddresses[0]?.emailAddress;
  
  if (email !== ADMIN_EMAIL) {
    // User is authenticated but not admin - redirect to dashboard
    redirect("/dashboard");
  }

  return { userId, email };
}

/**
 * Check if current user is admin (for client components)
 * Returns null if not authenticated, false if not admin, true if admin
 */
export async function isAdmin() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const user = await currentUser();
  
  if (!user) {
    return null;
  }

  const email = user.emailAddresses[0]?.emailAddress;
  return email === ADMIN_EMAIL;
}

