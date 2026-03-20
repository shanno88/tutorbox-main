import { NextResponse } from "next/server";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, plans } from "@/db/schema";

// 新增：从你刚建的限流文件里引入
import { enforceLimits, type PlanLimits } from "@/lib/limits";

function hashKey(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function POST(req: Request) {
  let body: { apiKey?: string } | null = null;

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  if (!body?.apiKey) {
    return NextResponse.json(
      { ok: false, error: "missing_api_key" },
      { status: 400 },
    );
  }

  const hashed = hashKey(body.apiKey);

  const rows = await db
    .select({
      apiKeyId: apiKeys.id,
      status: apiKeys.status,
      expiresAt: apiKeys.expiresAt,
      userId: apiKeys.userId,
      planId: apiKeys.planId,
      planSlug: plans.slug,
      planName: plans.name,
      rateLimitPerMin: plans.rateLimitPerMin,
      quotaPerMonth: plans.quotaPerMonth,
    })
    .from(apiKeys)
    .innerJoin(plans, eq(apiKeys.planId, plans.id))
    .where(and(eq(apiKeys.keyHash, hashed)))
    .limit(1);

  const record = rows[0];
  if (!record) {
    return NextResponse.json(
      { ok: false, error: "invalid_api_key" },
      { status: 401 },
    );
  }

  if (record.status !== "active") {
    return NextResponse.json(
      { ok: false, error: "key_inactive" },
      { status: 403 },
    );
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return NextResponse.json(
      { ok: false, error: "key_expired" },
      { status: 403 },
    );
  }

  // 这里开始：接入限流 + 配额
  const planLimits: PlanLimits = {
    rateLimitPerMin: record.rateLimitPerMin,
    quotaPerMonth: record.quotaPerMonth,
  };

  const limitResult = await enforceLimits({
    apiKeyId: record.apiKeyId,
    apiKeyHash: hashed,
    userId: record.userId,
    planLimits,
    planSlug: record.planSlug,
    requestPath: "/api/auth/validate",
    // 先固定每次调用算 1
    cost: 1,
  });

  if (!limitResult.ok) {
    if (limitResult.code === "RATE_LIMITED") {
      return NextResponse.json(
        {
          ok: false,
          error: "rate_limited",
          retryAfterSeconds: limitResult.retryAfterSeconds,
        },
        { status: 429 },
      );
    }

    if (limitResult.code === "QUOTA_EXCEEDED") {
      return NextResponse.json(
        {
          ok: false,
          error: "quota_exceeded",
        },
        { status: 403 },
      );
    }
  }

  // 正常返回，附带剩余额度（如果你想用）
  return NextResponse.json({
    ok: true,
    userId: record.userId,
    planId: record.planId,
    planSlug: record.planSlug,
    planName: record.planName,
    limits: {
      rateLimitPerMin: record.rateLimitPerMin,
      quotaPerMonth: record.quotaPerMonth,
      remainingQuota: limitResult.remainingQuota,
    },
  });
}
