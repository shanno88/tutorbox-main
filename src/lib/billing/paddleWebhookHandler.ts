/**
 * Paddle Webhook Handler - Extract and Process Paddle Events
 *
 * This module provides utilities to:
 * 1. Parse Paddle webhook payloads
 * 2. Extract subscription descriptors from Paddle events
 * 3. Determine if an event represents a successful payment
 *
 * Design:
 * - Pure functions: no DB writes or HTTP calls
 * - Conservative: returns null if any critical field is missing
 * - Structured logging: clear warnings for debugging
 *
 * Reference: Paddle Webhook Documentation
 * https://developer.paddle.com/webhooks/overview
 */

import type {
  SubscriptionDescriptor,
  SubscriptionStatus,
  ProductKey,
  PlanSlug,
} from "@/lib/billing/model";
import {
  getProductKeyFromPaddlePriceId,
  getPlanSlugsForProduct,
} from "@/lib/billing/priceMaps";
import { logInfo, logWarn, logError, recordWebhookError } from "@/lib/billing/logger";

/**
 * Paddle event types we care about
 *
 * Reference: https://developer.paddle.com/webhooks/events
 */
export type PaddleEventType =
  | "subscription.created"
  | "subscription.activated"
  | "subscription.trialing"
  | "subscription.updated"
  | "subscription.canceled"
  | "subscription.past_due"
  | "transaction.completed"
  | "transaction.updated"
  | "transaction.canceled"
  | string; // fallback for unknown events

/**
 * Paddle subscription object from webhook
 *
 * Reference: https://developer.paddle.com/webhooks/events/subscription-activated
 */
export interface PaddleSubscription {
  id: string; // Subscription ID
  status?: string; // "active", "trialing", "past_due", "canceled"
  items?: Array<{
    price?: {
      id: string; // Price ID (e.g., "pri_01khwk19y0af40zae5fnysj5t3")
    };
  }>;
  custom_data?: {
    userId?: string; // Our internal user ID
  };
  customer?: {
    email?: string; // Customer email
    id?: string; // Paddle customer ID
  };
}

/**
 * Paddle transaction object from webhook
 *
 * Reference: https://developer.paddle.com/webhooks/events/transaction-completed
 */
export interface PaddleTransaction {
  id: string; // Transaction ID
  status?: string; // "completed", "canceled", etc.
  items?: Array<{
    price?: {
      id: string; // Price ID
    };
  }>;
  custom_data?: {
    userId?: string; // Our internal user ID
  };
  customer?: {
    email?: string; // Customer email
    id?: string; // Paddle customer ID
  };
}

/**
 * Paddle webhook payload
 *
 * This is a minimal representation of the Paddle webhook payload.
 * We only include fields we actually use.
 *
 * Reference: https://developer.paddle.com/webhooks/overview
 */
export interface PaddleWebhookPayload {
  event_type: PaddleEventType;
  data: PaddleSubscription | PaddleTransaction;
}

/**
 * Check if a Paddle webhook payload is a subscription event
 *
 * @param payload - Paddle webhook payload
 * @returns true if this is a subscription event
 */
export function isPaddleSubscriptionEvent(
  payload: PaddleWebhookPayload
): payload is PaddleWebhookPayload & { data: PaddleSubscription } {
  const isSubscription = payload.event_type.startsWith("subscription.");
  if (isSubscription) {
    logInfo("webhook:paddle", `Detected subscription event: ${payload.event_type}`);
  }
  return isSubscription;
}

/**
 * Check if a Paddle webhook payload is a transaction event
 *
 * @param payload - Paddle webhook payload
 * @returns true if this is a transaction event
 */
export function isPaddleTransactionEvent(
  payload: PaddleWebhookPayload
): payload is PaddleWebhookPayload & { data: PaddleTransaction } {
  const isTransaction = payload.event_type.startsWith("transaction.");
  if (isTransaction) {
    logInfo("webhook:paddle", `Detected transaction event: ${payload.event_type}`);
  }
  return isTransaction;
}

/**
 * Check if a Paddle subscription is activated (successful payment)
 *
 * A subscription is considered "activated" if:
 * - Event type is "subscription.activated" or "subscription.updated"
 * - Status is "active" or "trialing"
 *
 * Reference: https://developer.paddle.com/webhooks/events/subscription-activated
 *
 * @param payload - Paddle webhook payload
 * @returns true if this represents an activated subscription
 */
export function isPaddleSubscriptionActivated(
  payload: PaddleWebhookPayload
): boolean {
  // Check event type
  if (
    payload.event_type !== "subscription.activated" &&
    payload.event_type !== "subscription.updated" &&
    payload.event_type !== "subscription.trialing"
  ) {
    return false;
  }

  // Check subscription status
  if (!isPaddleSubscriptionEvent(payload)) {
    return false;
  }

  const status = payload.data.status;
  return status === "active" || status === "trialing";
}

/**
 * Check if a Paddle transaction is completed (successful payment)
 *
 * A transaction is considered "completed" if:
 * - Event type is "transaction.completed"
 * - Status is "completed"
 *
 * Reference: https://developer.paddle.com/webhooks/events/transaction-completed
 *
 * @param payload - Paddle webhook payload
 * @returns true if this represents a completed transaction
 */
export function isPaddleTransactionCompleted(
  payload: PaddleWebhookPayload
): boolean {
  // Check event type
  if (payload.event_type !== "transaction.completed") {
    return false;
  }

  // Check transaction status
  if (!isPaddleTransactionEvent(payload)) {
    return false;
  }

  const status = payload.data.status;
  return status === "completed";
}

/**
 * Map Paddle subscription status to our internal SubscriptionStatus
 *
 * @param paddleStatus - Paddle subscription status
 * @returns Our internal SubscriptionStatus or null if unknown
 */
function mapPaddleStatusToInternal(
  paddleStatus: string | undefined
): SubscriptionStatus | null {
  switch (paddleStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return null;
  }
}

/**
 * Extract subscription descriptor from Paddle webhook payload
 *
 * This function:
 * 1. Extracts price ID from the payload
 * 2. Maps price ID to product key using centralized mapping
 * 3. Maps product key to plan slug
 * 4. Extracts user identifier (email or userId)
 * 5. Returns a SubscriptionDescriptor or null if any critical field is missing
 *
 * Conservative approach:
 * - If price ID is missing → return null
 * - If price ID mapping fails → return null
 * - If user identifier is missing → return null
 * - If plan slug cannot be determined → return null
 *
 * Pure function:
 * - No database queries
 * - No HTTP calls
 * - No side effects (only logging)
 *
 * @param payload - Paddle webhook payload
 * @returns SubscriptionDescriptor or null if extraction fails
 */
export function extractPaddleSubscriptionDescriptor(
  payload: PaddleWebhookPayload
): SubscriptionDescriptor | null {
  const logPrefix = "webhook:paddle";

  // ─── STEP 1: Extract price ID ──────────────────────────────────────────
  const priceId = payload.data.items?.[0]?.price?.id;

  if (!priceId) {
    logWarn(
      logPrefix,
      `Missing price ID in Paddle event: ${payload.event_type}`
    );
    recordWebhookError("paddle", "missing_price_id", `Event: ${payload.event_type}`);
    return null;
  }

  logInfo(logPrefix, `Extracted price ID: ${priceId}`);

  // ─── STEP 2: Map price ID to product key ──────────────────────────────
  const productKey = getProductKeyFromPaddlePriceId(priceId);

  if (!productKey) {
    logError(
      logPrefix,
      `Unknown Paddle price ID: ${priceId}. Please add to src/lib/billing/priceMaps.ts`
    );
    recordWebhookError("paddle", "unknown_price_id", `Price ID: ${priceId}`);
    return null;
  }

  logInfo(logPrefix, `Mapped price ID → product key: ${productKey}`);

  // ─── STEP 3: Map product key to plan slug ─────────────────────────────
  const planSlugs = getPlanSlugsForProduct(productKey);

  if (planSlugs.length === 0) {
    logWarn(
      logPrefix,
      `No plan slugs found for product key: ${productKey}`
    );
    recordWebhookError("paddle", "no_plan_slugs", `Product: ${productKey}`);
    return null;
  }

  const planSlug = planSlugs[0];
  logInfo(
    logPrefix,
    `Mapped product key → plan slug: ${planSlug} (picked first of ${planSlugs.length})`
  );

  // ─── STEP 4: Extract user identifier ───────────────────────────────────
  const userId = payload.data.custom_data?.userId;
  const userEmail = payload.data.customer?.email;
  const userIdentifier = userId || userEmail;

  if (!userIdentifier) {
    logWarn(
      logPrefix,
      `Missing user identifier (userId or email) in Paddle event`
    );
    recordWebhookError("paddle", "missing_user_identifier", `Event: ${payload.event_type}`);
    return null;
  }

  logInfo(logPrefix, `Extracted user identifier: ${userIdentifier}`);

  // ─── STEP 5: Extract subscription ID ───────────────────────────────────
  const subscriptionId = payload.data.id;

  if (!subscriptionId) {
    logWarn(logPrefix, `Missing subscription/transaction ID`);
    recordWebhookError("paddle", "missing_subscription_id", `Event: ${payload.event_type}`);
    return null;
  }

  logInfo(logPrefix, `Extracted subscription ID: ${subscriptionId}`);

  // ─── STEP 6: Map subscription status ───────────────────────────────────
  const paddleStatus = payload.data.status;
  const status = mapPaddleStatusToInternal(paddleStatus);

  if (!status) {
    logWarn(
      logPrefix,
      `Unknown Paddle subscription status: ${paddleStatus}`
    );
    recordWebhookError("paddle", "unknown_status", `Status: ${paddleStatus}`);
    return null;
  }

  logInfo(logPrefix, `Mapped Paddle status → internal status: ${status}`);

  // ─── STEP 7: Construct and return SubscriptionDescriptor ───────────────
  const descriptor: SubscriptionDescriptor = {
    provider: "paddle",
    providerSubscriptionId: subscriptionId,
    userId: userIdentifier,
    productKey,
    planSlug,
    status,
  };

  logInfo(logPrefix, `Successfully extracted subscription descriptor`, {
    provider: descriptor.provider,
    userId: descriptor.userId,
    productKey: descriptor.productKey,
    planSlug: descriptor.planSlug,
    status: descriptor.status,
  });

  return descriptor;
}

/**
 * Extract price ID from Paddle webhook payload
 *
 * Helper function to get the price ID from either a subscription or transaction.
 *
 * @param payload - Paddle webhook payload
 * @returns Price ID or undefined if not found
 */
export function extractPaddlePriceId(
  payload: PaddleWebhookPayload
): string | undefined {
  return payload.data.items?.[0]?.price?.id;
}

/**
 * Extract user identifier from Paddle webhook payload
 *
 * Helper function to get the user identifier (userId or email).
 * Tries userId first, then falls back to email.
 *
 * @param payload - Paddle webhook payload
 * @returns User identifier (userId or email) or undefined if not found
 */
export function extractPaddleUserIdentifier(
  payload: PaddleWebhookPayload
): string | undefined {
  const userId = payload.data.custom_data?.userId;
  const email = payload.data.customer?.email;
  return userId || email;
}

/**
 * Extract subscription ID from Paddle webhook payload
 *
 * Helper function to get the subscription or transaction ID.
 *
 * @param payload - Paddle webhook payload
 * @returns Subscription/transaction ID or undefined if not found
 */
export function extractPaddleSubscriptionId(
  payload: PaddleWebhookPayload
): string | undefined {
  return payload.data.id;
}
