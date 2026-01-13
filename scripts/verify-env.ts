import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

/**
 * Script to verify .env.local format
 * Run: npx tsx scripts/verify-env.ts
 */

const envPath = path.join(process.cwd(), ".env.local");

console.log("\n=== Checking .env.local ===\n");

// Check if file exists
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local file NOT FOUND");
  console.log(`Expected location: ${envPath}`);
  console.log("\nCreate the file in the project root with:");
  console.log("ADMIN_PASSWORD_HASH=$2b$10$JRzbvNCObS9N0mErUWMcAuwxEQfwa0wVZ8lv/arYnIoKu1e7Kfi6u");
  process.exit(1);
}

console.log("✅ .env.local file exists");
console.log(`Location: ${envPath}\n`);

// Read file content
const fileContent = fs.readFileSync(envPath, "utf-8");
const lines = fileContent.split("\n");

console.log("File contents:");
console.log("---");
lines.forEach((line, index) => {
  if (line.trim()) {
    // Mask the hash for security
    const masked = line.replace(/ADMIN_PASSWORD_HASH=(.+)/, (match, hash) => {
      return `ADMIN_PASSWORD_HASH=${hash.substring(0, 15)}...`;
    });
    console.log(`${index + 1}: ${masked}`);
  }
});
console.log("---\n");

// Check for ADMIN_PASSWORD_HASH
const hasHash = fileContent.includes("ADMIN_PASSWORD_HASH");
if (!hasHash) {
  console.error("❌ ADMIN_PASSWORD_HASH not found in file");
  console.log("\nAdd this line to .env.local:");
  console.log("ADMIN_PASSWORD_HASH=$2b$10$JRzbvNCObS9N0mErUWMcAuwxEQfwa0wVZ8lv/arYnIoKu1e7Kfi6u");
  process.exit(1);
}

console.log("✅ ADMIN_PASSWORD_HASH found in file");

// Load and verify
dotenv.config({ path: envPath });
const hash = process.env.ADMIN_PASSWORD_HASH;

if (!hash) {
  console.error("❌ ADMIN_PASSWORD_HASH is empty or not loaded");
  console.log("\nCheck the format:");
  console.log("- No spaces around =");
  console.log("- No quotes");
  console.log("- Full hash on one line");
  process.exit(1);
}

console.log(`✅ Hash loaded: ${hash.length} characters`);
console.log(`   Starts with: ${hash.substring(0, 7)}`);

// Validate hash format
if (!hash.startsWith("$2")) {
  console.error("❌ Hash format invalid - should start with $2a$ or $2b$");
  process.exit(1);
}

if (hash.length !== 60) {
  console.error(`❌ Hash length invalid: ${hash.length} (should be 60)`);
  process.exit(1);
}

console.log("✅ Hash format is valid");
console.log("\n✅ All checks passed! Environment variable should work.");
console.log("\nNext steps:");
console.log("1. Restart your Next.js server (Ctrl+C then npm run dev)");
console.log("2. Test login with:");
console.log("   Email: temitope875@gmail.com");
console.log("   Password: admin123");
console.log("3. Check: http://localhost:3000/api/admin/test-env\n");

