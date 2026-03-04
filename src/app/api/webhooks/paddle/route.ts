import { headers } from "next/headers";
import { env } from "@/env";
import { verifyPaddleWebhook } from "@/lib/paddle-server";
import { db } from "@/db";
import { productGrants, subscriptions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  if (env.NODE_ENV !== "production") {
    return new Response("OK", { status: 200 });
  }

  if (!env.PADDLE_WEBHOOK_SECRET) {
    console.error("[webhooks/paddle] PADDLE_WEBHOOK_SECRET not configured");
    return new Response("Server configuration error", { status: 503 });
  }

  const rawBody = await req.text();
  const signature = (await headers()).get("Paddle-Signature") ?? "";

  const isValid = await verifyPaddleWebhook(rawBody, signature);
  if (!isValid) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const type = event.event_type;

  if (type === "subscription.activated" || type === "subscription.updated") {
    const sub = event.data;
    const customerId = sub.customer_id;
    const subscriptionId = sub.id;
    const priceId = sub.items?.[0]?.price?.id;
    const currentPeriodEnd = sub.current_billing_period?.ends_at;
    const userId = sub.custom_data?.userId;

    if (userId) {
      await db
        .insert(subscriptions)
        .values({
          userId,
          paddleSubscriptionId: subscriptionId,
          paddleCustomerId: customerId,
          paddlePriceId: priceId,
          currentPeriodEnd: new Date(currentPeriodEnd),
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            paddleSubscriptionId: subscriptionId,
            paddleCustomerId: customerId,
            paddlePriceId: priceId,
            currentPeriodEnd: new Date(currentPeriodEnd),
          },
        });
    }
  }

  if (type === "subscription.canceled") {
    const sub = event.data;
    const userId = sub.custom_data?.userId;
    if (userId) {
      await db
        .delete(subscriptions)
        .where(eq(subscriptions.userId, userId));
    }
  }

  if (type === "transaction.completed") {
    const transaction = event.data;
    const userId = transaction.custom_data?.userId;
    const priceId = transaction.items?.[0]?.price?.id;

    const priceToProduct: Record<string, string> = {
      "pri_01khwk19y0af40zae5fnysj5t3": "grammar-master",
      "pri_01kggqdgjrgyryb19xs3veb1js": "grammar-master",
      "pri_01kgrhp2wtthebpgwmn8eh5ssy": "lease-ai",
    };

    const productKey = priceId ? priceToProduct[priceId] : undefined;

    if (userId && productKey) {
      // Check if paid grant already exists
      const existing = await db
        .select()
        .from(productGrants)
        .where(
          and(
            eq(productGrants.userId, userId),
            eq(productGrants.productKey, productKey),
            eq(productGrants.type, "paid")
          )
        );

      if (existing.length === 0) {
        await db.insert(productGrants).values({
          userId,
          productKey,
          type: "paid",
          status: "active",
        });
      }
    }
  }

  return new Response("OK", { status: 200 });
}
