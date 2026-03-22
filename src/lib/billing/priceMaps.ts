/**
 * Billing Price Maps - Centralized mapping for payment integrations
 *
 * This module provides typed mappings between:
 * - Paddle/DoDo price IDs → product keys
 * - Product keys → plan slugs
 * - Plan slugs → plan details
 *
 * Purpose: Centralize billing logic so webhooks and other services
 * can easily map payment events to internal product/plan identifiers.
 *
 * Note: This is NOT a full billing implementation. It's a mapping layer
 * that helps webhooks identify which product/plan a payment is for.
 */

import {
  BillingProvider,
  ProductKey,
  PlanSlug,
  PriceType,
  Currency,
  PlanDetails,
} from "@/lib/billing/model";
import { appRegistry } from "@/config/apps";

/**
 * ============================================================================
 * PADDLE PRICE ID → PRODUCT KEY MAPPING
 * ============================================================================
 *
 * Maps Paddle price IDs to internal product keys.
 * This is the primary mapping used by webhook handlers.
 *
 * Source: src/config/apps.ts (appRegistry.prices[].priceId)
 */
export const paddlePriceIdToProductKey: Record<string, ProductKey> = {
  // Grammar Master - Yearly USD
  // Environment variable: NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD
  // Test price ID for E2E verification
  "pri_test_grammar_yearly_usd": "grammar-master",
  // Production price IDs (add from Paddle Dashboard)
  // "pri_01khwk19y0af40zae5fnysj5t3": "grammar-master",
  // "pri_01kggqdgjrgyryb19xs3veb1js": "grammar-master",

  // Grammar Master - Yearly CNY
  // Environment variable: NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY
  // TODO: Add actual price ID from Paddle Dashboard
  // "pri_xxxxx": "grammar-master",

  // Lease AI - One-time USD
  // Environment variable: NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD
  // TODO: Add actual price ID from Paddle Dashboard
  // "pri_01kgrhp2wtthebpgwmn8eh5ssy": "lease-ai",

  // Cast Master (ai-prompter) - Yearly CNY
  // Environment variable: NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY
  // TODO: Add actual price ID from Paddle Dashboard
  // "pri_xxxxx": "ai-prompter",
};

/**
 * ============================================================================
 * DODO PRICE ID → PRODUCT KEY MAPPING
 * ============================================================================
 *
 * Maps DoDo price IDs to internal product keys.
 * Currently experimental - DoDo integration not yet implemented.
 *
 * TODO: Implement DoDo payment integration
 * - Determine DoDo price ID format
 * - Map DoDo price IDs to product keys
 * - Implement webhook handler for DoDo events
 */
export const dodoPriceIdToProductKey: Record<string, ProductKey> = {
  // TODO: Add DoDo price ID mappings
  // Example (placeholder):
  // "dodo_price_xxx": "grammar-master",
};

/**
 * ============================================================================
 * PRODUCT KEY → PLAN SLUG MAPPING
 * ============================================================================
 *
 * Maps product keys to plan slugs.
 * A product can have multiple plans (e.g., yearly, monthly, onetime).
 *
 * Note: This is a simplified mapping. In a full implementation,
 * you might query the database for plan details.
 */
export const productKeyToPlanSlugs: Record<ProductKey, PlanSlug[]> = {
  "grammar-master": [
    "grammar-master-yearly-usd",
    "grammar-master-yearly-cny",
    // TODO: Add monthly plans if implemented
    // "grammar-master-monthly-usd",
    // "grammar-master-monthly-cny",
  ],
  "lease-ai": [
    "lease-ai-onetime-usd",
    // TODO: Add other currencies if implemented
    // "lease-ai-onetime-cny",
  ],
  "ai-prompter": [
    "ai-prompter-yearly-cny",
    // TODO: Add USD pricing if implemented
    // "ai-prompter-yearly-usd",
  ],
  // TODO: Add other products as they are implemented
  // "en-cards": ["en-cards-yearly-usd", "en-cards-yearly-cny"],
  // "thinker-ai": ["thinker-ai-yearly-usd", "thinker-ai-yearly-cny"],
  // "flowforge": ["flowforge-yearly-usd", "flowforge-yearly-cny"],
};

/**
 * ============================================================================
 * PLAN SLUG → PLAN DETAILS MAPPING
 * ============================================================================
 *
 * Maps plan slugs to detailed plan information.
 * This is used to look up plan details by slug.
 *
 * Source: src/db/schema.ts (plans table)
 */
export const planSlugToDetails: Record<PlanSlug, PlanDetails> = {
  // Grammar Master - Yearly USD
  "grammar-master-yearly-usd": {
    slug: "grammar-master-yearly-usd",
    productKey: "grammar-master",
    name: "Grammar Master - Yearly (USD)",
    type: "yearly",
    currency: "USD",
    provider: "paddle",
  },

  // Grammar Master - Yearly CNY
  "grammar-master-yearly-cny": {
    slug: "grammar-master-yearly-cny",
    productKey: "grammar-master",
    name: "Grammar Master - Yearly (CNY)",
    type: "yearly",
    currency: "CNY",
    provider: "paddle",
  },

  // Lease AI - One-time USD
  "lease-ai-onetime-usd": {
    slug: "lease-ai-onetime-usd",
    productKey: "lease-ai",
    name: "Lease AI Review - One-time (USD)",
    type: "onetime",
    currency: "USD",
    provider: "paddle",
  },

  // Cast Master (ai-prompter) - Yearly CNY
  "ai-prompter-yearly-cny": {
    slug: "ai-prompter-yearly-cny",
    productKey: "ai-prompter",
    name: "Cast Master - Yearly (CNY)",
    type: "yearly",
    currency: "CNY",
    provider: "paddle",
  },

  // TODO: Add other plans as they are implemented
  // "en-cards-yearly-usd": { ... },
  // "en-cards-yearly-cny": { ... },
  // "thinker-ai-yearly-usd": { ... },
  // "thinker-ai-yearly-cny": { ... },
  // "flowforge-yearly-usd": { ... },
  // "flowforge-yearly-cny": { ... },
};

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Get product key from a Paddle price ID
 *
 * @param priceId - Paddle price ID
 * @returns Product key or undefined if not found
 */
export function getProductKeyFromPaddlePriceId(
  priceId: string
): ProductKey | undefined {
  return paddlePriceIdToProductKey[priceId];
}

/**
 * Get product key from a DoDo price ID
 *
 * @param priceId - DoDo price ID
 * @returns Product key or undefined if not found
 */
export function getProductKeyFromDodoPriceId(
  priceId: string
): ProductKey | undefined {
  return dodoPriceIdToProductKey[priceId];
}

/**
 * Get product key from any price ID (tries both Paddle and DoDo)
 *
 * @param priceId - Price ID from any provider
 * @param provider - Optional provider hint ("paddle" or "dodo")
 * @returns Product key or undefined if not found
 */
export function getProductKeyFromPriceId(
  priceId: string,
  provider?: BillingProvider
): ProductKey | undefined {
  if (provider === "paddle") {
    return getProductKeyFromPaddlePriceId(priceId);
  }
  if (provider === "dodo") {
    return getProductKeyFromDodoPriceId(priceId);
  }

  // Try both if provider not specified
  return (
    getProductKeyFromPaddlePriceId(priceId) ||
    getProductKeyFromDodoPriceId(priceId)
  );
}

/**
 * Get plan slugs for a product key
 *
 * @param productKey - Product key
 * @returns Array of plan slugs for this product
 */
export function getPlanSlugsForProduct(productKey: ProductKey): PlanSlug[] {
  return productKeyToPlanSlugs[productKey] ?? [];
}

/**
 * Get plan details by slug
 *
 * @param planSlug - Plan slug
 * @returns Plan details or undefined if not found
 */
export function getPlanDetailsBySlug(planSlug: PlanSlug): PlanDetails | undefined {
  return planSlugToDetails[planSlug];
}

/**
 * Get plan details by product key and price type
 *
 * @param productKey - Product key
 * @param type - Price type (yearly, monthly, onetime)
 * @param currency - Currency (USD, CNY)
 * @returns Plan details or undefined if not found
 */
export function getPlanDetailsByProductAndType(
  productKey: ProductKey,
  type: PriceType,
  currency: Currency
): PlanDetails | undefined {
  const planSlugs = getPlanSlugsForProduct(productKey);
  for (const slug of planSlugs) {
    const details = getPlanDetailsBySlug(slug);
    if (details && details.type === type && details.currency === currency) {
      return details;
    }
  }
  return undefined;
}

/**
 * Check if a price ID is valid (exists in any mapping)
 *
 * @param priceId - Price ID
 * @returns true if price ID is valid
 */
export function isValidPriceId(priceId: string): boolean {
  return getProductKeyFromPriceId(priceId) !== undefined;
}

/**
 * Get all product keys
 *
 * @returns Array of all product keys
 */
export function getAllProductKeys(): ProductKey[] {
  return Object.keys(productKeyToPlanSlugs);
}

/**
 * Get all plan slugs
 *
 * @returns Array of all plan slugs
 */
export function getAllPlanSlugs(): PlanSlug[] {
  return Object.keys(planSlugToDetails);
}

/**
 * Log all mappings (for debugging)
 */
export function logAllMappings(): void {
  console.log("[Billing Maps] Paddle Price ID → Product Key:");
  Object.entries(paddlePriceIdToProductKey).forEach(([priceId, productKey]) => {
    console.log(`  ${priceId} → ${productKey}`);
  });

  console.log("[Billing Maps] DoDo Price ID → Product Key:");
  Object.entries(dodoPriceIdToProductKey).forEach(([priceId, productKey]) => {
    console.log(`  ${priceId} → ${productKey}`);
  });

  console.log("[Billing Maps] Product Key → Plan Slugs:");
  Object.entries(productKeyToPlanSlugs).forEach(([productKey, slugs]) => {
    console.log(`  ${productKey} → [${slugs.join(", ")}]`);
  });

  console.log("[Billing Maps] Plan Slug → Details:");
  Object.entries(planSlugToDetails).forEach(([slug, details]) => {
    console.log(`  ${slug} → ${details.name}`);
  });
}
