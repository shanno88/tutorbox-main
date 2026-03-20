/**
 * Tests for Paddle Mappings
 * 
 * Run with: npm test -- paddle-mappings.test.ts
 */

import {
  getPriceToProductMapping,
  getProductKeyFromPriceId,
  isValidPriceId,
  getPriceIdsForProduct,
  getPriceIdsForProductAndCurrency,
  getPriceIdsForProductAndType,
} from "@/lib/paddle-mappings";

describe("Paddle Mappings", () => {
  describe("getPriceToProductMapping", () => {
    it("should return a map of price IDs to product keys", () => {
      const mapping = getPriceToProductMapping();
      expect(mapping).toBeInstanceOf(Map);
      expect(mapping.size).toBeGreaterThan(0);
    });

    it("should include legacy price IDs", () => {
      const mapping = getPriceToProductMapping();
      // Grammar Master legacy IDs
      expect(mapping.get("pri_01khwk19y0af40zae5fnysj5t3")).toBe(
        "grammar-master"
      );
      expect(mapping.get("pri_01kggqdgjrgyryb19xs3veb1js")).toBe(
        "grammar-master"
      );
      // Lease AI legacy ID
      expect(mapping.get("pri_01kgrhp2wtthebpgwmn8eh5ssy")).toBe("lease-ai");
    });
  });

  describe("getProductKeyFromPriceId", () => {
    it("should return product key for valid price ID", () => {
      const productKey = getProductKeyFromPriceId(
        "pri_01khwk19y0af40zae5fnysj5t3"
      );
      expect(productKey).toBe("grammar-master");
    });

    it("should return undefined for invalid price ID", () => {
      const productKey = getProductKeyFromPriceId("invalid_price_id");
      expect(productKey).toBeUndefined();
    });
  });

  describe("isValidPriceId", () => {
    it("should return true for valid price ID", () => {
      const isValid = isValidPriceId("pri_01khwk19y0af40zae5fnysj5t3");
      expect(isValid).toBe(true);
    });

    it("should return false for invalid price ID", () => {
      const isValid = isValidPriceId("invalid_price_id");
      expect(isValid).toBe(false);
    });
  });

  describe("getPriceIdsForProduct", () => {
    it("should return all price IDs for a product", () => {
      const priceIds = getPriceIdsForProduct("grammar-master");
      expect(priceIds.length).toBeGreaterThan(0);
      expect(priceIds).toContain("pri_01khwk19y0af40zae5fnysj5t3");
      expect(priceIds).toContain("pri_01kggqdgjrgyryb19xs3veb1js");
    });

    it("should return empty array for non-existent product", () => {
      const priceIds = getPriceIdsForProduct("non-existent-product");
      expect(priceIds).toEqual([]);
    });
  });

  describe("getPriceIdsForProductAndCurrency", () => {
    it("should return price IDs for specific currency", () => {
      const priceIds = getPriceIdsForProductAndCurrency("grammar-master", "USD");
      expect(priceIds.length).toBeGreaterThan(0);
    });

    it("should return empty array for non-existent currency", () => {
      const priceIds = getPriceIdsForProductAndCurrency(
        "grammar-master",
        "EUR"
      );
      expect(priceIds).toEqual([]);
    });
  });

  describe("getPriceIdsForProductAndType", () => {
    it("should return price IDs for specific type", () => {
      const priceIds = getPriceIdsForProductAndType("grammar-master", "yearly");
      expect(priceIds.length).toBeGreaterThan(0);
    });

    it("should return empty array for non-existent type", () => {
      const priceIds = getPriceIdsForProductAndType(
        "grammar-master",
        "monthly"
      );
      expect(priceIds).toEqual([]);
    });
  });

  describe("Webhook compatibility", () => {
    it("should map all subscription price IDs correctly", () => {
      // Grammar Master yearly subscriptions
      expect(getProductKeyFromPriceId("pri_01khwk19y0af40zae5fnysj5t3")).toBe(
        "grammar-master"
      );
      expect(getProductKeyFromPriceId("pri_01kggqdgjrgyryb19xs3veb1js")).toBe(
        "grammar-master"
      );

      // Cast Master (ai-prompter) yearly subscription
      const castMasterPriceIds = getPriceIdsForProduct("ai-prompter");
      expect(castMasterPriceIds.length).toBeGreaterThan(0);
    });

    it("should map all transaction price IDs correctly", () => {
      // Lease AI one-time purchase
      expect(getProductKeyFromPriceId("pri_01kgrhp2wtthebpgwmn8eh5ssy")).toBe(
        "lease-ai"
      );
    });
  });
});
