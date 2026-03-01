import { headers } from "next/headers";
import { env } from "@/env";
import { verifyPaddleWebhook } from "@/lib/paddle-server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
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

  return new Response("OK", { status: 200 });
}
