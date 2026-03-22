/**
 * Billing Health Check
 *
 * Provides a simple health check for the billing system.
 * Can be called in staging to verify:
 * - Database connectivity
 * - Price mappings are configured
 * - Webhook secrets are present
 * - API keys table is accessible
 */

import { db } from "@/db";
import { subscriptions, apiKeys, plans } from "@/db/schema";
import { env } from "@/env";
import {
  getAllProductKeys,
  getAllPlanSlugs,
  logAllMappings,
} from "@/lib/billing/priceMaps";
import { logInfo, logError } from "@/lib/billing/logger";

/**
 * Health check result
 */
export interface BillingHealthResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: {
      status: "ok" | "error";
      message: string;
    };
    priceMappings: {
      status: "ok" | "error";
      message: string;
      productCount?: number;
      planCount?: number;
    };
    webhookSecrets: {
      status: "ok" | "error";
      message: string;
    };
    apiKeys: {
      status: "ok" | "error";
      message: string;
      count?: number;
    };
  };
  metrics?: {
    successfulPayments: number;
    failedPayments: number;
    apiKeysIssued: number;
    apiKeysReused: number;
  };
}

/**
 * Run a billing health check
 *
 * @returns Health check result
 */
export async function checkBillingHealth(): Promise<BillingHealthResult> {
  const logPrefix = "health";
  const result: BillingHealthResult = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: "ok", message: "Not checked" },
      priceMappings: { status: "ok", message: "Not checked" },
      webhookSecrets: { status: "ok", message: "Not checked" },
      apiKeys: { status: "ok", message: "Not checked" },
    },
  };

  // ─── CHECK 1: Database Connectivity ────────────────────────────────────
  try {
    logInfo(logPrefix, "Checking database connectivity...");

    // Try to query subscriptions table
    const subCount = await db.query.subscriptions.findFirst();
    logInfo(logPrefix, "Subscriptions table accessible");

    // Try to query apiKeys table
    const keyCount = await db.query.apiKeys.findFirst();
    logInfo(logPrefix, "API keys table accessible");

    // Try to query plans table
    const planCount = await db.query.plans.findFirst();
    logInfo(logPrefix, "Plans table accessible");

    result.checks.database = {
      status: "ok",
      message: "Database connectivity OK",
    };
  } catch (error) {
    logError(logPrefix, "Database connectivity check failed", error);
    result.checks.database = {
      status: "error",
      message: `Database error: ${error instanceof Error ? error.message : String(error)}`,
    };
    result.status = "unhealthy";
  }

  // ─── CHECK 2: Price Mappings ──────────────────────────────────────────
  try {
    logInfo(logPrefix, "Checking price mappings...");

    const productKeys = getAllProductKeys();
    const planSlugs = getAllPlanSlugs();

    if (productKeys.length === 0 || planSlugs.length === 0) {
      logError(logPrefix, "Price mappings are empty", {
        productKeys: productKeys.length,
        planSlugs: planSlugs.length,
      });
      result.checks.priceMappings = {
        status: "error",
        message: "Price mappings are empty or incomplete",
        productCount: productKeys.length,
        planCount: planSlugs.length,
      };
      result.status = "degraded";
    } else {
      logInfo(logPrefix, "Price mappings OK", {
        productKeys: productKeys.length,
        planSlugs: planSlugs.length,
      });
      result.checks.priceMappings = {
        status: "ok",
        message: "Price mappings configured",
        productCount: productKeys.length,
        planCount: planSlugs.length,
      };
    }
  } catch (error) {
    logError(logPrefix, "Price mappings check failed", error);
    result.checks.priceMappings = {
      status: "error",
      message: `Mappings error: ${error instanceof Error ? error.message : String(error)}`,
    };
    result.status = "degraded";
  }

  // ─── CHECK 3: Webhook Secrets ─────────────────────────────────────────
  try {
    logInfo(logPrefix, "Checking webhook secrets...");

    const paddleSecret = env.PADDLE_WEBHOOK_SECRET;
    // Note: DODO_WEBHOOK_SECRET may not be in env yet, so we check if it exists
    const dodoSecret = (env as any).DODO_WEBHOOK_SECRET;

    if (!paddleSecret && !dodoSecret) {
      logError(logPrefix, "No webhook secrets configured");
      result.checks.webhookSecrets = {
        status: "error",
        message: "No webhook secrets configured (PADDLE_WEBHOOK_SECRET or DODO_WEBHOOK_SECRET)",
      };
      result.status = "degraded";
    } else {
      const configured = [];
      if (paddleSecret) configured.push("Paddle");
      if (dodoSecret) configured.push("DoDo");

      logInfo(logPrefix, "Webhook secrets configured", {
        providers: configured,
      });
      result.checks.webhookSecrets = {
        status: "ok",
        message: `Webhook secrets configured for: ${configured.join(", ")}`,
      };
    }
  } catch (error) {
    logError(logPrefix, "Webhook secrets check failed", error);
    result.checks.webhookSecrets = {
      status: "error",
      message: `Secrets check error: ${error instanceof Error ? error.message : String(error)}`,
    };
    result.status = "degraded";
  }

  // ─── CHECK 4: API Keys Table ──────────────────────────────────────────
  try {
    logInfo(logPrefix, "Checking API keys table...");

    // Count active API keys
    const allKeys = await db.query.apiKeys.findMany();
    const activeKeys = allKeys.filter((k) => k.status === "active");

    logInfo(logPrefix, "API keys table accessible", {
      total: allKeys.length,
      active: activeKeys.length,
    });

    result.checks.apiKeys = {
      status: "ok",
      message: `API keys table accessible (${activeKeys.length} active keys)`,
      count: activeKeys.length,
    };
  } catch (error) {
    logError(logPrefix, "API keys table check failed", error);
    result.checks.apiKeys = {
      status: "error",
      message: `API keys error: ${error instanceof Error ? error.message : String(error)}`,
    };
    result.status = "unhealthy";
  }

  // ─── FINAL STATUS ─────────────────────────────────────────────────────
  const allChecks = Object.values(result.checks);
  const errorCount = allChecks.filter((c) => c.status === "error").length;

  if (errorCount > 0) {
    if (result.status === "healthy") {
      result.status = "degraded";
    }
  }

  logInfo(logPrefix, "Health check complete", {
    status: result.status,
    errors: errorCount,
  });

  return result;
}

/**
 * Format health check result for display
 *
 * @param result - Health check result
 * @returns Formatted string
 */
export function formatHealthResult(result: BillingHealthResult): string {
  const lines = [
    `\n=== Billing Health Check ===`,
    `Status: ${result.status.toUpperCase()}`,
    `Timestamp: ${result.timestamp}`,
    ``,
    `Database: ${result.checks.database.status} - ${result.checks.database.message}`,
    `Price Mappings: ${result.checks.priceMappings.status} - ${result.checks.priceMappings.message}`,
    `  Products: ${result.checks.priceMappings.productCount ?? "N/A"}`,
    `  Plans: ${result.checks.priceMappings.planCount ?? "N/A"}`,
    `Webhook Secrets: ${result.checks.webhookSecrets.status} - ${result.checks.webhookSecrets.message}`,
    `API Keys: ${result.checks.apiKeys.status} - ${result.checks.apiKeys.message}`,
    `  Active Keys: ${result.checks.apiKeys.count ?? "N/A"}`,
  ];

  if (result.metrics) {
    lines.push(``);
    lines.push(`Metrics:`);
    lines.push(`  Successful Payments: ${result.metrics.successfulPayments}`);
    lines.push(`  Failed Payments: ${result.metrics.failedPayments}`);
    lines.push(`  API Keys Issued: ${result.metrics.apiKeysIssued}`);
    lines.push(`  API Keys Reused: ${result.metrics.apiKeysReused}`);
  }

  lines.push(`\n`);
  return lines.join("\n");
}
