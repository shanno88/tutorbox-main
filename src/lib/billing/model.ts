/**
 * Canonical Billing Model Types
 *
 * This module defines the core types for the Tutorbox billing system.
 * It serves as the single source of truth for billing-related types across the app.
 *
 * Key concepts:
 * - BillingProvider: Where the payment comes from (Paddle, DoDo, etc.)
 * - ProductKey: Internal identifier for products (grammar-master, lease-ai, etc.)
 * - PlanSlug: Internal identifier for billing plans (grammar-master-yearly-usd, etc.)
 * - SubscriptionStatus: Current state of a subscription
 *
 * Design principle: Only include fields that are actually needed by existing code
 * or clear near-term requirements. Avoid over-design.
 */

/**
 * Billing provider types
 * Represents which payment provider processed the transaction
 */
export type BillingProvider = "paddle" | "dodo";

/**
 * Product key type - internal identifier for products
 * Examples: "grammar-master", "ai-prompter", "lease-ai"
 * Used throughout the app to identify which product a user has access to
 */
export type ProductKey = string;

/**
 * Plan slug type - internal identifier for billing plans
 * Examples: "grammar-master-yearly-usd", "ai-prompter-yearly-cny", "lease-ai-onetime-usd"
 * Used to look up plan details (rate limits, quotas, etc.) from the database
 */
export type PlanSlug = string;

/**
 * Price type - how the product is billed
 */
export type PriceType = "yearly" | "monthly" | "onetime";

/**
 * Currency type
 */
export type Currency = "USD" | "CNY";

/**
 * Subscription status - represents the current state of a subscription
 *
 * - trialing: User is in a free trial period
 * - active: Subscription is active and user has access
 * - past_due: Payment failed but subscription hasn't been canceled yet
 * - canceled: Subscription has been canceled, user no longer has access
 */
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

/**
 * Plan details - information about a billing plan
 * Used to look up plan configuration (rate limits, quotas, etc.)
 */
export interface PlanDetails {
  slug: PlanSlug;
  productKey: ProductKey;
  name: string;
  type: PriceType;
  currency: Currency;
  provider: BillingProvider;
}

/**
 * Subscription descriptor - represents a user's subscription to a product
 *
 * This is the canonical representation of a subscription in the Tutorbox system.
 * It combines information from the payment provider (Paddle/DoDo) with our internal
 * product and plan identifiers.
 *
 * Fields:
 * - provider: Which payment provider (Paddle, DoDo, etc.)
 * - providerSubscriptionId: The subscription ID from the provider (for tracking/reconciliation)
 * - userId: Internal user ID (from auth system)
 * - productKey: Which product the user has access to
 * - planSlug: Which plan they're subscribed to
 * - status: Current subscription status
 *
 * Note: We don't include provider-specific fields (like paddleCustomerId) here.
 * Those should be stored separately if needed for reconciliation.
 */
export interface SubscriptionDescriptor {
  /** Payment provider (Paddle, DoDo, etc.) */
  provider: BillingProvider;

  /** Subscription ID from the payment provider (for tracking) */
  providerSubscriptionId: string;

  /** Internal user ID */
  userId: string;

  /** Internal product identifier */
  productKey: ProductKey;

  /** Internal plan identifier */
  planSlug: PlanSlug;

  /** Current subscription status */
  status: SubscriptionStatus;
}

/**
 * Webhook context - information passed from webhook handlers to business logic
 *
 * This represents the raw data from a payment provider webhook event,
 * combined with our internal mappings.
 *
 * Used by handleSuccessfulPayment() and similar functions to process payments.
 */
export interface ProviderWebhookContext {
  /** Payment provider: 'paddle' or 'dodo' */
  provider: BillingProvider;

  /** Raw webhook event (for debugging/logging) */
  rawEvent: unknown;

  /** Price ID from the payment provider */
  priceId: string;

  /** Internal product key (mapped from priceId) */
  productKey: ProductKey;

  /** User identifier - typically email or external user ID */
  userIdentifier: string;

  /** Optional: subscription ID from provider (for tracking) */
  subscriptionId?: string;

  /** Optional: transaction ID from provider (for tracking) */
  transactionId?: string;
}

/**
 * Payment handling result - outcome of processing a payment
 *
 * Returned by handleSuccessfulPayment() and similar functions.
 * Indicates whether the payment was successfully processed and what was created.
 */
export interface PaymentHandlingResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** User ID (if successful) */
  userId?: string;

  /** Plan slug (if successful) */
  planSlug?: string;

  /** API key ID (if API key was issued) */
  apiKeyId?: number;

  /** Error message (if failed) */
  error?: string;

  /** Detailed reason for failure */
  reason?: string;
}

/**
 * API key info - information about an issued API key
 *
 * Used when issuing API keys to users after successful payment.
 */
export interface ApiKeyInfo {
  /** Unique API key ID in database */
  id: number;

  /** User ID who owns this key */
  userId: string;

  /** Plan ID this key is associated with */
  planId: number;

  /** Plan slug (for reference) */
  planSlug: PlanSlug;

  /** When the key was created */
  createdAt: Date;

  /** When the key expires (if applicable) */
  expiresAt?: Date;

  /** Current status of the key */
  status: "active" | "revoked";
}

/**
 * Billing event - represents a billing-related event for audit logging
 *
 * TODO: Create a billing_events table to store these for compliance
 * Currently just used for logging to console.
 */
export interface BillingEvent {
  /** Event type (payment_received, subscription_created, api_key_issued, etc.) */
  eventType: string;

  /** Payment provider */
  provider: BillingProvider;

  /** User ID */
  userId: string;

  /** Product key */
  productKey: ProductKey;

  /** Plan slug */
  planSlug: PlanSlug;

  /** Price ID from provider */
  priceId: string;

  /** Subscription ID from provider (if applicable) */
  subscriptionId?: string;

  /** Transaction ID from provider (if applicable) */
  transactionId?: string;

  /** API key ID (if applicable) */
  apiKeyId?: number;

  /** When the event occurred */
  timestamp: Date;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Type guards and helpers
 */

/**
 * Check if a value is a valid BillingProvider
 */
export function isBillingProvider(value: unknown): value is BillingProvider {
  return value === "paddle" || value === "dodo";
}

/**
 * Check if a value is a valid SubscriptionStatus
 */
export function isSubscriptionStatus(value: unknown): value is SubscriptionStatus {
  return (
    value === "trialing" ||
    value === "active" ||
    value === "past_due" ||
    value === "canceled"
  );
}

/**
 * Check if a value is a valid PriceType
 */
export function isPriceType(value: unknown): value is PriceType {
  return value === "yearly" || value === "monthly" || value === "onetime";
}

/**
 * Check if a value is a valid Currency
 */
export function isCurrency(value: unknown): value is Currency {
  return value === "USD" || value === "CNY";
}
