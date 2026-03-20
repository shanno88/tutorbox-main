/**
 * POST /api/me/api-keys/rotate
 *
 * Rotate the current user's API key.
 * Requires authentication.
 * User can only rotate their own keys.
 *
 * Request: { apiKeyId: string }
 * Response: { id, maskedKey, plainKey, planName, status, createdAt }
 */

import { db } from "@/db";
import { apiKeys, plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { logInfo, logError } from "@/lib/billing/logger";
import { maskApiKey, formatDate } from "@/lib/billing/admin-helpers";
import { generateApiKey, hashApiKey } from "@/lib/billing/apiKeyGenerator";

export async function POST(req: Request) {
  try {
    // Get current user from session
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { apiKeyId } = body;

    if (!apiKeyId) {
      logError("me:api-keys:rotate", "Invalid request: missing apiKeyId");
      return new Response("Invalid request", { status: 400 });
    }

    logInfo("me:api-keys:rotate", `Rotating API key for user: ${userId}`, {
      apiKeyId,
    });

    // Get the old API key (verify it belongs to current user)
    const oldKeyResult = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        planId: apiKeys.planId,
        keyHash: apiKeys.keyHash,
        planSlug: plans.slug,
        planName: plans.name,
      })
      .from(apiKeys)
      .innerJoin(plans, eq(apiKeys.planId, plans.id))
      .where(eq(apiKeys.id, parseInt(apiKeyId)))
      .limit(1);

    if (oldKeyResult.length === 0) {
      logError("me:api-keys:rotate", `API key not found: ${apiKeyId}`);
      return new Response("API key not found", { status: 404 });
    }

    const oldKey = oldKeyResult[0];

    // Verify the key belongs to the current user
    if (oldKey.userId !== userId) {
      logError("me:api-keys:rotate", `User ${userId} tried to rotate key belonging to ${oldKey.userId}`);
      return new Response("Unauthorized", { status: 403 });
    }

    // Generate new API key
    const newPlainKey = generateApiKey();
    const newKeyHash = hashApiKey(newPlainKey);

    // Create new key
    const newKeyInsert = await db
      .insert(apiKeys)
      .values({
        userId,
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
      .where(eq(apiKeys.id, oldKey.id));

    logInfo("me:api-keys:rotate", `API key rotated successfully for user: ${userId}`, {
      oldKeyId: oldKey.id,
      newKeyId,
      planSlug: oldKey.planSlug,
    });

    // Return new key info with plain key (ONLY in this response, never logged)
    return new Response(
      JSON.stringify({
        id: newKeyId.toString(),
        maskedKey: maskApiKey(newKeyHash),
        plainKey: newPlainKey, // CRITICAL: Only in this response, never logged or persisted
        planName: oldKey.planName,
        status: "active",
        createdAt: formatDate(new Date()),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logError("me:api-keys:rotate", "Failed to rotate API key", error);
    return new Response("Failed to rotate API key", { status: 500 });
  }
}
