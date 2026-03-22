/**
 * Billing Logger - Structured logging for billing operations
 *
 * Provides consistent log prefixes and metrics tracking for all billing-related operations.
 * All logs use the format: [billing:module] message
 *
 * Modules:
 * - webhook:paddle - Paddle webhook events
 * - webhook:dodo - DoDo webhook events
 * - subscription - Subscription handling
 * - apikey - API key operations
 * - health - Health check operations
 */

/**
 * Billing metrics - tracked via structured logs
 * In production, these would be sent to a metrics service (Datadog, New Relic, etc.)
 */
export interface BillingMetrics {
  successfulPayments: number;
  failedPayments: Map<string, number>; // reason -> count
  apiKeysIssued: number;
  apiKeysReused: number;
  webhookErrors: Map<string, number>; // error type -> count
}

// In-memory metrics (reset on app restart)
// TODO: Persist to database or send to metrics service
const metrics: BillingMetrics = {
  successfulPayments: 0,
  failedPayments: new Map(),
  apiKeysIssued: 0,
  apiKeysReused: 0,
  webhookErrors: new Map(),
};

/**
 * Log levels
 */
type LogLevel = "info" | "warn" | "error" | "debug";

/**
 * Format a log message with billing prefix
 *
 * @param module - Module name (e.g., "webhook:paddle", "subscription", "apikey")
 * @param level - Log level
 * @param message - Log message
 * @param data - Optional data to log
 */
function formatLog(
  module: string,
  level: LogLevel,
  message: string,
  data?: unknown
): string {
  const timestamp = new Date().toISOString();
  const prefix = `[billing:${module}]`;
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  return `${timestamp} ${prefix} ${message}${dataStr}`;
}

/**
 * Log an info message
 */
export function logInfo(
  module: string,
  message: string,
  data?: unknown
): void {
  console.log(formatLog(module, "info", message, data));
}

/**
 * Log a warning message
 */
export function logWarn(
  module: string,
  message: string,
  data?: unknown
): void {
  console.warn(formatLog(module, "warn", message, data));
}

/**
 * Log an error message
 */
export function logError(
  module: string,
  message: string,
  data?: unknown
): void {
  console.error(formatLog(module, "error", message, data));
}

/**
 * Log a debug message (only in development)
 */
export function logDebug(
  module: string,
  message: string,
  data?: unknown
): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(formatLog(module, "debug", message, data));
  }
}

/**
 * Record a successful payment event
 *
 * @param provider - Payment provider (paddle, dodo)
 * @param productKey - Product key
 * @param planSlug - Plan slug
 */
export function recordSuccessfulPayment(
  provider: string,
  productKey: string,
  planSlug: string
): void {
  metrics.successfulPayments++;
  logInfo("webhook:payment", "Successful payment recorded", {
    provider,
    productKey,
    planSlug,
    totalSuccessful: metrics.successfulPayments,
  });
}

/**
 * Record a failed payment event
 *
 * @param provider - Payment provider (paddle, dodo)
 * @param reason - Reason for failure
 * @param details - Optional details
 */
export function recordFailedPayment(
  provider: string,
  reason: string,
  details?: unknown
): void {
  const count = (metrics.failedPayments.get(reason) ?? 0) + 1;
  metrics.failedPayments.set(reason, count);
  logWarn("webhook:payment", "Failed payment recorded", {
    provider,
    reason,
    count,
    details,
  });
}

/**
 * Record an API key issuance
 *
 * @param isNew - true if newly created, false if reused
 * @param userId - User ID
 * @param planSlug - Plan slug
 */
export function recordApiKeyOperation(
  isNew: boolean,
  userId: string,
  planSlug: string
): void {
  if (isNew) {
    metrics.apiKeysIssued++;
    logInfo("apikey", "API key issued", {
      userId,
      planSlug,
      totalIssued: metrics.apiKeysIssued,
    });
  } else {
    metrics.apiKeysReused++;
    logInfo("apikey", "API key reused", {
      userId,
      planSlug,
      totalReused: metrics.apiKeysReused,
    });
  }
}

/**
 * Record a webhook error
 *
 * @param provider - Payment provider (paddle, dodo)
 * @param errorType - Type of error
 * @param message - Error message
 */
export function recordWebhookError(
  provider: string,
  errorType: string,
  message: string
): void {
  const count = (metrics.webhookErrors.get(errorType) ?? 0) + 1;
  metrics.webhookErrors.set(errorType, count);
  logError(`webhook:${provider}`, `Webhook error: ${errorType}`, {
    message,
    count,
  });
}

/**
 * Get current metrics
 *
 * @returns Current metrics snapshot
 */
export function getMetrics(): BillingMetrics {
  return {
    successfulPayments: metrics.successfulPayments,
    failedPayments: new Map(metrics.failedPayments),
    apiKeysIssued: metrics.apiKeysIssued,
    apiKeysReused: metrics.apiKeysReused,
    webhookErrors: new Map(metrics.webhookErrors),
  };
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics(): void {
  metrics.successfulPayments = 0;
  metrics.failedPayments.clear();
  metrics.apiKeysIssued = 0;
  metrics.apiKeysReused = 0;
  metrics.webhookErrors.clear();
  logInfo("health", "Metrics reset");
}

/**
 * Format metrics for display
 *
 * @returns Formatted metrics string
 */
export function formatMetrics(): string {
  const failedReasons = Array.from(metrics.failedPayments.entries())
    .map(([reason, count]) => `${reason}: ${count}`)
    .join(", ");

  const webhookErrorTypes = Array.from(metrics.webhookErrors.entries())
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  return `
Billing Metrics:
  Successful Payments: ${metrics.successfulPayments}
  Failed Payments: ${metrics.failedPayments.size > 0 ? failedReasons : "0"}
  API Keys Issued: ${metrics.apiKeysIssued}
  API Keys Reused: ${metrics.apiKeysReused}
  Webhook Errors: ${metrics.webhookErrors.size > 0 ? webhookErrorTypes : "0"}
  `;
}
