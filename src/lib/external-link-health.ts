// External link health check logic
import { prisma } from "@/prisma";
import { externalLinks, type ExternalLink } from "@/config/external-links";

const FAILURE_THRESHOLD = 3; // Mark as unavailable after 3 consecutive failures

export interface HealthCheckResult {
  linkId: string;
  url: string;
  status: "ok" | "unavailable";
  statusCode?: number;
  error?: string;
  timestamp: Date;
}

/**
 * Perform HTTP health check for a single external link
 */
export async function checkExternalLink(
  link: ExternalLink
): Promise<HealthCheckResult> {
  const method = link.checkMethod || "HEAD";
  const expectedStatus = link.expectedStatus || [200, 301, 302];
  const timeout = link.timeout || 5000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(link.url, {
      method,
      signal: controller.signal,
      redirect: "manual", // Don't follow redirects automatically
    });

    clearTimeout(timeoutId);

    const isOk = expectedStatus.includes(response.status);

    return {
      linkId: link.id,
      url: link.url,
      status: isOk ? "ok" : "unavailable",
      statusCode: response.status,
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      linkId: link.id,
      url: link.url,
      status: "unavailable",
      error: errorMessage,
      timestamp: new Date(),
    };
  }
}

/**
 * Update database with health check result
 */
export async function updateLinkHealth(
  result: HealthCheckResult
): Promise<void> {
  const existing = await prisma.externalLinkHealth.findUnique({
    where: { linkId: result.linkId },
  });

  const isFailure = result.status === "unavailable";
  const consecutiveFailures = existing
    ? isFailure
      ? existing.consecutiveFailures + 1
      : 0
    : isFailure
      ? 1
      : 0;

  // Mark as unavailable only after FAILURE_THRESHOLD consecutive failures
  const finalStatus =
    consecutiveFailures >= FAILURE_THRESHOLD ? "unavailable" : result.status;

  await prisma.externalLinkHealth.upsert({
    where: { linkId: result.linkId },
    create: {
      linkId: result.linkId,
      url: result.url,
      status: finalStatus,
      lastCheckedAt: result.timestamp,
      lastStatusCode: result.statusCode,
      consecutiveFailures,
      lastError: result.error,
    },
    update: {
      status: finalStatus,
      lastCheckedAt: result.timestamp,
      lastStatusCode: result.statusCode,
      consecutiveFailures,
      lastError: result.error,
    },
  });
}

/**
 * Check all configured external links and update database
 */
export async function checkAllExternalLinks(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  for (const link of externalLinks) {
    const result = await checkExternalLink(link);
    await updateLinkHealth(result);
    results.push(result);
  }

  return results;
}

/**
 * Get current health status for a specific link
 */
export async function getLinkHealth(linkId: string) {
  return await prisma.externalLinkHealth.findUnique({
    where: { linkId },
  });
}

/**
 * Get health status for all links (in-memory, no database)
 */
export async function getAllLinkHealth() {
  const results = [];

  for (const link of externalLinks) {
    try {
      const result = await checkExternalLink(link);
      results.push({
        linkId: result.linkId,
        url: result.url,
        status: result.status,
        lastCheckedAt: result.timestamp,
        lastStatusCode: result.statusCode ?? null,
        lastError: result.error ?? null,
        consecutiveFailures: result.status === "unavailable" ? 1 : 0,
      });
    } catch (error) {
      // If check fails, mark as unavailable
      results.push({
        linkId: link.id,
        url: link.url,
        status: "unavailable",
        lastCheckedAt: new Date(),
        lastStatusCode: null,
        lastError: error instanceof Error ? error.message : "Unknown error",
        consecutiveFailures: 1,
      });
    }
  }

  return results;
}
