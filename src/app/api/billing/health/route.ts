/**
 * Billing Health Check Endpoint
 *
 * GET /api/billing/health
 *
 * Returns a health check for the billing system.
 * Can be called in staging to verify system status.
 *
 * Response:
 * {
 *   status: "healthy" | "degraded" | "unhealthy",
 *   timestamp: "2026-03-20T...",
 *   checks: {
 *     database: { status, message },
 *     priceMappings: { status, message, productCount, planCount },
 *     webhookSecrets: { status, message },
 *     apiKeys: { status, message, count }
 *   }
 * }
 */

import { checkBillingHealth } from "@/lib/billing/health";
import { getMetrics } from "@/lib/billing/logger";

export async function GET() {
  try {
    const health = await checkBillingHealth();
    const metrics = getMetrics();

    // Add metrics to response
    health.metrics = {
      successfulPayments: metrics.successfulPayments,
      failedPayments: metrics.failedPayments.size,
      apiKeysIssued: metrics.apiKeysIssued,
      apiKeysReused: metrics.apiKeysReused,
    };

    return Response.json(health, {
      status: health.status === "healthy" ? 200 : 503,
    });
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 }
    );
  }
}
