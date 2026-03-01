import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { env } from "@/env";

let paddle: Paddle | null | undefined;

export async function getPaddle(): Promise<Paddle | null> {
  const token = env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const envValue = env.NEXT_PUBLIC_PADDLE_ENV;

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

export async function openCheckout(priceId: string) {
  const p = await getPaddle();
  if (p) {
    p.Checkout.open({
      items: [{ priceId, quantity: 1 }],
    });
  }
}
