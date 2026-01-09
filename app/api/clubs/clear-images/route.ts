import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Clear all image URLs from clubs
 * This ensures we only use Pexels images to avoid copyright infringement
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=== CLEARING ALL CLUB IMAGE URLS ===");
    console.log("This ensures we only use Pexels images to avoid copyright infringement");

    const result = await convex.mutation(api.clubs.clearAllImageUrls, {});

    return NextResponse.json({
      success: true,
      ...result,
      message: `Cleared image URLs from ${result.cleared} clubs. All clubs now use Pexels images only.`,
    });
  } catch (error: any) {
    console.error("Error clearing image URLs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear image URLs" },
      { status: 500 }
    );
  }
}

