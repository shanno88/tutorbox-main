/**
 * Issue API Key for Subscription
 *
 * Handles API key issuance and rotation for successful subscriptions.
 * Designed to be idempotent: avoids creating duplicate keys for the same user+plan.
 *
 * Strategy:
 * 1. Check if an active API key already exists for this user+plan
 * 2. If yes, return the existing key (idempotent)
 * 3. If no, generate a new key and store it
 *
 * This prevents duplicate keys from being issued if the same webhook is processed multiple times.
 */

import { db } from "@/db";
import { apiKeys, plans } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateApiKey, hashApiKey } from "@/lib/billing/apiKeyGenerator";
import type { SubscriptionDescriptor } from "@/lib/billing/model";
import { logInfo, logError, recordApiKeyOperation } from "@/lib/billing/logger";

/**
 * Result of issuing an API key for a subscription
 */
export interface IssueApiKeyResult {
  success: boolean;
  apiKeyId?: number;
  apiKey?: string; // Unhashed key (only returned on first issuance)
  isNew?: boolean; // true if newly created, false if reused existing
  error?: string;
  reason?: string;
}

/**
 * Issue or reuse an API key for a subscription
 *
 * This function is idempotent:
 * - If an active key already exists for this user+plan, return it (without the unhashed key)
 * - If no key exists, generate a new one and store it
 *
 * This prevents duplicate keys from being issued if the same webhook is processed multiple times.
 *
 * @param subscription - Subscription descriptor with user, plan, and product info
 * @returns Result with API key ID and optionally the unhashed key (only on first issuance)
 */
export async function issueApiKeyForSubscription(
  subscription: SubscriptionDescriptor
): Promise<IssueApiKeyResult> {
  const logPrefix = "apikey";

  try {
    logInfo(
      logPrefix,
      `Processing subscription for userId=${subscription.userId}, planSlug=${subscription.planSlug}`
    );

    // ─── STEP 1: Lookup plan by slug ──────────────────────────────────────
    const plan = await db.query.plans.findFirst({
      where: eq(plans.slug, subscription.planSlug),
    });

    if (!plan) {
      logError(
        logPrefix,
        `Plan not found: ${subscription.planSlug}`
      );
      return {
        success: false,
        error: "Plan not found",
        reason: `No plan found with slug: ${subscription.planSlug}`,
      };
    }

    logInfo(
      logPrefix,
      `Found plan: ${plan.name} (id=${plan.id})`
    );

    // ─── STEP 2: Check for existing active API key ────────────────────────
    const existingKey = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.userId, subscription.userId),
        eq(apiKeys.planId, plan.id),
        eq(apiKeys.status, "active")
      ),
    });

    if (existingKey) {
      logInfo(
        logPrefix,
        `Found existing active API key: keyId=${existingKey.id} (idempotent reuse)`
      );
      recordApiKeyOperation(false, subscription.userId, subscription.planSlug);
      return {
        success: true,
        apiKeyId: existingKey.id,
        isNew: false,
      };
    }

    logInfo(
      logPrefix,
      `No existing active key found, generating new one`
    );

    // ─── STEP 3: Generate new API key ────────────────────────────────────
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);

    logInfo(
      logPrefix,
      `Generated new API key for userId=${subscription.userId}, planId=${plan.id}`
    );

    // ─── STEP 4: Store in database ───────────────────────────────────────
    await db.insert(apiKeys).values({
      userId: subscription.userId,
      planId: plan.id,
      keyHash,
      status: "active",
    });

    // ─── STEP 5: Query back to get the inserted ID ───────────────────────
    const insertedKey = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.keyHash, keyHash),
    });

    if (!insertedKey) {
      logError(
        logPrefix,
        `Failed to retrieve inserted API key`
      );
      return {
        success: false,
        error: "Failed to retrieve API key",
        reason: "Could not find inserted key in database",
      };
    }

    logInfo(
      logPrefix,
      `Successfully issued new API key: keyId=${insertedKey.id}`
    );

    recordApiKeyOperation(true, subscription.userId, subscription.planSlug);

    return {
      success: true,
      apiKeyId: insertedKey.id,
      apiKey,
      isNew: true,
    };
  } catch (error) {
    logError(logPrefix, `Error issuing API key:`, error);
    return {
      success: false,
      error: "Unexpected error",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Mask an API key for logging
 *
 * Shows only the first 8 and last 4 characters, masks the rest.
 * Example: tutorbox_a1b2c3d4...m3n4o5p6
 *
 * @param apiKey - Unhashed API key
 * @returns Masked API key for safe logging
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return "***";
  }
  const start = apiKey.substring(0, 8);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}...${end}`;
}

/**
 * Log API key issuance safely
 *
 * Logs the result of API key issuance without exposing the full key.
 *
 * @param result - Result from issueApiKeyForSubscription
 */
export function logApiKeyIssuance(result: IssueApiKeyResult): void {
  const logPrefix = "apikey";

  if (!result.success) {
    logError(logPrefix, `Failed to issue API key: ${result.error}`);
    return;
  }

  const keyStatus = result.isNew ? "newly created" : "reused existing";
  const maskedKey = result.apiKey ? maskApiKey(result.apiKey) : "N/A";

  logInfo(
    logPrefix,
    `API key ${keyStatus}: keyId=${result.apiKeyId}, key=${maskedKey}`
  );
}
