import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import Papa from "papaparse";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// CSV column mapping
interface CSVRow {
  NAME: string;
  CATEGORY: string;
  "STREET ADDRESS": string;
  ADDRESS: string;
  CITY: string;
  "ZIP CODE": string;
  "COUNTRY NAME": string;
  "COUNTRY CODE": string;
  PHONE: string;
  EMAIL: string;
  WEBSITE: string;
  FACEBOOK: string;
  INSTAGRAM: string;
  LINKEDIN: string;
  TWITTER: string;
  URL: string;
  "BOOKING LINK": string;
  SCORE: string;
  RATINGS: string;
  "OPENING HOURS": string;
  "MAIN IMAGE URL": string;
  DESCRIPTION: string;
  POI: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

function generateUniqueSlug(name: string, city: string | undefined, existingSlugs: Set<string>): string {
  const base = city ? `${name}-${city}` : name;
  let slug = slugify(base);
  let counter = 1;

  while (existingSlugs.has(slug)) {
    slug = `${slugify(base)}-${counter}`;
    counter++;
  }

  existingSlugs.add(slug);
  return slug;
}

function parseCategories(categoryString: string): string[] {
  if (!categoryString) return [];
  return categoryString
    .split(",")
    .map((cat) => cat.trim())
    .filter(Boolean);
}

function parseAmenities(poiString: string): string[] | undefined {
  if (!poiString || poiString.trim() === "") return undefined;
  return poiString
    .split(",")
    .map((amenity) => amenity.trim())
    .filter(Boolean);
}

function parseNumber(value: string): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const num = parseFloat(value);
  return isNaN(num) ? undefined : num;
}

function parseString(value: string): string | undefined {
  if (!value || value.trim() === "") return undefined;
  return value.trim();
}

async function importCSV() {
  console.log("🎾 UK Padel Club Directory - CSV Import\n");

  // Check for CONVEX_URL environment variable (also check NEXT_PUBLIC_CONVEX_URL)
  const convexUrl = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error("❌ Error: CONVEX_URL environment variable is not set.");
    console.log("\nMake sure you have run 'npx convex dev' first.");
    console.log("The .env.local file should contain NEXT_PUBLIC_CONVEX_URL.");
    process.exit(1);
  }
  
  console.log(`📡 Using Convex URL: ${convexUrl}\n`);

  // Read the CSV file
  const csvPath = path.join(process.cwd(), "data", "fpc-results-v4.csv");
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`📂 Reading CSV from: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Parse CSV
  const parseResult = Papa.parse<CSVRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parseResult.errors.length > 0) {
    console.error("❌ CSV parsing errors:", parseResult.errors);
  }

  const rows = parseResult.data;
  console.log(`📊 Found ${rows.length} rows in CSV\n`);

  // Filter to GB only
  const gbRows = rows.filter((row) => row["COUNTRY CODE"] === "GB");
  console.log(`🇬🇧 Filtered to ${gbRows.length} UK clubs\n`);

  // Generate slugs and transform data
  const existingSlugs = new Set<string>();
  const clubs = gbRows.map((row) => {
    const city = parseString(row.CITY);
    const slug = generateUniqueSlug(row.NAME, city, existingSlugs);

    return {
      name: row.NAME,
      categories: parseCategories(row.CATEGORY),
      amenities: parseAmenities(row.POI),
      street_address: parseString(row["STREET ADDRESS"]),
      full_address: parseString(row.ADDRESS),
      city,
      postcode: parseString(row["ZIP CODE"]),
      country: row["COUNTRY NAME"] || "United Kingdom",
      country_code: row["COUNTRY CODE"] || "GB",
      phone: parseString(row.PHONE),
      website: parseString(row.WEBSITE),
      contact_email: parseString(row.EMAIL),
      facebook: parseString(row.FACEBOOK),
      instagram: parseString(row.INSTAGRAM),
      linkedin: parseString(row.LINKEDIN),
      twitter: parseString(row.TWITTER),
      maps_url: parseString(row.URL),
      booking_url: parseString(row["BOOKING LINK"]),
      rating: parseNumber(row.SCORE),
      rating_count: parseNumber(row.RATINGS) ? Math.floor(parseNumber(row.RATINGS)!) : undefined,
      opening_hours_raw: parseString(row["OPENING HOURS"]),
      // Do not import image_url - we only use Pexels images to avoid copyright issues
      // image_url: parseString(row["MAIN IMAGE URL"]), // REMOVED - using Pexels only
      description: parseString(row.DESCRIPTION),
      slug,
    };
  });

  console.log("📤 Clearing existing clubs...\n");

  // Create Convex client
  const client = new ConvexHttpClient(convexUrl);

  // Clear all existing clubs first
  try {
    const clearResult = await client.mutation(api.import.clearAllClubs, {});
    console.log(`   Cleared ${clearResult.deleted} existing clubs\n`);
  } catch (error) {
    console.error(`  ❌ Failed to clear existing clubs:`, error);
    process.exit(1);
  }

  console.log("📤 Importing to Convex...\n");

  // Import in batches of 50 to avoid hitting limits
  const BATCH_SIZE = 50;
  let totalImported = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  const allErrors: string[] = [];

  for (let i = 0; i < clubs.length; i += BATCH_SIZE) {
    const batch = clubs.slice(i, i + BATCH_SIZE);
    console.log(`  Importing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(clubs.length / BATCH_SIZE)}...`);

    try {
      const result = await client.mutation(api.import.importClubs, { clubs: batch, replaceAll: false });
      totalImported += result.imported;
      totalUpdated += result.updated || 0;
      totalSkipped += result.skipped;
      allErrors.push(...result.errors);
    } catch (error) {
      console.error(`  ❌ Batch failed:`, error);
      allErrors.push(`Batch ${i / BATCH_SIZE + 1} failed: ${error}`);
    }
  }

  console.log("\n✅ Import complete!");
  console.log(`   Imported: ${totalImported}`);
  if (totalUpdated > 0) {
    console.log(`   Updated: ${totalUpdated}`);
  }
  console.log(`   Skipped (duplicates): ${totalSkipped}`);
  
  if (allErrors.length > 0) {
    console.log(`   Errors: ${allErrors.length}`);
    allErrors.forEach((err) => console.log(`     - ${err}`));
  }
}

importCSV().catch(console.error);

