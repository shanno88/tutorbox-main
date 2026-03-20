import { db } from "@/db";
import { subscriptions, apiKeys, plans, apiUsage, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/admin-auth";
import { logInfo, logError } from "@/lib/billing/logger";
import { maskApiKey, formatDate } from "@/lib/billing/admin-helpers";
import {
  getProductKeyFromPaddlePriceId,
  getPlanDetailsBySlug,
} from "@/lib/billing/priceMaps";

/**
 * ADMIN ONLY: Get user's billing details
 *
 * GET /api/admin/billing/user/[userId]
 *
 * Returns:
 * - User info (id, email, createdAt)
 * - Subscriptions (if any)
 * - API keys with masked display (never returns full key)
 * - Current month usage for each API key
 *
 * Response: {
 *   user: { id, email, createdAt },
 *   subscriptions: [...],
 *   apiKeys: [...]
 * }
 */
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  // ADMIN ONLY: Check admin auth
  if (!checkAdminAuth()) {
    logError("admin:billing:user", "Unauthorized access attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = params.userId;

  try {
    logInfo("admin:billing:user", `Fetching details for user: ${userId}`);

    // Get user info
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.emailVerified,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      logInfo("admin:billing:user", `User not found: ${userId}`);
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult[0];

    // Get subscriptions
    const subscriptionsResult = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    // Get API keys with plan details
    const apiKeysResult = await db
      .select({
        id: apiKeys.id,
        keyHash: apiKeys.keyHash,
        status: apiKeys.status,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
        planId: apiKeys.planId,
        planSlug: plans.slug,
        planName: plans.name,
        rateLimitPerMin: plans.rateLimitPerMin,
        quotaPerMonth: plans.quotaPerMonth,
      })
      .from(apiKeys)
      .innerJoin(plans, eq(apiKeys.planId, plans.id))
      .where(eq(apiKeys.userId, userId))
      .orderBy(apiKeys.createdAt);

    // Get current month usage for each API key
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
    const response = {
      user: {
        id: user.id,
        email: user.email,
        createdAt: formatDate(user.createdAt) || new Date().toISOString(),
      },
      subscriptions: subscriptionsResult.map((sub) => {
        // Map Paddle price ID to product key
        const productKey = getProductKeyFromPaddlePriceId(sub.paddlePriceId);

        // Determine subscription status based on currentPeriodEnd
        const now = new Date();
        const periodEnd = new Date(sub.currentPeriodEnd);
        const isActive = periodEnd > now;
        const status = isActive ? ("active" as const) : ("past_due" as const);

        // Find a plan slug that matches this product key
        // Since we don't have a direct mapping from priceId to planSlug,
        // we use the first available plan for this product
        let planSlug = "unknown";
        if (productKey) {
          // Try to find a plan detail that matches this product key
          // by checking all plan details
          const planDetails = Object.values(
            require("@/lib/billing/priceMaps").planSlugToDetails
          ).find((detail: any) => detail.productKey === productKey);
          if (planDetails) {
            planSlug = planDetails.slug;
          }
        }

        return {
          id: sub.userId,
          provider: "paddle" as const,
          productKey: productKey || "unknown",
          planSlug,
          status,
          currentPeriodStart: undefined,
          currentPeriodEnd: formatDate(sub.currentPeriodEnd),
          providerSubscriptionId: sub.paddleSubscriptionId,
          updatedAt: formatDate(sub.currentPeriodEnd),
        };
      }),
      apiKeys: apiKeysResult.map((key) => {
        // Get product key from plan slug using priceMaps
        const planDetail = getPlanDetailsBySlug(key.planSlug);
        const productKey = planDetail?.productKey || "unknown";

        return {
          id: key.id.toString(),
          maskedKey: maskApiKey(key.keyHash),
          productKey,
          planSlug: key.planSlug,
          status: key.status as "active" | "revoked",
          createdAt: formatDate(key.createdAt),
          expiresAt: formatDate(key.expiresAt),
          lastUsedAt: undefined, // Not tracked in current schema
          currentMonthUsage: usageMap.get(key.id) || 0,
          monthlyQuota: key.quotaPerMonth,
        };
      }),
    };

    logInfo("admin:billing:user", `Fetched details for user: ${userId}`, {
      subscriptionCount: response.subscriptions.length,
      apiKeyCount: response.apiKeys.length,
    });

    return Response.json(response);
  } catch (error) {
    logError("admin:billing:user", "Failed to fetch user details", error);
    return Response.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}
