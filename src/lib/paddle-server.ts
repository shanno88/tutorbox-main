import { env } from "@/env";

export async function verifyPaddleWebhook(
  rawBody: string,
  signature: string
): Promise<boolean> {
  const secret = env.PADDLE_WEBHOOK_SECRET;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = Buffer.from(signature, "hex");
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(rawBody));
}
