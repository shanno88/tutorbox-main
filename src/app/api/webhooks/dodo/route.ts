/**
 * DoDo Webhook Handler
 *
 * This handler processes webhook events from DoDo payment provider.
 * Currently a placeholder - DoDo integration not yet implemented.
 *
 * Structure mirrors Paddle implementation (src/app/api/webhooks/paddle/route.ts)
 * but with DoDo-specific event handling.
 *
 * TODO: Implement DoDo webhook handling
 * - [ ] Determine DoDo webhook event types and structure
 * - [ ] Implement signature verification for DoDo webhooks
 * - [ ] Implement extractDodoSubscriptionDescriptor()
 * - [ ] Map DoDo price IDs to internal product keys
 * - [ ] Test with real DoDo webhook events
 *
 * Reference: 
 * - src/app/api/webhooks/paddle/route.ts for Paddle implementation
 * - src/lib/billing/dodoWebhookHandler.ts for DoDo extraction functions
 * - https://docs.dodo.com/webhooks (placeholder - update with real URL)
 */

import { headers } from "next/headers";
import { env } from "@/env";
import { db } from "@/db";
import { productGrants } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  getProductKeyFromDodoPriceId,
  logAllMappings,
} from "@/lib/billing/priceMaps";
import {
  isDodoSubscriptionActivated,
  isDodoTransactionCompleted,
  extractDodoSubscriptionDescriptor,
  type DodoWebhookPayload,
} from "@/lib/billing/dodoWebhookHandler";
import { handleSuccessfulSubscription } from "@/lib/billing/handleSuccessfulSubscription";

export async function POST(req: Request) {
  // TODO: Implement DoDo webhook verification
  // For now, only accept in production and log the event
  if (env.NODE_ENV !== "production") {
    console.log("[webhooks/dodo] Webhook received in non-production environment");
    return new Response("OK", { status: 200 });
  }

  // TODO: Get DoDo webhook secret from environment
  // const DODO_WEBHOOK_SECRET = env.DODO_WEBHOOK_SECRET;
  // if (!DODO_WEBHOOK_SECRET) {
  //   console.error("[webhooks/dodo] DODO_WEBHOOK_SECRET not configured");
  //   return new Response("Server configuration error", { status: 503 });
  // }

  const rawBody = await req.text();
  const signature = (await headers()).get("X-DoDo-Signature") ?? "";

  // TODO: Implement DoDo signature verification
  // const isValid = await verifyDodoWebhook(rawBody, signature);
  // if (!isValid) {
  //   console.warn("[webhooks/dodo] Invalid webhook signature");
  //   return new Response("Invalid signature", { status: 400 });
  // }

  const event = JSON.parse(rawBody);
  const type = event.event_type;

  console.log(`[webhooks/dodo] Received event: ${type}`);

  // ─── 订阅类产品（年付订阅）─────────────────────────────
  // TODO: Implement DoDo subscription event handling
  if (type === "subscription.activated" || type === "subscription.updated") {
    const payload: DodoWebhookPayload = {
      event_type: type as any,
      data: event.data,
    };

    // Check if this is an activated subscription (successful payment)
    if (!isDodoSubscriptionActivated(payload)) {
      console.log(
        `[webhooks/dodo] Subscription event is not activated: ${type}`
      );
      return new Response("OK", { status: 200 });
    }

    // Extract subscription descriptor from DoDo event
    const descriptor = extractDodoSubscriptionDescriptor(payload);

    if (!descriptor) {
      // Conservative approach: if extraction fails, we don't grant access
      // but we still return 200 so DoDo doesn't retry forever
      console.warn(
        `[webhooks/dodo] Failed to extract subscription descriptor from event: ${type}`
      );
      return new Response("OK", { status: 200 });
    }

    console.log(
      `[webhooks/dodo] Successfully extracted subscription descriptor:`,
      {
        userId: descriptor.userId,
        productKey: descriptor.productKey,
        planSlug: descriptor.planSlug,
        status: descriptor.status,
      }
    );

    // Call handleSuccessfulSubscription to process the payment
    // This will:
    // 1. Upsert the subscription record in the database
    // 2. Issue or reuse an API key for the user and plan
    // 3. Log the operation for audit trail
    const result = await handleSuccessfulSubscription({
      subscription: descriptor,
      rawEvent: event,
    });

    console.log(`[webhooks/dodo] handleSuccessfulSubscription result:`, result);

    if (!result.success) {
      console.error(
        `[webhooks/dodo] Failed to handle subscription: ${result.error}`
      );
      // Still return 200 OK to DoDo (don't retry)
      return new Response("OK", { status: 200 });
    }

    // Legacy: Update productGrants table for backward compatibility
    // TODO: Remove this once fully migrated to new billing system
    const userId = event.data.custom_data?.userId;
    if (userId) {
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
        console.log(
          `[webhooks/dodo] Creating new productGrant for user ${userId}, product ${descriptor.productKey}`
        );
        await db.insert(productGrants).values({
          userId,
          productKey: descriptor.productKey,
          type: "paid",
          status: "active",
        });
      } else {
        console.log(
          `[webhooks/dodo] Updating existing productGrant for user ${userId}, product ${descriptor.productKey}`
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
    }
  }

  // ─── 订阅取消（到期停用）──────────────────────────
  // TODO: Implement DoDo subscription cancellation handling
  if (type === "subscription.canceled") {
    console.log(
      `[webhooks/dodo] TODO: Implement subscription cancellation handling for event: ${type}`
    );
    // TODO: Implement cancellation logic
    // - Lookup userId from event
    // - Lookup productKey from priceId
    // - Deactivate productGrant
  }

  // ─── 一次性 / 按次产品（一次性购买）────────────────
  // TODO: Implement DoDo transaction event handling
  if (type === "transaction.completed") {
    const payload: DodoWebhookPayload = {
      event_type: type as any,
      data: event.data,
    };

    // Check if this is a completed transaction (successful payment)
    if (!isDodoTransactionCompleted(payload)) {
      console.log(
        `[webhooks/dodo] Transaction event is not completed: ${type}`
      );
      return new Response("OK", { status: 200 });
    }

    // Extract subscription descriptor from DoDo event
    const descriptor = extractDodoSubscriptionDescriptor(payload);

    if (!descriptor) {
      // Conservative approach: if extraction fails, we don't grant access
      // but we still return 200 so DoDo doesn't retry forever
      console.warn(
        `[webhooks/dodo] Failed to extract subscription descriptor from event: ${type}`
      );
      return new Response("OK", { status: 200 });
    }

    console.log(
      `[webhooks/dodo] Successfully extracted subscription descriptor:`,
      {
        userId: descriptor.userId,
        productKey: descriptor.productKey,
        planSlug: descriptor.planSlug,
        status: descriptor.status,
      }
    );

    // Call handleSuccessfulSubscription to process the payment
    // This will:
    // 1. Upsert the subscription record in the database
    // 2. Issue or reuse an API key for the user and plan
    // 3. Log the operation for audit trail
    const result = await handleSuccessfulSubscription({
      subscription: descriptor,
      rawEvent: event,
    });

    console.log(`[webhooks/dodo] handleSuccessfulSubscription result:`, result);

    if (!result.success) {
      console.error(
        `[webhooks/dodo] Failed to handle subscription: ${result.error}`
      );
      // Still return 200 OK to DoDo (don't retry)
      return new Response("OK", { status: 200 });
    }

    // Legacy: Update productGrants table for backward compatibility
    // TODO: Remove this once fully migrated to new billing system
    const userId = event.data.custom_data?.userId;
    if (userId) {
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
        console.log(
          `[webhooks/dodo] Creating new productGrant for user ${userId}, product ${descriptor.productKey}`
        );
        await db.insert(productGrants).values({
          userId,
          productKey: descriptor.productKey,
          type: "paid",
          status: "active",
        });
      } else {
        console.log(
          `[webhooks/dodo] ProductGrant already exists for user ${userId}, product ${descriptor.productKey}`
        );
      }
    }
  }

  return new Response("OK", { status: 200 });
}
