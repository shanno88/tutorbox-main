/**
 * Webhook Dead-Letter Handling
 *
 * Stores webhook events that could not be processed successfully.
 * Used for debugging, replay, and compliance auditing.
 *
 * A dead-letter is created when:
 * - Signature verification fails
 * - Event extraction fails (missing required fields)
 * - Subscription handling fails (database errors, etc.)
 * - Any other unrecoverable error occurs
 *
 * Dead-letters can be:
 * - Reviewed by admins in the dashboard
 * - Replayed manually after fixing the underlying issue
 * - Exported for compliance auditing
 */

import { db } from "@/db";
import { webhookDeadLetters } from "@/db/schema";
import type { BillingProvider } from "@/lib/billing/model";
import { logError, logInfo } from "@/lib/billing/logger";
import { eq, and, desc } from "drizzle-orm";

/**
 * Reasons for dead-lettering a webhook
 */
export type DeadLetterReason =
  | "invalid_signature"
  | "missing_secret"
  | "invalid_json"
  | "missing_event_type"
  | "extraction_failed"
  | "missing_price_id"
  | "missing_user_identifier"
  | "unknown_price_id"
  | "subscription_handling_failed"
  | "database_error"
  | "unexpected_error";

/**
 * Store a webhook event in the dead-letter table
 *
 * @param provider - Payment provider (paddle, dodo)
 * @param eventType - Event type from webhook
 * @param rawPayload - Full webhook payload as JSON string
 * @param reason - Why the event could not be processed
 * @param details - Additional error details
 * @param eventId - Optional provider event ID
 */
export async function storeDeadLetter(
  provider: BillingProvider,
  eventType: string,
  rawPayload: string,
  reason: DeadLetterReason,
  details?: unknown,
  eventId?: string
): Promise<void> {
  const logPrefix = "billing:dead-letter";

  try {
    logInfo(logPrefix, `Storing dead-letter for ${provider}/${eventType}`, {
      reason,
      eventId,
    });

    const failureDetails = details
      ? typeof details === "string"
        ? details
        : JSON.stringify(details)
      : null;

    await db.insert(webhookDeadLetters).values({
      provider,
      eventType,
      eventId: eventId || null,
      rawPayload,
      failureReason: reason,
      failureDetails,
      status: "pending",
    });

    logInfo(logPrefix, `Dead-letter stored successfully for ${provider}/${eventType}`);
  } catch (error) {
    logError(
      logPrefix,
      `Failed to store dead-letter: ${error instanceof Error ? error.message : String(error)}`
    );
    // Don't throw - we don't want dead-letter storage failures to break the webhook handler
  }
}

/**
 * Get pending dead-letters for a provider
 *
 * @param provider - Payment provider
 * @param limit - Maximum number to return
 * @returns Array of pending dead-letters
 */
export async function getPendingDeadLetters(
  provider: BillingProvider,
  limit: number = 100
) {
  try {
    const letters = await db.query.webhookDeadLetters.findMany({
      where: and(eq(webhookDeadLetters.provider, provider), eq(webhookDeadLetters.status, "pending")),
      limit,
      orderBy: [desc(webhookDeadLetters.createdAt)],
    });

    return letters;
  } catch (error) {
    logError(
      "billing:dead-letter",
      `Failed to fetch dead-letters: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}

/**
 * Mark a dead-letter as resolved
 *
 * @param id - Dead-letter ID
 * @param resolvedBy - Admin user who resolved it
 * @param notes - Resolution notes
 */
export async function resolveDeadLetter(
  id: bigint,
  resolvedBy: string,
  notes: string
): Promise<void> {
  try {
    await db
      .update(webhookDeadLetters)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        resolvedBy,
        resolutionNotes: notes,
      })
      .where(eq(webhookDeadLetters.id, id));

    logInfo("billing:dead-letter", `Dead-letter ${id} marked as resolved`);
  } catch (error) {
    logError(
      "billing:dead-letter",
      `Failed to resolve dead-letter: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get dead-letter statistics
 *
 * @returns Statistics about dead-letters
 */
export async function getDeadLetterStats() {
  try {
    const allLetters = await db.query.webhookDeadLetters.findMany();

    const stats = {
      total: allLetters.length,
      pending: allLetters.filter((l) => l.status === "pending").length,
      resolved: allLetters.filter((l) => l.status === "resolved").length,
      ignored: allLetters.filter((l) => l.status === "ignored").length,
      byProvider: {} as Record<string, number>,
      byReason: {} as Record<string, number>,
    };

    // Count by provider
    for (const letter of allLetters) {
      stats.byProvider[letter.provider] =
        (stats.byProvider[letter.provider] || 0) + 1;
      stats.byReason[letter.failureReason] =
        (stats.byReason[letter.failureReason] || 0) + 1;
    }

    return stats;
  } catch (error) {
    logError(
      "billing:dead-letter",
      `Failed to get stats: ${error instanceof Error ? error.message : String(error)}`
    );
    return {
      total: 0,
      pending: 0,
      resolved: 0,
      ignored: 0,
      byProvider: {},
      byReason: {},
    };
  }
}
