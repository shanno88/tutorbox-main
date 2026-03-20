/**
 * GET /api/me/billing
 *
 * Returns the current user's subscription info.
 * Requires authentication.
 *
 * Response: {
 *   user: { id, email },
 *   subscription: { status, planName, planSlug, productKey, provider, currentPeriodEnd, nextBillingDate } | null
 * }
 */

import { db } from "@/db";
import { users, subscriptions, plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { logInfo, logError } from "@/lib/billing/logger";
import { getPlanDetailsBySlug } from "@/lib/billing/priceMaps";
import { formatDate } from "@/lib/billing/admin-helpers";

export async function GET(req: Request) {
  try {
    // Get current user from session
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    logInfo("me:billing", `Fetching billing info for user: ${userId}`);

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
      logError("me:billing", `User not found: ${userId}`);
      return new Response("User not found", { status: 404 });
    }

    const user = userResult[0];

    // Get subscription (if any)
    const subResult = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    let subscription = null;

    if (subResult.length > 0) {
      const sub = subResult[0];
      const now = new Date();
      const periodEnd = new Date(sub.currentPeriodEnd);
      const isActive = periodEnd > now;

      // Determine status
      let status: "trialing" | "active" | "past_due" | "canceled" = "active";
      if (!isActive) {
        status = "past_due";
      }

      // Get plan details from plan slug (if available)
      let planName: string | undefined;
      let planSlug: string | undefined;
      let productKey: string | undefined;

      // Try to get plan details from the subscription's paddle price ID
      // For now, we'll use a simple mapping
      if (sub.paddlePriceId) {
        // In a real scenario, you'd map paddlePriceId to planSlug
        // For this MVP, we'll just show "Unknown Plan"
        planName = "Unknown Plan";
      }

      subscription = {
        status,
        planName,
        planSlug,
        productKey,
        provider: "paddle" as const,
        currentPeriodEnd: formatDate(sub.currentPeriodEnd),
        nextBillingDate: formatDate(sub.currentPeriodEnd),
      };
    }

    logInfo("me:billing", `Fetched billing info for user: ${userId}`, {
      hasSubscription: subscription !== null,
    });

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
        },
        subscription,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logError("me:billing", "Failed to fetch billing info", error);
    return new Response("Failed to fetch billing info", { status: 500 });
  }
}
