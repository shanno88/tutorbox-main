<<<<<<< HEAD
// External links configuration
// This file defines all external trial/product URLs used in the app

export type ExternalLinkStatus = "unknown" | "ok" | "unavailable";

export interface ExternalLink {
  id: string;
  label: string;
  labelCn: string;
  url: string;
  description: string;
  productSlug?: string; // Optional: link to product if applicable
  checkMethod?: "HEAD" | "GET"; // Default: HEAD
  expectedStatus?: number[]; // Default: [200, 301, 302]
  timeout?: number; // Default: 5000ms
}

export const externalLinks: ExternalLink[] = [
  {
    id: "cast_master_trial",
    label: "Cast Master 7-day trial",
    labelCn: "播感大师 7 天试用",
    url: "https://tl.tutorbox.cc/",
    description: "Cast Master (播感大师) trial page - external partner site",
    productSlug: "cast-master",
    checkMethod: "HEAD",
    expectedStatus: [200, 301, 302],
    timeout: 5000,
  },
  {
    id: "grammar_master_app",
    label: "Grammar Master Application",
    labelCn: "语法大师应用",
    url: "https://gm.tutorbox.cc",
    description: "Grammar Master web application - external app",
    productSlug: "grammar-master",
    checkMethod: "HEAD",
    expectedStatus: [200, 301, 302],
    timeout: 5000,
  },
  {
    id: "grammar_master_trial",
    label: "Grammar Master 7-day trial",
    labelCn: "语法大师 7 天试用",
    url: "https://tutorbox.cc/zh/grammar-master",
    description: "Grammar Master trial page - internal product page",
    productSlug: "grammar-master",
    checkMethod: "HEAD",
    expectedStatus: [200, 301, 302],
    timeout: 5000,
  },
];

export function getExternalLinkById(id: string): ExternalLink | undefined {
  return externalLinks.find((link) => link.id === id);
}

export function getExternalLinksByProduct(productSlug: string): ExternalLink[] {
  return externalLinks.filter((link) => link.productSlug === productSlug);
}
=======
// External links configuration
// This file defines all external trial/product URLs used in the app

export type ExternalLinkStatus = "unknown" | "ok" | "unavailable";

export interface ExternalLink {
  id: string;
  label: string;
  labelCn: string;
  url: string;
  description: string;
  productSlug?: string; // Optional: link to product if applicable
  checkMethod?: "HEAD" | "GET"; // Default: HEAD
  expectedStatus?: number[]; // Default: [200, 301, 302]
  timeout?: number; // Default: 5000ms
}

export const externalLinks: ExternalLink[] = [
  {
    id: "cast_master_trial",
    label: "Cast Master 7-day trial",
    labelCn: "播感大师 7 天试用",
    url: "https://tl.tutorbox.cc/",
    description: "Cast Master (播感大师) trial page - external partner site",
    productSlug: "cast-master",
    checkMethod: "HEAD",
    expectedStatus: [200, 301, 302],
    timeout: 5000,
  },
  {
    id: "grammar_master_app",
    label: "Grammar Master Application",
    labelCn: "语法大师应用",
    url: "https://gm.tutorbox.cc",
    description: "Grammar Master web application - external app",
    productSlug: "grammar-master",
    checkMethod: "HEAD",
    expectedStatus: [200, 301, 302],
    timeout: 5000,
  },
  {
    id: "grammar_master_trial",
    label: "Grammar Master 7-day trial",
    labelCn: "语法大师 7 天试用",
    url: "https://tutorbox.cc/products/grammar-master",
    description: "Grammar Master trial page - internal product page",
    productSlug: "grammar-master",
    checkMethod: "HEAD",
    expectedStatus: [200, 301, 302],
    timeout: 5000,
  },
];

export function getExternalLinkById(id: string): ExternalLink | undefined {
  return externalLinks.find((link) => link.id === id);
}

export function getExternalLinksByProduct(productSlug: string): ExternalLink[] {
  return externalLinks.filter((link) => link.productSlug === productSlug);
}
>>>>>>> origin/main
