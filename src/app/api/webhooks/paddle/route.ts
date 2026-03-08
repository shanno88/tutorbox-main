import { headers } from "next/headers";
import { env } from "@/env";
import { verifyPaddleWebhook } from "@/lib/paddle-server";
import { db } from "@/db";
import { productGrants } from "@/db/schema";
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

  // ─── 订阅类产品（播感大师年付）─────────────────────────────
  if (type === "subscription.activated" || type === "subscription.updated") {
    const sub = event.data;
    const subscriptionId = sub.id;
    const priceId = sub.items?.[0]?.price?.id;
    const userId = sub.custom_data?.userId;

    if (userId) {
      // Subscriptions table removed - using productGrants only
      // 1. 写入 subscriptions 表（原有逻辑保留）
      // await db
      //   .insert(subscriptions)
      //   .values({
      //     userId,
      //     paddleSubscriptionId: subscriptionId,
      //     paddleCustomerId: customerId,
      //     paddlePriceId: priceId,
      //     currentPeriodEnd: new Date(currentPeriodEnd),
      //   })
      //   .onConflictDoUpdate({
      //     target: subscriptions.userId,
      //     set: {
      //       paddleSubscriptionId: subscriptionId,
      //       paddleCustomerId: customerId,
      //       paddlePriceId: priceId,
      //       currentPeriodEnd: new Date(currentPeriodEnd),
      //     },
      //   });

      // 2. 播感大师订阅 → 同步写入 productGrants
      const PROMPTER_PRICE_IDS = [
        env.NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY,
      ].filter(Boolean);

      const GRAMMAR_PRICE_IDS = [
        "pri_01khwk19y0af40zae5fnysj5t3",
        "pri_01kggqdgjrgyryb19xs3veb1js",
      ];

      if (priceId && PROMPTER_PRICE_IDS.includes(priceId)) {
        const existing = await db
          .select()
          .from(productGrants)
          .where(
            and(
              eq(productGrants.userId, userId),
              eq(productGrants.productKey, "ai-prompter"),
              eq(productGrants.type, "paid")
            )
          );

        if (existing.length === 0) {
          await db.insert(productGrants).values({
            userId,
            productKey: "ai-prompter",
            type: "paid",
            status: "active",
          });
        } else {
          // 续费：更新状态为 active（防止被取消后又续费的情况）
          await db
            .update(productGrants)
            .set({ status: "active" })
            .where(
              and(
                eq(productGrants.userId, userId),
                eq(productGrants.productKey, "ai-prompter"),
                eq(productGrants.type, "paid")
              )
            );
        }
      }

      // 3. 语法大师年付订阅 → 同步写入 productGrants
      if (priceId && GRAMMAR_PRICE_IDS.includes(priceId)) {
        const existing = await db
          .select()
          .from(productGrants)
          .where(
            and(
              eq(productGrants.userId, userId),
              eq(productGrants.productKey, "grammar-master"),
              eq(productGrants.type, "paid")
            )
          );

        if (existing.length === 0) {
          await db.insert(productGrants).values({
            userId,
            productKey: "grammar-master",
            type: "paid",
            status: "active",
          });
        } else {
          await db
            .update(productGrants)
            .set({ status: "active" })
            .where(
              and(
                eq(productGrants.userId, userId),
                eq(productGrants.productKey, "grammar-master"),
                eq(productGrants.type, "paid")
              )
            );
        }
      }
    }
  }

  // ─── 订阅取消（播感大师到期停用）──────────────────────────
  if (type === "subscription.canceled") {
    const sub = event.data;
    const userId = sub.custom_data?.userId;
    const priceId = sub.items?.[0]?.price?.id;

    if (userId) {
      // Subscriptions table removed - using productGrants only
      // 原有逻辑：删 subscriptions 表
      // await db
      //   .delete(subscriptions)
      //   .where(eq(subscriptions.userId, userId));

      // 播感大师：标记 productGrants 为 inactive（不删，保留记录）
      const PROMPTER_PRICE_IDS = [
        env.NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY,
      ].filter(Boolean);

      if (priceId && PROMPTER_PRICE_IDS.includes(priceId)) {
        await db
          .update(productGrants)
          .set({ status: "inactive" })
          .where(
            and(
              eq(productGrants.userId, userId),
              eq(productGrants.productKey, "ai-prompter"),
              eq(productGrants.type, "paid")
            )
          );
      }
    }
  }

  // ─── 一次性 / 按次产品（语法大师、美国租约）────────────────
  if (type === "transaction.completed") {
    const transaction = event.data;
    const userId = transaction.custom_data?.userId;
    const priceId = transaction.items?.[0]?.price?.id;

    const priceToProduct: Record<string, string> = {
      // 美国租约
      "pri_01kgrhp2wtthebpgwmn8eh5ssy": "lease-ai",
    };

    const productKey = priceId ? priceToProduct[priceId] : undefined;

    if (userId && productKey) {
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
