import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Fix club plans - assigns plans to clubs that don't have them
 * and syncs is_featured based on plan
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you can add admin check here if needed)
    // For now, allow any authenticated user to run this

    console.log("=== FIXING CLUB PLANS ===");

    const result = await convex.mutation(api.clubs.fixClubPlans, {});

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error fixing club plans:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fix club plans" },
      { status: 500 }
    );
  }
}

