import bcrypt from "bcryptjs";

/**
 * Script to generate a password hash for admin login
 * Run: npx tsx scripts/generate-password-hash.ts
 * 
 * Usage:
 * 1. Set your desired password below
 * 2. Run the script
 * 3. Copy the hash to .env.local as ADMIN_PASSWORD_HASH
 */

const password = "admin123"; // CHANGE THIS to your desired password

async function generateHash() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log("\n=== Admin Password Hash ===");
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log("\nAdd this to your .env.local:");
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log("\n");
}

generateHash().catch(console.error);

