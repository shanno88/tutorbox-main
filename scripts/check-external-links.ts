<<<<<<< HEAD
#!/usr/bin/env tsx
/**
 * CI/Build-time external link checker
 * 
 * Usage:
 *   npm run check:external-links
 *   STRICT_EXTERNAL_LINK_CHECK=true npm run check:external-links (fail build on errors)
 * 
 * This script checks all external links and optionally fails the build if any are unavailable.
 */

import { externalLinks } from "../src/config/external-links";

const STRICT_MODE = process.env.STRICT_EXTERNAL_LINK_CHECK === "true";
const TIMEOUT = 10000; // 10 seconds for CI checks

interface CheckResult {
  linkId: string;
  url: string;
  status: "ok" | "unavailable";
  statusCode?: number;
  error?: string;
}

async function checkLink(link: typeof externalLinks[0]): Promise<CheckResult> {
  const method = link.checkMethod || "HEAD";
  const expectedStatus = link.expectedStatus || [200, 301, 302];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(link.url, {
      method,
      signal: controller.signal,
      redirect: "manual",
    });

    clearTimeout(timeoutId);

    const isOk = expectedStatus.includes(response.status);

    return {
      linkId: link.id,
      url: link.url,
      status: isOk ? "ok" : "unavailable",
      statusCode: response.status,
    };
  } catch (error) {
    return {
      linkId: link.id,
      url: link.url,
      status: "unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function main() {
  console.log("🔍 Checking external links...\n");

  const results: CheckResult[] = [];

  for (const link of externalLinks) {
    console.log(`Checking: ${link.label} (${link.url})`);
    const result = await checkLink(link);
    results.push(result);

    if (result.status === "ok") {
      console.log(`  ✅ OK (${result.statusCode})\n`);
    } else {
      console.log(`  ❌ UNAVAILABLE`);
      if (result.statusCode) {
        console.log(`     Status: ${result.statusCode}`);
      }
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
      console.log();
    }
  }

  // Summary
  const okCount = results.filter((r) => r.status === "ok").length;
  const unavailableCount = results.filter((r) => r.status === "unavailable").length;

  console.log("━".repeat(60));
  console.log(`Summary: ${okCount} OK, ${unavailableCount} unavailable`);
  console.log("━".repeat(60));

  if (unavailableCount > 0) {
    console.error("\n⚠️  Some external links are unavailable:");
    results
      .filter((r) => r.status === "unavailable")
      .forEach((r) => {
        console.error(`  - ${r.linkId}: ${r.url}`);
        if (r.error) {
          console.error(`    Error: ${r.error}`);
        }
      });

    if (STRICT_MODE) {
      console.error("\n❌ Build failed due to unavailable external links.");
      console.error("   Set STRICT_EXTERNAL_LINK_CHECK=false to allow build to continue.\n");
      process.exit(1);
    } else {
      console.warn("\n⚠️  Build will continue, but external links may be broken.");
      console.warn("   Set STRICT_EXTERNAL_LINK_CHECK=true to fail build on link errors.\n");
    }
  } else {
    console.log("\n✅ All external links are healthy!\n");
  }
}

main().catch((error) => {
  console.error("Fatal error during link check:", error);
  process.exit(1);
});
=======
#!/usr/bin/env tsx
/**
 * CI/Build-time external link checker
 * 
 * Usage:
 *   npm run check:external-links
 *   STRICT_EXTERNAL_LINK_CHECK=true npm run check:external-links (fail build on errors)
 * 
 * This script checks all external links and optionally fails the build if any are unavailable.
 */

import { externalLinks } from "../src/config/external-links";

const STRICT_MODE = process.env.STRICT_EXTERNAL_LINK_CHECK === "true";
const TIMEOUT = 10000; // 10 seconds for CI checks

interface CheckResult {
  linkId: string;
  url: string;
  status: "ok" | "unavailable";
  statusCode?: number;
  error?: string;
}

async function checkLink(link: typeof externalLinks[0]): Promise<CheckResult> {
  const method = link.checkMethod || "HEAD";
  const expectedStatus = link.expectedStatus || [200, 301, 302];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(link.url, {
      method,
      signal: controller.signal,
      redirect: "manual",
    });

    clearTimeout(timeoutId);

    const isOk = expectedStatus.includes(response.status);

    return {
      linkId: link.id,
      url: link.url,
      status: isOk ? "ok" : "unavailable",
      statusCode: response.status,
    };
  } catch (error) {
    return {
      linkId: link.id,
      url: link.url,
      status: "unavailable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function main() {
  console.log("🔍 Checking external links...\n");

  const results: CheckResult[] = [];

  for (const link of externalLinks) {
    console.log(`Checking: ${link.label} (${link.url})`);
    const result = await checkLink(link);
    results.push(result);

    if (result.status === "ok") {
      console.log(`  ✅ OK (${result.statusCode})\n`);
    } else {
      console.log(`  ❌ UNAVAILABLE`);
      if (result.statusCode) {
        console.log(`     Status: ${result.statusCode}`);
      }
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
      console.log();
    }
  }

  // Summary
  const okCount = results.filter((r) => r.status === "ok").length;
  const unavailableCount = results.filter((r) => r.status === "unavailable").length;

  console.log("━".repeat(60));
  console.log(`Summary: ${okCount} OK, ${unavailableCount} unavailable`);
  console.log("━".repeat(60));

  if (unavailableCount > 0) {
    console.error("\n⚠️  Some external links are unavailable:");
    results
      .filter((r) => r.status === "unavailable")
      .forEach((r) => {
        console.error(`  - ${r.linkId}: ${r.url}`);
        if (r.error) {
          console.error(`    Error: ${r.error}`);
        }
      });

    if (STRICT_MODE) {
      console.error("\n❌ Build failed due to unavailable external links.");
      console.error("   Set STRICT_EXTERNAL_LINK_CHECK=false to allow build to continue.\n");
      process.exit(1);
    } else {
      console.warn("\n⚠️  Build will continue, but external links may be broken.");
      console.warn("   Set STRICT_EXTERNAL_LINK_CHECK=true to fail build on link errors.\n");
    }
  } else {
    console.log("\n✅ All external links are healthy!\n");
  }
}

main().catch((error) => {
  console.error("Fatal error during link check:", error);
  process.exit(1);
});
>>>>>>> origin/main
