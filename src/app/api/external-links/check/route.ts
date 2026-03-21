// API route to trigger manual health check (admin/cron use)
import { NextResponse } from "next/server";
import { checkAllExternalLinks } from "@/lib/external-link-health";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    console.log("[external-links/check] Starting health check for all external links...");
    
    const results = await checkAllExternalLinks();

    const summary = {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      unavailable: results.filter((r) => r.status === "unavailable").length,
      timestamp: new Date().toISOString(),
      results: results.map((r) => ({
        linkId: r.linkId,
        url: r.url,
        status: r.status,
        statusCode: r.statusCode,
        error: r.error,
      })),
    };

    console.log("[external-links/check] Health check complete:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[external-links/check] Error during health check:", error);
    return NextResponse.json(
      { error: "Health check failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
