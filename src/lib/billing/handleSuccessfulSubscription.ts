/**
 * Handle Successful Subscription
 *
 * Generic function to process a successful subscription payment.
 * Handles:
 * 1. Upserting subscription record in the database
 * 2. Issuing or reusing an API key for the user and plan
 * 3. Logging the operation for audit trail
 *
 * This is the main entry point for processing successful payments from any provider
 * (Paddle, DoDo, etc.) after the subscription descriptor has been extracted.
 *
 * Design:
 * - Generic: works with any provider (Paddle, DoDo, etc.)
 * - Idempotent: safe to call multiple times for the same subscription
 * - Logged: all operations logged for audit trail
 * - Safe: no sensitive data logged
 */

import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SubscriptionDescriptor } from "@/lib/billing/model";
import {
  issueApiKeyForSubscription,
  logApiKeyIssuance,
} from "@/lib/billing/issueApiKeyForSubscription";
import {
  logInfo,
  logError,
  recordSuccessfulPayment,
  recordFailedPayment,
} from "@/lib/billing/logger";

/**
 * Context for handling a successful subscription
 *
 * Contains the subscription descriptor and the original provider payload
 * for logging and debugging purposes.
 */
export interface SuccessfulSubscriptionContext {
  /** Subscription descriptor extracted from provider webhook */
  subscription: SubscriptionDescriptor;

  /** Original provider payload (for logging/debugging) */
  rawEvent: unknown;
}

/**
 * Result of handling a successful subscription
 */
export interface HandleSuccessfulSubscriptionResult {
  success: boolean;
  userId?: string;
  planSlug?: string;
  apiKeyId?: number;
  subscriptionId?: string;
  error?: string;
  reason?: string;
}

/**
 * Handle a successful subscription payment
 *
 * This is the main entry point for processing successful payments.
 * It:
 * 1. Upserts the subscription record in the database
 * 2. Issues or reuses an API key for the user and plan
 * 3. Logs the operation for audit trail
 *
 * The function is idempotent: it's safe to call multiple times for the same subscription.
 * If the subscription already exists, it will be updated. If an API key already exists,
 * it will be reused.
 *
 * @param ctx - Context with subscription descriptor and raw event
 * @returns Result of the operation
 */
export async function handleSuccessfulSubscription(
  ctx: SuccessfulSubscriptionContext
): Promise<HandleSuccessfulSubscriptionResult> {
  const logPrefix = "subscription";
  const { subscription } = ctx;

  try {
    logInfo(
      logPrefix,
      `Processing successful subscription: userId=${subscription.userId}, productKey=${subscription.productKey}, planSlug=${subscription.planSlug}`
    );

    // ─── STEP 1: Upsert subscription record ────────────────────────────────
    if (subscription.provider === "paddle") {
      logInfo(
        logPrefix,
        `Upserting Paddle subscription record: subscriptionId=${subscription.providerSubscriptionId}`
      );

      const paddleCustomerId = "placeholder"; // TODO: Extract from rawEvent
      const currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // TODO: Extract from rawEvent

      await db
        .insert(subscriptions)
        .values({
          userId: subscription.userId,
          paddleSubscriptionId: subscription.providerSubscriptionId,
          paddleCustomerId,
          paddlePriceId: "", // TODO: Extract from context
          currentPeriodEnd,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            paddleSubscriptionId: subscription.providerSubscriptionId,
            paddleCustomerId,
            currentPeriodEnd,
          },
        });

      logInfo(
        logPrefix,
        `Upserted subscription record for userId=${subscription.userId}`
      );
    } else {
      logInfo(
        logPrefix,
        `Skipping subscription record upsert for provider: ${subscription.provider} (not yet implemented)`
      );
    }

    // ─── STEP 2: Issue or reuse API key ────────────────────────────────────
    const apiKeyResult = await issueApiKeyForSubscription(subscription);

    if (!apiKeyResult.success) {
      logError(
        logPrefix,
        `Failed to issue API key: ${apiKeyResult.error}`
      );
      recordFailedPayment(
        subscription.provider,
        "api_key_issuance_failed",
        apiKeyResult.reason
      );
      return {
        success: false,
        userId: subscription.userId,
        planSlug: subscription.planSlug,
        error: "API key issuance failed",
        reason: apiKeyResult.reason,
      };
    }

    logInfo(
      logPrefix,
      `Successfully issued API key: keyId=${apiKeyResult.apiKeyId}, isNew=${apiKeyResult.isNew}`
    );

    // ─── STEP 3: Log the operation ─────────────────────────────────────────
    logApiKeyIssuance(apiKeyResult);

    if (apiKeyResult.apiKeyId) {
      logSuccessfulSubscription({
        provider: subscription.provider,
        userId: subscription.userId,
        productKey: subscription.productKey,
        planSlug: subscription.planSlug,
        subscriptionId: subscription.providerSubscriptionId,
        apiKeyId: apiKeyResult.apiKeyId,
        isNewKey: apiKeyResult.isNew ?? false,
      });

      // Record successful payment metric
      recordSuccessfulPayment(
        subscription.provider,
        subscription.productKey,
        subscription.planSlug
      );
    }

    return {
      success: true,
      userId: subscription.userId,
      planSlug: subscription.planSlug,
      apiKeyId: apiKeyResult.apiKeyId,
      subscriptionId: subscription.providerSubscriptionId,
    };
  } catch (error) {
    logError(logPrefix, `Unexpected error:`, error);
    recordFailedPayment(
      subscription.provider,
      "unexpected_error",
      error instanceof Error ? error.message : String(error)
    );
    return {
      success: false,
      userId: subscription.userId,
      planSlug: subscription.planSlug,
      error: "Unexpected error",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Log successful subscription handling
 *
 * Logs subscription information for audit trail.
 * Does NOT log sensitive information like API keys.
 *
 * @param info - Subscription information to log
 */
function logSuccessfulSubscription(info: {
  provider: string;
  userId: string;
  productKey: string;
  planSlug: string;
  subscriptionId: string;
  apiKeyId: number;
  isNewKey: boolean;
}): void {
  const logEntry = {
    provider: info.provider,
    userId: info.userId,
    productKey: info.productKey,
    planSlug: info.planSlug,
    subscriptionId: info.subscriptionId,
    apiKeyId: info.apiKeyId,
    isNewKey: info.isNewKey,
    timestamp: new Date().toISOString(),
  };

  logInfo("subscription", "Subscription success", logEntry);

  // TODO: Store in audit log table for compliance
  // - Log all subscription events
  // - Include: provider, userId, productKey, planSlug, timestamp
  // - Do NOT log: API keys, secrets, sensitive data
}
