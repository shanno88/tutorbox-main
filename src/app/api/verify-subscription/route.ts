import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

const PRODUCT_SLUG_TO_PRICE_ID: Record<string, string> = {
  "grammar-master": process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD ?? "",
  "grammar-master-zh": process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY ?? "",
  "lease-ai": process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD ?? "",
};

const PRICE_ID_TO_PLAN: Record<string, string> = {
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD ?? ""]: "grammar-master",
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY ?? ""]: "grammar-master",
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD ?? ""]: "lease-ai",
};

export async function POST(req: Request) {
  // Subscriptions table removed - this endpoint is disabled
  // Use productGrants and trial system instead
  return NextResponse.json(
    { valid: false, error: "SUBSCRIPTIONS_DISABLED" },
    { status: 501 }
  );

  /* ORIGINAL CODE - DISABLED BECAUSE SUBSCRIPTIONS TABLE DOESN'T EXIST
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ valid: false, error: "DISABLED_IN_DEV" }, { status: 200 });
  }

  try {
    const { email, productSlug } = await req.json();

    if (!email || !productSlug) {
      return NextResponse.json(
        { valid: false, error: "Missing email or productSlug" },
        { status: 400 }
      );
    }

    const priceId = PRODUCT_SLUG_TO_PRICE_ID[productSlug];
    if (!priceId) {
      return NextResponse.json(
        { valid: false, error: "Unknown productSlug" },
        { status: 400 }
      );
    }

    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ valid: false });
    }

    const userId = user[0].id;

    const subscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.paddlePriceId, priceId),
          gt(subscriptions.currentPeriodEnd, new Date())
        )
      )
      .limit(1);

    if (subscription.length > 0) {
      const plan = PRICE_ID_TO_PLAN[subscription[0].paddlePriceId] ?? "unknown";
      return NextResponse.json({ valid: true, plan });
    }

    return NextResponse.json({ valid: false, plan: "" });
  } catch (error) {
    console.error("verify-subscription error:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
  */
}
