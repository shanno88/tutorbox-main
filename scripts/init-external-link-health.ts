<<<<<<< HEAD
#!/usr/bin/env tsx
/**
 * Initialize external link health records in database
 * 
 * Usage: npm run init:external-links
 * 
 * This script creates initial database records for all configured external links
 * and performs an initial health check.
 */

import { prisma } from "../src/prisma";
import { externalLinks } from "../src/config/external-links";
import { checkAllExternalLinks } from "../src/lib/external-link-health";

async function main() {
  console.log("🔧 Initializing external link health records...\n");

  // Create initial records for all configured links
  for (const link of externalLinks) {
    const existing = await prisma.externalLinkHealth.findUnique({
      where: { linkId: link.id },
    });

    if (existing) {
      console.log(`✓ ${link.id} already exists (status: ${existing.status})`);
    } else {
      await prisma.externalLinkHealth.create({
        data: {
          linkId: link.id,
          url: link.url,
          status: "unknown",
          lastCheckedAt: new Date(),
          consecutiveFailures: 0,
        },
      });
      console.log(`✓ Created record for ${link.id}`);
    }
  }

  console.log("\n🔍 Running initial health check...\n");

  const results = await checkAllExternalLinks();

  console.log("\n━".repeat(60));
  console.log("Health Check Results:");
  console.log("━".repeat(60));

  for (const result of results) {
    const status = result.status === "ok" ? "✅ OK" : "❌ UNAVAILABLE";
    console.log(`${status} - ${result.linkId}`);
    console.log(`   URL: ${result.url}`);
    if (result.statusCode) {
      console.log(`   Status Code: ${result.statusCode}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log();
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  const unavailableCount = results.filter((r) => r.status === "unavailable").length;

  console.log("━".repeat(60));
  console.log(`Summary: ${okCount} OK, ${unavailableCount} unavailable`);
  console.log("━".repeat(60));

  console.log("\n✅ Initialization complete!\n");
}

main()
  .catch((error) => {
    console.error("❌ Error during initialization:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
=======
#!/usr/bin/env tsx
/**
 * Initialize external link health records in database
 * 
 * Usage: npm run init:external-links
 * 
 * This script creates initial database records for all configured external links
 * and performs an initial health check.
 */

import { prisma } from "../src/prisma";
import { externalLinks } from "../src/config/external-links";
import { checkAllExternalLinks } from "../src/lib/external-link-health";

async function main() {
  console.log("🔧 Initializing external link health records...\n");

  // Create initial records for all configured links
  for (const link of externalLinks) {
    const existing = await prisma.externalLinkHealth.findUnique({
      where: { linkId: link.id },
    });

    if (existing) {
      console.log(`✓ ${link.id} already exists (status: ${existing.status})`);
    } else {
      await prisma.externalLinkHealth.create({
        data: {
          linkId: link.id,
          url: link.url,
          status: "unknown",
          lastCheckedAt: new Date(),
          consecutiveFailures: 0,
        },
      });
      console.log(`✓ Created record for ${link.id}`);
    }
  }

  console.log("\n🔍 Running initial health check...\n");

  const results = await checkAllExternalLinks();

  console.log("\n━".repeat(60));
  console.log("Health Check Results:");
  console.log("━".repeat(60));

  for (const result of results) {
    const status = result.status === "ok" ? "✅ OK" : "❌ UNAVAILABLE";
    console.log(`${status} - ${result.linkId}`);
    console.log(`   URL: ${result.url}`);
    if (result.statusCode) {
      console.log(`   Status Code: ${result.statusCode}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log();
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  const unavailableCount = results.filter((r) => r.status === "unavailable").length;

  console.log("━".repeat(60));
  console.log(`Summary: ${okCount} OK, ${unavailableCount} unavailable`);
  console.log("━".repeat(60));

  console.log("\n✅ Initialization complete!\n");
}

main()
  .catch((error) => {
    console.error("❌ Error during initialization:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
>>>>>>> origin/main
