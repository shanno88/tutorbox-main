// config/products.ts
export const products = [
  {
    key: "thinker-ai",
    name: "Thinker AI",
    trialEnabled: true,
    trialType: "single", // "single" or "none"
    trialDays: 7,
  },
  {
    key: "flowforge",
    name: "FlowForge",
    trialEnabled: true,
    trialType: "single",
    trialDays: 3,
  },
  {
    key: "webpilot",
    name: "WebPilot",
    trialEnabled: false,
    trialType: "none",
  },
] as const;
