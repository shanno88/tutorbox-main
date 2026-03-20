/**
 * Issue API Key from Webhook - Scaffolding Module
 *
 * This module handles the business logic for issuing API keys after successful payments.
 * Currently a scaffolding/stub implementation - ready for real business logic to be plugged in.
 *
 * Flow:
 * 1. Webhook handler receives payment event (Paddle/DoDo)
 * 2. Webhook handler maps priceId → productKey
 * 3. Webhook handler constructs ProviderWebhookContext
 * 4. Webhook handler calls handleSuccessfulPayment(ctx)
 * 5. This module:
 *    - Looks up userId from userIdentifier (email)
 *    - Maps productKey → planSlug
 *    - Issues API key for the plan
 *    - Logs the operation
 *
 * TODO: Implement real business logic
 * - [ ] Lookup userId from email
 * - [ ] Map productKey → planSlug
 * - [ ] Call issue-api-key function
 * - [ ] Handle free trials
 * - [ ] Handle refunds
 * - [ ] Handle subscription cancellations
 * - [ ] Handle plan upgrades/downgrades
 */

import { db } from "@/db";
import { users, apiKeys, plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateApiKey, hashApiKey } from "@/lib/billing/apiKeyGenerator";
import {
  ProviderWebhookContext,
  PaymentHandlingResult,
} from "@/lib/billing/model";

// Re-export types from model.ts for convenience
export type { ProviderWebhookContext, PaymentHandlingResult };

/**
 * Handle a successful payment from a webhook
 *
 * This is the main entry point for webhook handlers after they've:
 * 1. Verified the webhook signature
 * 2. Mapped priceId → productKey
 * 3. Extracted the user identifier
 *
 * @param ctx - Webhook context with payment information
 * @returns Result of the operation
 *
 * TODO: Implement real business logic
 * - Lookup userId from userIdentifier (email)
 * - Map productKey → planSlug
 * - Call issue-api-key function
 * - Handle edge cases (user not found, plan not found, etc.)
 */
export async function handleSuccessfulPayment(
  ctx: ProviderWebhookContext
): Promise<PaymentHandlingResult> {
  const logPrefix = `[handleSuccessfulPayment] [${ctx.provider}]`;

  try {
    console.log(
      `${logPrefix} Processing payment: productKey=${ctx.productKey}, userIdentifier=${ctx.userIdentifier}`
    );

    // ─── STEP 1: Lookup userId from userIdentifier (email) ───────────────────
    // TODO: Implement user lookup
    // Currently stubbed - need to query users table by email
    const userId = await lookupUserIdFromIdentifier(ctx.userIdentifier);

    if (!userId) {
      console.warn(
        `${logPrefix} User not found for identifier: ${ctx.userIdentifier}`
      );
      return {
        success: false,
        error: "User not found",
        reason: `No user found with identifier: ${ctx.userIdentifier}`,
      };
    }

    console.log(`${logPrefix} Found userId: ${userId}`);

    // ─── STEP 2: Map productKey → planSlug ─────────────────────────────────
    // TODO: Implement productKey → planSlug mapping
    // Currently stubbed - need to determine which plan to issue for this product
    const planSlug = await mapProductKeyToPlanSlug(ctx.productKey);

    if (!planSlug) {
      console.error(
        `${logPrefix} Cannot map productKey to planSlug: ${ctx.productKey}`
      );
      return {
        success: false,
        error: "Plan mapping failed",
        reason: `No plan mapping found for productKey: ${ctx.productKey}`,
      };
    }

    console.log(`${logPrefix} Mapped productKey → planSlug: ${planSlug}`);

    // ─── STEP 3: Lookup plan from planSlug ────────────────────────────────
    // TODO: Verify plan exists in database
    const plan = await db.query.plans.findFirst({
      where: eq(plans.slug, planSlug),
    });

    if (!plan) {
      console.error(`${logPrefix} Plan not found: ${planSlug}`);
      return {
        success: false,
        error: "Plan not found",
        reason: `Plan not found in database: ${planSlug}`,
      };
    }

    console.log(`${logPrefix} Found plan: ${plan.name} (id=${plan.id})`);

    // ─── STEP 4: Issue API key ─────────────────────────────────────────────
    // TODO: Implement issue-api-key logic
    // Currently stubbed - need to:
    // - Generate API key
    // - Hash it
    // - Store in database
    // - Return key to user (via email or other means)
    const apiKeyResult = await issueApiKeyForPlan(userId, plan.id);

    if (!apiKeyResult.success) {
      console.error(
        `${logPrefix} Failed to issue API key: ${apiKeyResult.error}`
      );
      return {
        success: false,
        error: "API key issuance failed",
        reason: apiKeyResult.error,
      };
    }

    console.log(
      `${logPrefix} Successfully issued API key: keyId=${apiKeyResult.apiKeyId}`
    );

    // ─── STEP 5: Log the successful operation ──────────────────────────────
    logPaymentSuccess({
      provider: ctx.provider,
      userId,
      productKey: ctx.productKey,
      planSlug,
      priceId: ctx.priceId,
      subscriptionId: ctx.subscriptionId,
      transactionId: ctx.transactionId,
      apiKeyId: apiKeyResult.apiKeyId,
    });

    return {
      success: true,
      userId,
      planSlug,
      apiKeyId: apiKeyResult.apiKeyId,
    };
  } catch (error) {
    console.error(`${logPrefix} Unexpected error:`, error);
    return {
      success: false,
      error: "Unexpected error",
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Lookup userId from user identifier (email)
 *
 * Queries the users table by email to find the user ID.
 * If user doesn't exist, returns undefined (webhook handler should handle this).
 *
 * @param userIdentifier - Email or external user ID
 * @returns userId or undefined if not found
 */
async function lookupUserIdFromIdentifier(
  userIdentifier: string
): Promise<string | undefined> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, userIdentifier),
    });

    if (!user) {
      console.warn(
        `[lookupUserIdFromIdentifier] User not found with email: ${userIdentifier}`
      );
      return undefined;
    }

    console.log(
      `[lookupUserIdFromIdentifier] Found user: ${user.id} (${user.email})`
    );
    return user.id;
  } catch (error) {
    console.error(
      `[lookupUserIdFromIdentifier] Error looking up user: ${error}`
    );
    return undefined;
  }
}

/**
 * Map productKey to planSlug
 *
 * Determines which plan to issue for a given product.
 * Currently uses a simple mapping, but can be extended to consider:
 * - Currency (USD vs CNY)
 * - Billing period (yearly vs monthly)
 * - User preferences
 *
 * Mapping:
 * - grammar-master → grammar-master-yearly-usd (default)
 * - lease-ai → lease-ai-onetime-usd
 * - ai-prompter → ai-prompter-yearly-cny
 *
 * @param productKey - Internal product key
 * @returns planSlug or undefined if no mapping
 */
async function mapProductKeyToPlanSlug(
  productKey: string
): Promise<string | undefined> {
  // Map products to their default plans
  // TODO: Consider currency, billing period, user preferences
  const mapping: Record<string, string> = {
    "grammar-master": "grammar-master-yearly-usd",
    "lease-ai": "lease-ai-onetime-usd",
    "ai-prompter": "ai-prompter-yearly-cny",
  };

  const planSlug = mapping[productKey];

  if (!planSlug) {
    console.warn(
      `[mapProductKeyToPlanSlug] No mapping found for productKey: ${productKey}`
    );
    return undefined;
  }

  console.log(
    `[mapProductKeyToPlanSlug] Mapped ${productKey} → ${planSlug}`
  );
  return planSlug;
}

/**
 * Issue API key for a plan
 *
 * Generates a new API key, hashes it, and stores it in the database.
 * Returns the unhashed key (to send to user) and the key ID (for tracking).
 *
 * @param userId - User ID
 * @param planId - Plan ID
 * @returns Result with apiKeyId and unhashed key, or error
 */
async function issueApiKeyForPlan(
  userId: string,
  planId: number
): Promise<{
  success: boolean;
  apiKeyId?: number;
  apiKey?: string;
  error?: string;
}> {
  try {
    // Generate a new API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);

    console.log(
      `[issueApiKeyForPlan] Generating API key for userId=${userId}, planId=${planId}`
    );

    // Store in database
    await db.insert(apiKeys).values({
      userId,
      planId,
      keyHash,
      status: "active",
    });

    // Query back to get the inserted ID
    const insertedKey = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.keyHash, keyHash),
    });

    if (!insertedKey) {
      console.error(
        `[issueApiKeyForPlan] Failed to retrieve inserted API key`
      );
      return {
        success: false,
        error: "Failed to retrieve API key",
      };
    }

    console.log(
      `[issueApiKeyForPlan] Successfully issued API key: keyId=${insertedKey.id}`
    );

    return {
      success: true,
      apiKeyId: insertedKey.id,
      apiKey, // Unhashed key to send to user
    };
  } catch (error) {
    console.error(`[issueApiKeyForPlan] Error issuing API key:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Log successful payment handling
 *
 * Logs payment information for auditing and debugging.
 * Does NOT log sensitive information like API keys.
 *
 * TODO: Store in audit log table for compliance
 *
 * @param info - Payment information to log
 */
function logPaymentSuccess(info: {
  provider: string;
  userId: string;
  productKey: string;
  planSlug: string;
  priceId: string;
  subscriptionId?: string;
  transactionId?: string;
  apiKeyId?: number;
}): void {
  const logEntry = {
    provider: info.provider,
    userId: info.userId,
    productKey: info.productKey,
    planSlug: info.planSlug,
    priceId: info.priceId,
    subscriptionId: info.subscriptionId,
    transactionId: info.transactionId,
    apiKeyId: info.apiKeyId,
    timestamp: new Date().toISOString(),
  };

  console.log("[Payment Success]", logEntry);

  // TODO: Store in audit log table for compliance
  // - Log all payment events
  // - Include: provider, userId, productKey, planSlug, timestamp
  // - Do NOT log: API keys, secrets, sensitive data
  // Example:
  // await db.insert(paymentAuditLog).values({
  //   provider: info.provider,
  //   userId: info.userId,
  //   productKey: info.productKey,
  //   planSlug: info.planSlug,
  //   priceId: info.priceId,
  //   subscriptionId: info.subscriptionId,
  //   transactionId: info.transactionId,
  //   apiKeyId: info.apiKeyId,
  //   createdAt: new Date(),
  // });
}

/**
 * Handle subscription cancellation
 *
 * TODO: Implement cancellation logic
 * - Revoke API keys for this user/product
 * - Update subscription status
 * - Send notification to user
 *
 * @param ctx - Webhook context
 */
export async function handleSubscriptionCancellation(
  ctx: ProviderWebhookContext
): Promise<PaymentHandlingResult> {
  const logPrefix = `[handleSubscriptionCancellation] [${ctx.provider}]`;

  console.log(
    `${logPrefix} TODO: Implement subscription cancellation logic for productKey=${ctx.productKey}`
  );

  // TODO: Implement real cancellation logic
  // - Lookup userId
  // - Lookup API keys for this user/product
  // - Revoke or delete API keys
  // - Update subscription status
  // - Send notification

  return {
    success: false,
    error: "Subscription cancellation not yet implemented",
    reason: "TODO: Implement cancellation logic",
  };
}

/**
 * Handle refund
 *
 * TODO: Implement refund logic
 * - Revoke API keys
 * - Update subscription status
 * - Send notification to user
 *
 * @param ctx - Webhook context
 */
export async function handleRefund(
  ctx: ProviderWebhookContext
): Promise<PaymentHandlingResult> {
  const logPrefix = `[handleRefund] [${ctx.provider}]`;

  console.log(
    `${logPrefix} TODO: Implement refund logic for productKey=${ctx.productKey}`
  );

  // TODO: Implement real refund logic
  // - Lookup userId
  // - Lookup API keys for this user/product
  // - Revoke or delete API keys
  // - Update subscription status
  // - Send notification

  return {
    success: false,
    error: "Refund handling not yet implemented",
    reason: "TODO: Implement refund logic",
  };
}

/**
 * Handle plan upgrade/downgrade
 *
 * TODO: Implement upgrade/downgrade logic
 * - Lookup userId
 * - Determine new plan
 * - Update API key limits
 * - Send notification to user
 *
 * @param ctx - Webhook context
 * @param newProductKey - New product key after upgrade/downgrade
 */
export async function handlePlanChange(
  ctx: ProviderWebhookContext,
  newProductKey: string
): Promise<PaymentHandlingResult> {
  const logPrefix = `[handlePlanChange] [${ctx.provider}]`;

  console.log(
    `${logPrefix} TODO: Implement plan change logic from ${ctx.productKey} to ${newProductKey}`
  );

  // TODO: Implement real plan change logic
  // - Lookup userId
  // - Determine new plan
  // - Update API key limits
  // - Send notification

  return {
    success: false,
    error: "Plan change handling not yet implemented",
    reason: "TODO: Implement plan change logic",
  };
}

/**
 * Handle free trial
 *
 * TODO: Implement free trial logic
 * - Create trial API key with limited quota
 * - Set expiration date
 * - Send notification to user
 *
 * @param ctx - Webhook context
 * @param trialDays - Number of days for trial
 */
export async function handleFreeTrial(
  ctx: ProviderWebhookContext,
  trialDays: number = 7
): Promise<PaymentHandlingResult> {
  const logPrefix = `[handleFreeTrial] [${ctx.provider}]`;

  console.log(
    `${logPrefix} TODO: Implement free trial logic for ${trialDays} days`
  );

  // TODO: Implement real free trial logic
  // - Lookup userId
  // - Create trial API key with limited quota
  // - Set expiration date
  // - Send notification

  return {
    success: false,
    error: "Free trial handling not yet implemented",
    reason: "TODO: Implement free trial logic",
  };
}
