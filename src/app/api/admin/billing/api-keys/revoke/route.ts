/**
 * ADMIN ONLY: Revoke an API key
 *
 * POST /api/admin/billing/api-keys/revoke
 *
 * Request: { apiKeyId: number }
 * Response: { id, maskedKey, status, updatedAt }
 *
 * Security:
 * - Admin-only access (checkAdminAuth)
 * - Marks key as "revoked" so it cannot be used
 * - Idempotent: revoking an already-revoked key is safe
 * - Logged with [admin:billing:api-key:revoke] prefix
 */

import { db } from "@/db";
import { apiKeys, plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/admin-auth";
import { logInfo, logError } from "@/lib/billing/logger";
import { maskApiKey, formatDate } from "@/lib/billing/admin-helpers";

export async function POST(req: Request) {
  // ADMIN ONLY: Check admin auth
  if (!checkAdminAuth()) {
    logError("admin:billing:api-key:revoke", "Unauthorized access attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { apiKeyId } = body;

    if (!apiKeyId || typeof apiKeyId !== "number") {
      logError("admin:billing:api-key:revoke", "Invalid request: missing or invalid apiKeyId");
      return new Response("Invalid request", { status: 400 });
    }

    logInfo("admin:billing:api-key:revoke", `Revoking API key: ${apiKeyId}`);

    // Get the API key with plan details
    const keyResult = await db
      .select({
        id: apiKeys.id,
        keyHash: apiKeys.keyHash,
        status: apiKeys.status,
        createdAt: apiKeys.createdAt,
        planSlug: plans.slug,
      })
      .from(apiKeys)
      .innerJoin(plans, eq(apiKeys.planId, plans.id))
      .where(eq(apiKeys.id, apiKeyId))
      .limit(1);

    if (keyResult.length === 0) {
      logError("admin:billing:api-key:revoke", `API key not found: ${apiKeyId}`);
      return new Response("API key not found", { status: 404 });
    }

    const key = keyResult[0];

    // Idempotency: if already revoked, just return success
    if (key.status === "revoked") {
      logInfo("admin:billing:api-key:revoke", `API key already revoked: ${apiKeyId}`);
      return new Response(
        JSON.stringify({
          id: key.id.toString(),
          maskedKey: maskApiKey(key.keyHash),
          status: "revoked",
          updatedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Mark key as revoked
    await db
      .update(apiKeys)
      .set({ status: "revoked" })
      .where(eq(apiKeys.id, apiKeyId));

    logInfo("admin:billing:api-key:revoke", `API key revoked successfully: ${apiKeyId}`, {
      planSlug: key.planSlug,
    });

    return new Response(
      JSON.stringify({
        id: key.id.toString(),
        maskedKey: maskApiKey(key.keyHash),
        status: "revoked",
        updatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logError("admin:billing:api-key:revoke", "Failed to revoke API key", error);
    return new Response("Failed to revoke API key", { status: 500 });
  }
}
