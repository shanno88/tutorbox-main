// src/lib/access.ts
import { prisma } from "@/prisma";

export type Product = "grammar" | "castmaster";

export type AccessResult =
  | { access: true; reason: "paid" }
  | { access: true; reason: "trial"; daysLeft: number }
  | { access: false; reason: "expired" };

const TRIAL_DURATION_DAYS = 7;

// Map product keys to database productKey values
const PRODUCT_KEY_MAP: Record<Product, string> = {
  grammar: "grammar-master",
  castmaster: "cast-master",
};

export async function checkUserAccess(
  userId: string,
  product: Product
): Promise<AccessResult> {
  // 1. Query user's trialStartedAt from DB
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialStartedAt: true },
  });

  if (!user) {
    return { access: false, reason: "expired" };
  }

  const productKey = PRODUCT_KEY_MAP[product];

  // 2. Query productGrants for this user + product
  const grant = await prisma.productGrant.findFirst({
    where: {
      userId,
      productKey,
      type: "paid",
      status: "active",
    },
  });

  // 3. If productGrants record exists → return { access: true, reason: "paid" }
  if (grant) {
    return { access: true, reason: "paid" };
  }

  // 4. If trialStartedAt exists AND (now - trialStartedAt) < 7 days
  if (user.trialStartedAt) {
    const now = new Date();
    const trialStart = new Date(user.trialStartedAt);
    const daysSinceStart = Math.floor(
      (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysLeft = TRIAL_DURATION_DAYS - daysSinceStart;

    if (daysLeft > 0) {
      return { access: true, reason: "trial", daysLeft };
    }
  }

  // 5. Otherwise → return { access: false, reason: "expired" }
  return { access: false, reason: "expired" };
}
