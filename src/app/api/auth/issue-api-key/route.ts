import { NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db"; // 按你项目实际路径
import { plans, apiKeys } from "@/db/schema";

function hashKey(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function POST(req: Request) {
  let body: { userId?: string; planSlug?: string; ttlDays?: number } | null = null;

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  if (!body?.userId || !body?.planSlug) {
    return NextResponse.json(
      { ok: false, error: "missing_params" },
      { status: 400 },
    );
  }

  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.slug, body.planSlug))
    .limit(1);

  if (!plan) {
    return NextResponse.json(
      { ok: false, error: "plan_not_found" },
      { status: 404 },
    );
  }

  const rawKey = crypto.randomBytes(24).toString("hex");
  const hashed = hashKey(rawKey);

  const expiresAt =
    typeof body.ttlDays === "number"
      ? new Date(Date.now() + body.ttlDays * 24 * 60 * 60 * 1000)
      : null;

  await db.insert(apiKeys).values({
    userId: body.userId,
    planId: plan.id,
    keyHash: hashed,
    expiresAt,
  });

  return NextResponse.json({
    ok: true,
    apiKey: rawKey, // 只在这里返回一次明文
    plan: {
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
    },
  });
}
