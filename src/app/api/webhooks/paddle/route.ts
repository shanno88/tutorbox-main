import { headers } from "next/headers";
import { env } from "@/env";
import { verifyPaddleWebhook } from "@/lib/paddle-server";
import { db } from "@/db";
import { productGrants } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  getProductKeyFromPriceId as getProductKeyFromPriceIdDynamic,
  logPriceToProductMapping,
} from "@/lib/paddle-mappings";
import {
  getProductKeyFromPaddlePriceId,
  logAllMappings,
} from "@/lib/billing/priceMaps";
import { handleSuccessfulPayment } from "@/lib/billing/issueKeyFromWebhook";
import {
  isPaddleSubscriptionActivated,
  isPaddleTransactionCompleted,
  extractPaddleSubscriptionDescriptor,
  type PaddleWebhookPayload,
} from "@/lib/billing/paddleWebhookHandler";
import { handleSuccessfulSubscription } from "@/lib/billing/handleSuccessfulSubscription";
import { logInfo, logWarn, logError, recordWebhookError } from "@/lib/billing/logger";
import { storeDeadLetter } from "@/lib/billing/dead-letter";

export async function POST(req: Request) {
  // ─── BEST PRACTICE 1: Always reply quickly with 2xx ───────────────────
  // We'll return 200 OK at the end, even if processing fails internally.
  // This prevents Paddle from retrying forever on our errors.

  if (env.NODE_ENV !== "production") {
    return new Response("OK", { status: 200 });
  }

  // ─── BEST PRACTICE 2: Signature verification BEFORE business logic ─────
  if (!env.PADDLE_WEBHOOK_SECRET) {
    logError("webhook:paddle", "PADDLE_WEBHOOK_SECRET not configured");
    recordWebhookError("paddle", "missing_secret", "PADDLE_WEBHOOK_SECRET not set");
    return new Response("OK", { status: 200 });
  }

  const rawBody = await req.text();
  const signature = (await headers()).get("Paddle-Signature") ?? "";

  const isValid = await verifyPaddleWebhook(rawBody, signature);
  if (!isValid) {
    logWarn("webhook:paddle", "Invalid webhook signature");
    recordWebhookError("paddle", "invalid_signature", "Signature verification failed");
    // Store in dead-letter for security review
    await storeDeadLetter(
      "paddle",
      "unknown",
      rawBody,
      "invalid_signature",
      "Signature verification failed"
    );
    return new Response("OK", { status: 200 });
  }

  // ─── BEST PRACTICE 3: Input validation on required fields ──────────────
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (error) {
    logError("webhook:paddle", "Failed to parse JSON payload");
    recordWebhookError("paddle", "invalid_json", "JSON parsing failed");
    await storeDeadLetter(
      "paddle",
      "unknown",
      rawBody,
      "invalid_json",
      error instanceof Error ? error.message : String(error)
    );
    return new Response("OK", { status: 200 });
  }

  const type = event.event_type;
  if (!type || typeof type !== "string") {
    logError("webhook:paddle", "Missing or invalid event_type");
    recordWebhookError("paddle", "missing_event_type", "event_type field missing");
    await storeDeadLetter(
      "paddle",
      "unknown",
      rawBody,
      "missing_event_type",
      "event_type field is missing or not a string"
    );
    return new Response("OK", { status: 200 });
  }

  logInfo("webhook:paddle", `Received event: ${type}`, { eventId: event.id });

  // ─── 订阅类产品（年付订阅）─────────────────────────────
  if (type === "subscription.activated" || type === "subscription.updated") {
    const payload: PaddleWebhookPayload = {
      event_type: type as any,
      data: event.data,
    };

    // Check if this is an activated subscription (successful payment)
    if (!isPaddleSubscriptionActivated(payload)) {
      logInfo(
        "webhook:paddle",
        `Subscription event is not activated: ${type}`
      );
      return new Response("OK", { status: 200 });
    }

    // Extract subscription descriptor from Paddle event
    const descriptor = extractPaddleSubscriptionDescriptor(payload);

    if (!descriptor) {
      logWarn(
        "webhook:paddle",
        `Failed to extract subscription descriptor from event: ${type}`
      );
      recordWebhookError("paddle", "extraction_failed", `Event: ${type}`);
      // Store in dead-letter for manual review
      await storeDeadLetter(
        "paddle",
        type,
        rawBody,
        "extraction_failed",
        "Could not extract subscription descriptor",
        event.id
      );
      return new Response("OK", { status: 200 });
    }

    logInfo(
      "webhook:paddle",
      `Successfully extracted subscription descriptor`,
      {
        userId: descriptor.userId,
        productKey: descriptor.productKey,
        planSlug: descriptor.planSlug,
        status: descriptor.status,
      }
    );

    // Call handleSuccessfulSubscription to process the payment
    const result = await handleSuccessfulSubscription({
      subscription: descriptor,
      rawEvent: event,
    });

    logInfo("webhook:paddle", `handleSuccessfulSubscription result:`, result);

    if (!result.success) {
      const errorMsg = result.error || "unknown error";
      logError(
        "webhook:paddle",
        `Failed to handle subscription: ${errorMsg}`
      );
      recordWebhookError("paddle", "subscription_handling_failed", errorMsg);
      // Store in dead-letter for manual review
      await storeDeadLetter(
        "paddle",
        type,
        rawBody,
        "subscription_handling_failed",
        {
          error: errorMsg,
          reason: result.reason,
          userId: descriptor.userId,
          productKey: descriptor.productKey,
        },
        event.id
      );
      return new Response("OK", { status: 200 });
    }

    // Legacy: Update productGrants table for backward compatibility
    // TODO: Remove this once fully migrated to new billing system
    const userId = event.data.custom_data?.userId;
    if (userId && typeof userId === "string") {
      try {
        const existing = await db
          .select()
          .from(productGrants)
          .where(
            and(
              eq(productGrants.userId, userId),
              eq(productGrants.productKey, descriptor.productKey),
              eq(productGrants.type, "paid")
            )
          );

        if (existing.length === 0) {
          logInfo(
            "webhook:paddle",
            `Creating new productGrant for user ${userId}, product ${descriptor.productKey}`
          );
          await db.insert(productGrants).values({
            userId,
            productKey: descriptor.productKey,
            type: "paid",
            status: "active",
          });
        } else {
          logInfo(
            "webhook:paddle",
            `Updating existing productGrant for user ${userId}, product ${descriptor.productKey}`
          );
          await db
            .update(productGrants)
            .set({ status: "active" })
            .where(
              and(
                eq(productGrants.userId, userId),
                eq(productGrants.productKey, descriptor.productKey),
                eq(productGrants.type, "paid")
              )
            );
        }
      } catch (error) {
        logError(
          "webhook:paddle",
          `Failed to update productGrants: ${error instanceof Error ? error.message : String(error)}`
        );
        // Don't fail the webhook for legacy table updates
      }
    }
  }

  // ─── 订阅取消（到期停用）──────────────────────────
  if (type === "subscription.canceled") {
    const sub = event.data;
    const subscriptionId = sub.id;
    const userId = sub.custom_data?.userId;
    const priceId = sub.items?.[0]?.price?.id;

    logInfo(
      "webhook:paddle",
      `Subscription canceled: userId=${userId}, priceId=${priceId}`
    );

    if (!userId) {
      logWarn(
        "webhook:paddle",
        `Missing userId in custom_data for subscription ${subscriptionId}`
      );
      recordWebhookError("paddle", "missing_user_id", `Subscription: ${subscriptionId}`);
      await storeDeadLetter(
        "paddle",
        type,
        rawBody,
        "missing_user_identifier",
        "userId missing in custom_data",
        event.id
      );
    } else if (!priceId) {
      logWarn(
        "webhook:paddle",
        `Missing priceId in subscription ${subscriptionId}`
      );
      recordWebhookError("paddle", "missing_price_id", `Subscription: ${subscriptionId}`);
      await storeDeadLetter(
        "paddle",
        type,
        rawBody,
        "missing_price_id",
        "priceId missing in items",
        event.id
      );
    } else {
      // Map Paddle price ID to internal product key using centralized mapping
      const productKey = getProductKeyFromPaddlePriceId(priceId);

      if (!productKey) {
        logError(
          "webhook:paddle",
          `CRITICAL: Unknown Paddle priceId in cancellation: ${priceId}. Cannot deactivate access for user ${userId}.`
        );
        recordWebhookError("paddle", "unknown_price_id_cancellation", `Price ID: ${priceId}`);
        logAllMappings();
        await storeDeadLetter(
          "paddle",
          type,
          rawBody,
          "unknown_price_id",
          {
            priceId,
            userId,
            message: "Price ID not found in mappings",
          },
          event.id
        );
      } else {
        try {
          logInfo(
            "webhook:paddle",
            `Deactivating productGrant for user ${userId}, product ${productKey}`
          );
          await db
            .update(productGrants)
            .set({ status: "inactive" })
            .where(
              and(
                eq(productGrants.userId, userId),
                eq(productGrants.productKey, productKey),
                eq(productGrants.type, "paid")
              )
            );
        } catch (error) {
          logError(
            "webhook:paddle",
            `Failed to deactivate productGrant: ${error instanceof Error ? error.message : String(error)}`
          );
          await storeDeadLetter(
            "paddle",
            type,
            rawBody,
            "database_error",
            error instanceof Error ? error.message : String(error),
            event.id
          );
        }
      }
    }
  }

  // ─── 一次性 / 按次产品（一次性购买）────────────────
  if (type === "transaction.completed") {
    const payload: PaddleWebhookPayload = {
      event_type: type as any,
      data: event.data,
    };

    // Check if this is a completed transaction (successful payment)
    if (!isPaddleTransactionCompleted(payload)) {
      logInfo(
        "webhook:paddle",
        `Transaction event is not completed: ${type}`
      );
      return new Response("OK", { status: 200 });
    }

    // Extract subscription descriptor from Paddle event
    const descriptor = extractPaddleSubscriptionDescriptor(payload);

    if (!descriptor) {
      logWarn(
        "webhook:paddle",
        `Failed to extract subscription descriptor from event: ${type}`
      );
      recordWebhookError("paddle", "extraction_failed", `Event: ${type}`);
      await storeDeadLetter(
        "paddle",
        type,
        rawBody,
        "extraction_failed",
        "Could not extract subscription descriptor",
        event.id
      );
      return new Response("OK", { status: 200 });
    }

    logInfo(
      "webhook:paddle",
      `Successfully extracted subscription descriptor`,
      {
        userId: descriptor.userId,
        productKey: descriptor.productKey,
        planSlug: descriptor.planSlug,
        status: descriptor.status,
      }
    );

    // Call handleSuccessfulSubscription to process the payment
    const result = await handleSuccessfulSubscription({
      subscription: descriptor,
      rawEvent: event,
    });

    logInfo("webhook:paddle", `handleSuccessfulSubscription result:`, result);

    if (!result.success) {
      const errorMsg = result.error || "unknown error";
      logError(
        "webhook:paddle",
        `Failed to handle subscription: ${errorMsg}`
      );
      recordWebhookError("paddle", "subscription_handling_failed", errorMsg);
      await storeDeadLetter(
        "paddle",
        type,
        rawBody,
        "subscription_handling_failed",
        {
          error: errorMsg,
          reason: result.reason,
          userId: descriptor.userId,
          productKey: descriptor.productKey,
        },
        event.id
      );
      return new Response("OK", { status: 200 });
    }

    // Legacy: Update productGrants table for backward compatibility
    // TODO: Remove this once fully migrated to new billing system
    const userId = event.data.custom_data?.userId;
    if (userId && typeof userId === "string") {
      try {
        const existing = await db
          .select()
          .from(productGrants)
          .where(
            and(
              eq(productGrants.userId, userId),
              eq(productGrants.productKey, descriptor.productKey),
              eq(productGrants.type, "paid")
            )
          );

        if (existing.length === 0) {
          logInfo(
            "webhook:paddle",
            `Creating new productGrant for user ${userId}, product ${descriptor.productKey}`
          );
          await db.insert(productGrants).values({
            userId,
            productKey: descriptor.productKey,
            type: "paid",
            status: "active",
          });
        } else {
          logInfo(
            "webhook:paddle",
            `ProductGrant already exists for user ${userId}, product ${descriptor.productKey}`
          );
        }
      } catch (error) {
        logError(
          "webhook:paddle",
          `Failed to update productGrants: ${error instanceof Error ? error.message : String(error)}`
        );
        // Don't fail the webhook for legacy table updates
      }
    }
  }

  // ─── BEST PRACTICE 1: Always reply with 2xx ──────────────────────────
  return new Response("OK", { status: 200 });
}
