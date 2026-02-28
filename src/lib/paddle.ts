import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { env } from "@/env";

let paddle: Paddle | undefined;

export async function getPaddle() {
  if (!paddle) {
    paddle = await initializePaddle({
      environment: env.NEXT_PUBLIC_PADDLE_ENV as "production" | "sandbox",
      token: env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    });
  }
  return paddle;
}

export async function openCheckout(priceId: string) {
  const p = await getPaddle();
  p?.Checkout.open({
    items: [{ priceId, quantity: 1 }],
  });
}
