/**
 * Paddle Price ID to Product Key Mappings
 * 
 * This module generates mappings from Paddle price IDs to product keys
 * dynamically from the appRegistry. This ensures that:
 * 1. All price IDs are centrally managed in appRegistry
 * 2. Webhook handlers don't need to hardcode price IDs
 * 3. Adding new products/prices only requires updating appRegistry
 */

import { appRegistry } from "@/config/apps";

/**
 * Cache for the price to product mapping
 * Regenerated on each call to ensure fresh data
 */
let priceToProductCache: Map<string, string> | null = null;

/**
 * Get the mapping of Paddle price IDs to product keys
 * 
 * @returns Map<priceId, productKey>
 * 
 * Example:
 * {
 *   "pri_01khwk19y0af40zae5fnysj5t3": "grammar-master",
 *   "pri_01kggqdgjrgyryb19xs3veb1js": "grammar-master",
 *   "pri_01kgrhp2wtthebpgwmn8eh5ssy": "lease-ai",
 *   ...
 * }
 */
export function getPriceToProductMapping(): Map<string, string> {
  const mapping = new Map<string, string>();

  for (const app of appRegistry) {
    if (app.prices) {
      for (const price of app.prices) {
        // Skip empty price IDs (from missing env vars)
        if (price.priceId && price.priceId.trim()) {
          mapping.set(price.priceId, app.productKey);
        }
      }
    }
  }

  return mapping;
}

/**
 * Get product key from a Paddle price ID
 * 
 * @param priceId - Paddle price ID
 * @returns Product key or undefined if not found
 */
export function getProductKeyFromPriceId(priceId: string): string | undefined {
  const mapping = getPriceToProductMapping();
  return mapping.get(priceId);
}

/**
 * Check if a price ID is valid (exists in appRegistry)
 * 
 * @param priceId - Paddle price ID
 * @returns true if price ID is valid
 */
export function isValidPriceId(priceId: string): boolean {
  return getProductKeyFromPriceId(priceId) !== undefined;
}

/**
 * Get all price IDs for a specific product
 * 
 * @param productKey - Product key (e.g., "grammar-master")
 * @returns Array of price IDs
 */
export function getPriceIdsForProduct(productKey: string): string[] {
  const app = appRegistry.find((a) => a.productKey === productKey);
  if (!app || !app.prices) {
    return [];
  }
  return app.prices
    .map((p) => p.priceId)
    .filter((id) => id && id.trim());
}

/**
 * Get all price IDs for a specific product and currency
 * 
 * @param productKey - Product key (e.g., "grammar-master")
 * @param currency - Currency (e.g., "USD", "CNY")
 * @returns Array of price IDs
 */
export function getPriceIdsForProductAndCurrency(
  productKey: string,
  currency: "USD" | "CNY"
): string[] {
  const app = appRegistry.find((a) => a.productKey === productKey);
  if (!app || !app.prices) {
    return [];
  }
  return app.prices
    .filter((p) => p.currency === currency)
    .map((p) => p.priceId)
    .filter((id) => id && id.trim());
}

/**
 * Get all price IDs for a specific product and price type
 * 
 * @param productKey - Product key (e.g., "grammar-master")
 * @param type - Price type (e.g., "yearly", "monthly", "onetime")
 * @returns Array of price IDs
 */
export function getPriceIdsForProductAndType(
  productKey: string,
  type: "yearly" | "monthly" | "onetime"
): string[] {
  const app = appRegistry.find((a) => a.productKey === productKey);
  if (!app || !app.prices) {
    return [];
  }
  return app.prices
    .filter((p) => p.type === type)
    .map((p) => p.priceId)
    .filter((id) => id && id.trim());
}

/**
 * Log the current price to product mapping (for debugging)
 */
export function logPriceToProductMapping(): void {
  const mapping = getPriceToProductMapping();
  console.log("[Paddle Mappings] Price to Product Mapping:");
  mapping.forEach((productKey, priceId) => {
    console.log(`  ${priceId} → ${productKey}`);
  });
  if (mapping.size === 0) {
    console.warn("[Paddle Mappings] No price IDs configured in appRegistry");
  }
}
