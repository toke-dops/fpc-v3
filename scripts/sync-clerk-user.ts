/**
 * Script to manually sync a Clerk user to Convex
 * 
 * Usage:
 *   npx tsx scripts/sync-clerk-user.ts <clerk_user_id> <email> <name> [role]
 * 
 * Example:
 *   npx tsx scripts/sync-clerk-user.ts user_abc123 john@example.com "John Doe" club_owner
 */

import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL is not set in .env.local");
  process.exit(1);
}

async function syncUser() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error("Usage: npx tsx scripts/sync-clerk-user.ts <clerk_user_id> <email> <name> [role]");
    console.error("");
    console.error("Example:");
    console.error('  npx tsx scripts/sync-clerk-user.ts user_abc123 john@example.com "John Doe" club_owner');
    process.exit(1);
  }

  const [clerkUserId, email, name, role = "club_owner"] = args;

  if (!clerkUserId.startsWith("user_")) {
    console.error("❌ Clerk User ID must start with 'user_'");
    process.exit(1);
  }

  if (!["club_owner", "admin"].includes(role)) {
    console.error("❌ Role must be either 'club_owner' or 'admin'");
    process.exit(1);
  }

  console.log("🔄 Syncing user to Convex...");
  console.log(`   Clerk User ID: ${clerkUserId}`);
  console.log(`   Email: ${email}`);
  console.log(`   Name: ${name}`);
  console.log(`   Role: ${role}`);
  console.log("");

  try {
    if (!CONVEX_URL) {
      throw new Error("CONVEX_URL environment variable is required");
    }
    const client = new ConvexHttpClient(CONVEX_URL);

    const result = await client.mutation("sync_users:syncUserManually", {
      auth_provider_user_id: clerkUserId,
      email: email.toLowerCase(),
      name: name.trim(),
      role: role as "club_owner" | "admin",
    });

    if (result.success) {
      console.log(`✅ ${result.message}`);
      console.log(`   User ID: ${result.userId}`);
      console.log(`   Action: ${result.action}`);
    } else {
      console.error("❌ Sync failed:", result);
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ Error syncing user:", error.message);
    if (error.message.includes("already exists")) {
      console.log("   User already exists in Convex. This is okay!");
    } else {
      process.exit(1);
    }
  }
}

syncUser();

