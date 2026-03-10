// API route to get external link health status
import { NextResponse } from "next/server";
import { getAllLinkHealth } from "@/lib/external-link-health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const healthData = await getAllLinkHealth();

    // Transform to simple key-value format for frontend
    const statusMap: Record<string, {
      status: string;
      lastCheckedAt: string;
      lastStatusCode?: number;
      lastError?: string;
    }> = {};

    for (const item of healthData) {
      statusMap[item.linkId] = {
        status: item.status,
        lastCheckedAt: item.lastCheckedAt.toISOString(),
        lastStatusCode: item.lastStatusCode ?? undefined,
        lastError: item.lastError ?? undefined,
      };
    }

    return NextResponse.json(statusMap);
  } catch (error) {
    console.error("[external-links/health] Error fetching health data:", error);
    
    // Return empty object instead of 500 - graceful degradation
    // Frontend will treat missing health data as "unknown" status
    return NextResponse.json({}, { status: 200 });
  }
}
