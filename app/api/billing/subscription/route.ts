import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Force dynamic rendering - this route must be server-side only
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clubId = searchParams.get("clubId");

    if (!clubId) {
      return NextResponse.json(
        { error: "clubId is required" },
        { status: 400 }
      );
    }

    // Get subscription from Convex
    // Note: This requires passing the auth token to Convex
    // For now, we'll return a placeholder
    // In production, you'd call the Convex query with proper auth
    
    return NextResponse.json({ 
      subscription: null, // Will be populated by actual Convex query
      clubId 
    });
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
