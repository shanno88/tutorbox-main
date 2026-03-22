/**
 * DoDo Webhook Handler - Extract and Process DoDo Events
 *
 * This module provides utilities to:
 * 1. Parse DoDo webhook payloads
 * 2. Extract subscription descriptors from DoDo events
 * 3. Determine if an event represents a successful payment
 *
 * STATUS: Scaffolding only - DoDo integration not yet implemented
 *
 * Design:
 * - Pure functions: no DB writes or HTTP calls
 * - Conservative: returns null if any critical field is missing
 * - Structured logging: clear warnings for debugging
 *
 * TODO: Implement DoDo integration
 * - [ ] Determine DoDo webhook event types and structure
 * - [ ] Implement signature verification for DoDo webhooks
 * - [ ] Implement extractDodoSubscriptionDescriptor()
 * - [ ] Map DoDo price IDs to internal product keys
 * - [ ] Test with real DoDo webhook events
 *
 * Reference: DoDo API Documentation
 * https://docs.dodo.com/webhooks (placeholder - update with real URL)
 */

import type {
  SubscriptionDescriptor,
  SubscriptionStatus,
  ProductKey,
  PlanSlug,
} from "@/lib/billing/model";
import { getProductKeyFromDodoPriceId, getPlanSlugsForProduct } from "@/lib/billing/priceMaps";

/**
 * DoDo event types we care about
 *
 * TODO: Verify these event types with DoDo documentation
 * Reference: https://docs.dodo.com/webhooks
 */
export type DodoEventType =
  | "subscription.created"
  | "subscription.activated"
  | "subscription.updated"
  | "subscription.canceled"
  | "transaction.completed"
  | "transaction.updated"
  | "transaction.canceled"
  | string; // fallback for unknown events

/**
 * DoDo subscription object from webhook
 *
 * TODO: Verify field names and structure with DoDo documentation
 * This is a placeholder based on common payment provider patterns.
 *
 * Reference: https://docs.dodo.com/webhooks/events
 */
export interface DodoSubscription {
  id: string; // Subscription ID
  status?: string; // "active", "trialing", "past_due", "canceled"
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
    id?: string; // DoDo customer ID
  };
}

/**
 * DoDo transaction object from webhook
 *
 * TODO: Verify field names and structure with DoDo documentation
 * This is a placeholder based on common payment provider patterns.
 *
 * Reference: https://docs.dodo.com/webhooks/events
 */
export interface DodoTransaction {
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
    id?: string; // DoDo customer ID
  };
}

/**
 * DoDo webhook payload
 *
 * This is a minimal representation of the DoDo webhook payload.
 * We only include fields we actually use.
 *
 * TODO: Verify payload structure with DoDo documentation
 * Reference: https://docs.dodo.com/webhooks/overview
 */
export interface DodoWebhookPayload {
  event_type: DodoEventType;
  data: DodoSubscription | DodoTransaction;
}

/**
 * Check if a DoDo webhook payload is a subscription event
 *
 * TODO: Verify event type names with DoDo documentation
 *
 * @param payload - DoDo webhook payload
 * @returns true if this is a subscription event
 */
export function isDodoSubscriptionEvent(
  payload: DodoWebhookPayload
): payload is DodoWebhookPayload & { data: DodoSubscription } {
  return payload.event_type.startsWith("subscription.");
}

/**
 * Check if a DoDo webhook payload is a transaction event
 *
 * TODO: Verify event type names with DoDo documentation
 *
 * @param payload - DoDo webhook payload
 * @returns true if this is a transaction event
 */
export function isDodoTransactionEvent(
  payload: DodoWebhookPayload
): payload is DodoWebhookPayload & { data: DodoTransaction } {
  return payload.event_type.startsWith("transaction.");
}

/**
 * Check if a DoDo subscription is activated (successful payment)
 *
 * A subscription is considered "activated" if:
 * - Event type is "subscription.activated" or "subscription.updated"
 * - Status is "active" or "trialing"
 *
 * TODO: Verify event types and status values with DoDo documentation
 * Reference: https://docs.dodo.com/webhooks/events/subscription-activated
 *
 * @param payload - DoDo webhook payload
 * @returns true if this represents an activated subscription
 */
export function isDodoSubscriptionActivated(
  payload: DodoWebhookPayload
): boolean {
  // TODO: Implement DoDo subscription activation check
  // For now, return false (not implemented)
  console.warn(
    "[isDodoSubscriptionActivated] DoDo integration not yet implemented"
  );
  return false;
}

/**
 * Check if a DoDo transaction is completed (successful payment)
 *
 * A transaction is considered "completed" if:
 * - Event type is "transaction.completed"
 * - Status is "completed"
 *
 * TODO: Verify event types and status values with DoDo documentation
 * Reference: https://docs.dodo.com/webhooks/events/transaction-completed
 *
 * @param payload - DoDo webhook payload
 * @returns true if this represents a completed transaction
 */
export function isDodoTransactionCompleted(
  payload: DodoWebhookPayload
): boolean {
  // TODO: Implement DoDo transaction completion check
  // For now, return false (not implemented)
  console.warn(
    "[isDodoTransactionCompleted] DoDo integration not yet implemented"
  );
  return false;
}

/**
 * Map DoDo subscription status to our internal SubscriptionStatus
 *
 * TODO: Verify DoDo status values with documentation
 *
 * @param dodoStatus - DoDo subscription status
 * @returns Our internal SubscriptionStatus or null if unknown
 */
function mapDodoStatusToInternal(
  dodoStatus: string | undefined
): SubscriptionStatus | null {
  // TODO: Implement DoDo status mapping
  // For now, return null (not implemented)
  console.warn(
    `[mapDodoStatusToInternal] DoDo status mapping not yet implemented: ${dodoStatus}`
  );
  return null;
}

/**
 * Extract subscription descriptor from DoDo webhook payload
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
 * TODO: Implement DoDo subscription descriptor extraction
 * - [ ] Verify DoDo webhook payload structure
 * - [ ] Implement price ID extraction
 * - [ ] Implement user identifier extraction
 * - [ ] Implement status mapping
 * - [ ] Test with real DoDo webhook events
 *
 * @param payload - DoDo webhook payload
 * @returns SubscriptionDescriptor or null if extraction fails
 */
export function extractDodoSubscriptionDescriptor(
  payload: DodoWebhookPayload
): SubscriptionDescriptor | null {
  const logPrefix = "[extractDodoSubscriptionDescriptor]";

  // TODO: Implement DoDo subscription descriptor extraction
  console.warn(
    `${logPrefix} DoDo integration not yet implemented. Returning null.`
  );
  console.warn(
    `${logPrefix} TODO: Implement extraction for event type: ${payload.event_type}`
  );

  // For now, always return null (not implemented)
  return null;
}

/**
 * Extract price ID from DoDo webhook payload
 *
 * Helper function to get the price ID from either a subscription or transaction.
 *
 * TODO: Implement DoDo price ID extraction
 *
 * @param payload - DoDo webhook payload
 * @returns Price ID or undefined if not found
 */
export function extractDodoPriceId(
  payload: DodoWebhookPayload
): string | undefined {
  // TODO: Implement DoDo price ID extraction
  return payload.data.items?.[0]?.price?.id;
}

/**
 * Extract user identifier from DoDo webhook payload
 *
 * Helper function to get the user identifier (userId or email).
 * Tries userId first, then falls back to email.
 *
 * TODO: Implement DoDo user identifier extraction
 *
 * @param payload - DoDo webhook payload
 * @returns User identifier (userId or email) or undefined if not found
 */
export function extractDodoUserIdentifier(
  payload: DodoWebhookPayload
): string | undefined {
  // TODO: Implement DoDo user identifier extraction
  const userId = payload.data.custom_data?.userId;
  const email = payload.data.customer?.email;
  return userId || email;
}

/**
 * Extract subscription ID from DoDo webhook payload
 *
 * Helper function to get the subscription or transaction ID.
 *
 * TODO: Implement DoDo subscription ID extraction
 *
 * @param payload - DoDo webhook payload
 * @returns Subscription/transaction ID or undefined if not found
 */
export function extractDodoSubscriptionId(
  payload: DodoWebhookPayload
): string | undefined {
  // TODO: Implement DoDo subscription ID extraction
  return payload.data.id;
}
