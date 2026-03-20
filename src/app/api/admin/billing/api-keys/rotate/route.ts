/**
 * ADMIN ONLY: Rotate an API key
 *
 * POST /api/admin/billing/api-keys/rotate
 *
 * Request: { apiKeyId: number }
 * Response: { id, maskedKey, status, newPlainKey, updatedAt }
 *
 * Security:
 * - Admin-only access (checkAdminAuth)
 * - Creates new key, revokes old key
 * - newPlainKey ONLY sent in this response, never logged or persisted
 * - Idempotent: rotating an already-revoked key creates a new one
 * - Logged with [admin:billing:api-key:rotate] prefix
 */

import { db } from "@/db";
import { apiKeys, plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/admin-auth";
import { logInfo, logError } from "@/lib/billing/logger";
import { maskApiKey } from "@/lib/billing/admin-helpers";
import { generateApiKey, hashApiKey } from "@/lib/billing/apiKeyGenerator";

export async function POST(req: Request) {
  // ADMIN ONLY: Check admin auth
  if (!checkAdminAuth()) {
    logError("admin:billing:api-key:rotate", "Unauthorized access attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { apiKeyId } = body;

    if (!apiKeyId || typeof apiKeyId !== "number") {
      logError("admin:billing:api-key:rotate", "Invalid request: missing or invalid apiKeyId");
      return new Response("Invalid request", { status: 400 });
    }

    logInfo("admin:billing:api-key:rotate", `Rotating API key: ${apiKeyId}`);

    // Get the old API key
    const oldKeyResult = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        planId: apiKeys.planId,
        keyHash: apiKeys.keyHash,
        planSlug: plans.slug,
      })
      .from(apiKeys)
      .innerJoin(plans, eq(apiKeys.planId, plans.id))
      .where(eq(apiKeys.id, apiKeyId))
      .limit(1);

    if (oldKeyResult.length === 0) {
      logError("admin:billing:api-key:rotate", `API key not found: ${apiKeyId}`);
      return new Response("API key not found", { status: 404 });
    }

    const oldKey = oldKeyResult[0];

    // Generate new API key
    const newPlainKey = generateApiKey();
    const newKeyHash = hashApiKey(newPlainKey);

    // Create new key
    const newKeyInsert = await db
      .insert(apiKeys)
      .values({
        userId: oldKey.userId,
        planId: oldKey.planId,
        keyHash: newKeyHash,
        status: "active",
        createdAt: new Date(),
      })
      .returning({ id: apiKeys.id });

    const newKeyId = newKeyInsert[0].id;

    // Revoke old key
    await db
      .update(apiKeys)
      .set({ status: "revoked" })
      .where(eq(apiKeys.id, apiKeyId));

    logInfo("admin:billing:api-key:rotate", `API key rotated successfully`, {
      oldKeyId: apiKeyId,
      newKeyId,
      planSlug: oldKey.planSlug,
      userId: oldKey.userId,
    });

    // Return new key info with plain key (ONLY in this response, never logged)
    return new Response(
      JSON.stringify({
        id: newKeyId.toString(),
        maskedKey: maskApiKey(newKeyHash),
        status: "active",
        newPlainKey, // ADMIN ONLY: Sent only in this response, never logged or persisted
        updatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logError("admin:billing:api-key:rotate", "Failed to rotate API key", error);
    return new Response("Failed to rotate API key", { status: 500 });
  }
}
