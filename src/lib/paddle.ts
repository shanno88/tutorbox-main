"use client";

import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { env } from "@/env";

let paddle: Paddle | null | undefined;

/**
 * 初始化并返回全局 Paddle 实例
 */
export async function getPaddle(): Promise<Paddle | null> {
  const token = env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const envValue = env.NEXT_PUBLIC_PADDLE_ENV; // "production" | "sandbox"

  if (!token || !envValue) {
    if (typeof window !== "undefined") {
      console.warn(
        "[Paddle] Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN or NEXT_PUBLIC_PADDLE_ENV. Checkout disabled."
      );
    }
    return null;
  }

  if (!paddle) {
    const p = await initializePaddle({
      environment: envValue as "production" | "sandbox",
      token,
    });
    paddle = p ?? null;
  }

  return paddle ?? null;
}

/**
 * 供组件调用的统一打开 checkout 的函数
 */
export async function openCheckout(options: {
  priceId: string;
  customerEmail?: string;
  userId?: string;
}) {
  const p = await getPaddle();

  if (!p) {
    console.warn("[PaddleCheckoutButton] Paddle not initialized; checkout aborted.");
    return;
  }

  const { priceId, customerEmail, userId } = options;

  if (!priceId) {
    console.warn(
      "[PaddleCheckoutButton] Missing priceId; checkout not opened."
    );
    return;
  }

  console.log("[PaddleCheckoutButton] Using priceId", priceId);

  await p.Checkout.open({
    items: [
      {
        priceId,
        quantity: 1,
      },
    ],
    customer: customerEmail ? { email: customerEmail } : undefined,
    customData: userId ? { userId } : undefined,
  } as any);
}
