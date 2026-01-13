/**
 * Script to populate lat/lng fields for all clubs
 * 
 * This script:
 * 1. Extracts coordinates from maps_url for clubs that have it
 * 2. Geocodes full_address for clubs without maps_url coordinates
 * 3. Updates the lat/lng fields in the database
 * 
 * Usage:
 *   npx tsx scripts/populate-coordinates.ts
 * 
 * Or call the API endpoint:
 *   curl -X POST http://localhost:3000/api/clubs/populate-coordinates
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Try to load environment variables from multiple possible files
const envFiles = [".env.local", ".env"];
for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Also try loading from .env if .env.local doesn't exist
if (!process.env.NEXT_PUBLIC_CONVEX_URL && !process.env.CONVEX_URL) {
  dotenv.config(); // Try default .env
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!convexUrl) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL or CONVEX_URL environment variable is required");
  console.error("\nPlease ensure one of the following:");
  console.error("  1. Create a .env.local file with: NEXT_PUBLIC_CONVEX_URL=your-convex-url");
  console.error("  2. Or set the environment variable: export NEXT_PUBLIC_CONVEX_URL=your-convex-url");
  console.error("\nYou can find your Convex URL by running 'npx convex dev' or checking your Convex dashboard.");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

async function populateCoordinates() {
  console.log("🔄 Starting coordinate population...");
  console.log("   Processing in batches to avoid timeout...\n");

  let startIndex = 0;
  const batchSize = 100;
  let totalUpdated = 0;
  let totalGeocoded = 0;
  let totalErrors = 0;
  let totalSkipped = 0;
  let totalProcessed = 0;
  let batchNumber = 1;

  try {
    while (true) {
      console.log(`\n📦 Processing batch ${batchNumber} (starting at index ${startIndex})...`);
      
      // Note: This is now an action, not a mutation, because it uses fetch() and setTimeout()
      const result = await client.action(api.clubs.populateCoordinatesFromMapsUrl, {
        batchSize,
        startIndex,
      });

      totalUpdated += result.updated;
      totalGeocoded += result.geocoded;
      totalErrors += result.errors;
      totalSkipped += result.skipped || 0;
      totalProcessed = result.processed;

      console.log(`   Batch ${batchNumber} complete: ${result.updated} from maps_url, ${result.geocoded} geocoded, ${result.errors} errors`);
      console.log(`   Overall progress: ${result.processed}/${result.total} clubs processed`);

      if (!result.hasMore) {
        break;
      }

      startIndex = result.nextStartIndex;
      batchNumber++;
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("\n✅ Coordinate population complete!");
    console.log(`   Total clubs: ${totalProcessed}`);
    console.log(`   Skipped (already had coordinates): ${totalSkipped}`);
    console.log(`   Updated from maps_url: ${totalUpdated}`);
    console.log(`   Geocoded from addresses: ${totalGeocoded}`);
    console.log(`   Errors: ${totalErrors}`);
    
    const processed = totalProcessed - totalSkipped;
    if (processed > 0) {
      console.log(`\n   Success rate: ${((totalUpdated + totalGeocoded) / processed * 100).toFixed(1)}%`);
    }
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(`   Processed ${totalProcessed} clubs before error`);
    process.exit(1);
  }
}

populateCoordinates();

