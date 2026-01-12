import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const client = new ConvexHttpClient(convexUrl);

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Starting coordinate population from maps_url and addresses...");
    
    // Note: This is now an action, not a mutation, because it uses fetch() and setTimeout()
    const result = await client.action(api.clubs.populateCoordinatesFromMapsUrl, {});
    
    console.log("✅ Coordinate population complete:", result);
    
    return NextResponse.json({
      success: true,
      message: `Populated coordinates for ${result.updated} clubs from maps_url, geocoded ${result.geocoded} clubs from addresses, ${result.errors} errors`,
      ...result,
    });
  } catch (error: any) {
    console.error("❌ Error populating coordinates:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to populate coordinates",
      },
      { status: 500 }
    );
  }
}

