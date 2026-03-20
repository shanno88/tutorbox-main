/**
 * App Registry - Central configuration for all apps
 * Used for navigation, routing, and app management
 */

export type AppStatus = "live" | "beta" | "coming-soon" | "archived";
export type PriceType = "yearly" | "monthly" | "onetime";

export interface PriceConfig {
  type: PriceType;
  currency: "USD" | "CNY";
  priceId: string;
}

export interface AppConfig {
  slug: string;
  name: string;
  nameCn: string;
  status: AppStatus;
  description?: string;
  descriptionCn?: string;
  productKey: string; // Database product key (e.g., "grammar-master", "ai-prompter")
  prices?: PriceConfig[]; // Paddle price IDs for this app
}

export const appRegistry: AppConfig[] = [
  {
    slug: "grammar-master",
    name: "Grammar Master",
    nameCn: "语法大师",
    status: "live",
    description: "AI-powered grammar checking and writing assistance",
    descriptionCn: "AI 语法检查和写作辅助",
    productKey: "grammar-master",
    prices: [
      {
        type: "yearly",
        currency: "USD",
        priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD || "",
      },
      {
        type: "yearly",
        currency: "CNY",
        priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY || "",
      },
      // Legacy price IDs (for backward compatibility)
      {
        type: "yearly",
        currency: "USD",
        priceId: "pri_01khwk19y0af40zae5fnysj5t3",
      },
      {
        type: "yearly",
        currency: "USD",
        priceId: "pri_01kggqdgjrgyryb19xs3veb1js",
      },
    ],
  },
  {
    slug: "lease-ai",
    name: "Lease AI Review",
    nameCn: "美国租房合同审核",
    status: "live",
    description: "AI-powered lease agreement review",
    descriptionCn: "AI 租房合同审核",
    productKey: "lease-ai",
    prices: [
      {
        type: "onetime",
        currency: "USD",
        priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD || "",
      },
      // Legacy price ID
      {
        type: "onetime",
        currency: "USD",
        priceId: "pri_01kgrhp2wtthebpgwmn8eh5ssy",
      },
    ],
  },
  {
    slug: "cast-master",
    name: "Cast Master",
    nameCn: "播感大师",
    status: "live",
    description: "AI-powered broadcast assistant",
    descriptionCn: "AI 播感助手",
    productKey: "ai-prompter",
    prices: [
      {
        type: "yearly",
        currency: "CNY",
        priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY || "",
      },
    ],
  },
];

/**
 * Get all live apps
 */
export function getLiveApps(): AppConfig[] {
  return appRegistry.filter((app) => app.status === "live");
}

/**
 * Get app by slug
 */
export function getAppBySlug(slug: string): AppConfig | undefined {
  return appRegistry.find((app) => app.slug === slug);
}

/**
 * Get app by product key
 */
export function getAppByProductKey(productKey: string): AppConfig | undefined {
  return appRegistry.find((app) => app.productKey === productKey);
}

/**
 * Get app route path
 * @param slug - App slug
 * @param locale - Locale (e.g., 'en', 'zh')
 * @returns Route path (e.g., '/en/grammar-master')
 */
export function getAppRoute(slug: string, locale: string = "en"): string {
  return `/${locale}/${slug}`;
}
