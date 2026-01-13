import bcrypt from "bcryptjs";

/**
 * Test script to verify password hash works
 * Run: npx tsx scripts/test-password.ts
 */

const hash = "$2b$10$JRzbvNCObS9N0mErUWMcAuwxEQfwa0wVZ8lv/arYnIoKu1e7Kfi6u";
const password = "admin123";

async function testPassword() {
  console.log("\n=== Testing Password Hash ===\n");
  console.log(`Hash: ${hash}`);
  console.log(`Password to test: ${password}\n`);
  
  try {
    const isValid = await bcrypt.compare(password, hash);
    console.log(`Result: ${isValid ? "✅ VALID" : "❌ INVALID"}`);
    
    if (isValid) {
      console.log("\n✅ Password hash is working correctly!");
      console.log("The login should work with:");
      console.log("  Email: temitope875@gmail.com");
      console.log("  Password: admin123");
    } else {
      console.log("\n❌ Password doesn't match hash");
      console.log("This means the password you're entering doesn't match 'admin123'");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
  
  console.log("\n");
}

testPassword();

