/**
 * GET /api/me/api-keys
 *
 * Returns the current user's API keys.
 * Requires authentication.
 *
 * Response: {
 *   user: { id, email },
 *   apiKeys: Array<{ id, maskedKey, planName, planSlug, status, createdAt, expiresAt, currentMonthUsage, monthlyQuota }>
 * }
 */

import { db } from "@/db";
import { users, apiKeys, plans, apiUsage } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { logInfo, logError } from "@/lib/billing/logger";
import { maskApiKey, formatDate } from "@/lib/billing/admin-helpers";

export async function GET(req: Request) {
  try {
    // Get current user from session
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    logInfo("me:api-keys", `Fetching API keys for user: ${userId}`);

    // Get user info
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      logError("me:api-keys", `User not found: ${userId}`);
      return new Response("User not found", { status: 404 });
    }

    const user = userResult[0];

    // Get API keys with plan details
    const keysResult = await db
      .select({
        id: apiKeys.id,
        keyHash: apiKeys.keyHash,
        status: apiKeys.status,
        createdAt: apiKeys.createdAt,
        expiresAt: apiKeys.expiresAt,
        planSlug: plans.slug,
        planName: plans.name,
        quotaPerMonth: plans.quotaPerMonth,
      })
      .from(apiKeys)
      .innerJoin(plans, eq(apiKeys.planId, plans.id))
      .where(eq(apiKeys.userId, userId))
      .orderBy(apiKeys.createdAt);

    // Get current month usage for each key
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const usageResult = await db
      .select({
        apiKeyId: apiUsage.apiKeyId,
        used: apiUsage.used,
      })
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.userId, userId),
          eq(apiUsage.year, currentYear),
          eq(apiUsage.month, currentMonth)
        )
      );

    const usageMap = new Map(usageResult.map((u) => [u.apiKeyId, u.used]));

    // Format response
    const formattedKeys = keysResult.map((key) => {
      const isExpired = key.expiresAt && new Date(key.expiresAt) < now;
      const status = isExpired ? "expired" : (key.status as "active" | "revoked");

      return {
        id: key.id.toString(),
        maskedKey: maskApiKey(key.keyHash),
        planName: key.planName,
        planSlug: key.planSlug,
        status,
        createdAt: formatDate(key.createdAt),
        expiresAt: formatDate(key.expiresAt),
        currentMonthUsage: usageMap.get(key.id) || 0,
        monthlyQuota: key.quotaPerMonth,
      };
    });

    logInfo("me:api-keys", `Fetched ${formattedKeys.length} API key(s) for user: ${userId}`);

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
        },
        apiKeys: formattedKeys,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logError("me:api-keys", "Failed to fetch API keys", error);
    return new Response("Failed to fetch API keys", { status: 500 });
  }
}
