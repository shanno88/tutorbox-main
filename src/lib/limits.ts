// src/lib/limits.ts
import type { Redis } from "ioredis";
import { getRedis } from "./redis";
import { db } from "@/db";
import { apiUsage } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type PlanLimits = {
  rateLimitPerMin: number;
  quotaPerMonth: number;
};

export type LimitEnforceResult = {
  ok: boolean;
  code?: "RATE_LIMITED" | "QUOTA_EXCEEDED";
  retryAfterSeconds?: number;
  remainingQuota?: number;
};

// Rate limit: per-minute counter in Redis
function buildRateLimitKey(apiKeyHash: string) {
  return `rate_limit:${apiKeyHash}`;
}

export async function checkRateLimit(params: {
  redis?: Redis;
  apiKeyHash: string;
  limitPerMin: number;
}): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const redis = params.redis ?? getRedis();
  const key = buildRateLimitKey(params.apiKeyHash);

  const ttl = await redis.ttl(key);

  const results = (await redis
    .multi()
    .incr(key)
    .expire(key, ttl > 0 ? ttl : 60)
    .exec()) as [[null, number], [null, number]];

  const current = results[0][1];
  const count = typeof current === "number" ? current : Number(current);

  if (count > params.limitPerMin) {
    const remainingTtl = await redis.ttl(key);
    return {
      allowed: false,
      retryAfterSeconds: remainingTtl > 0 ? remainingTtl : 60,
    };
  }

  return { allowed: true };
}

// Monthly quota: Postgres usage + upsert
type CheckAndConsumeQuotaParams = {
  userId: string;
  apiKeyId: string;
  quotaPerMonth: number;
  cost: number;
  now?: Date;
};

export async function checkAndConsumeQuota(
  params: CheckAndConsumeQuotaParams
): Promise<{ allowed: boolean; remainingQuota?: number }> {
  const now = params.now ?? new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  // First, check current usage
  const existing = await db
    .select()
    .from(apiUsage)
    .where(
      and(
        eq(apiUsage.userId, params.userId),
        eq(apiUsage.apiKeyId, params.apiKeyId),
        eq(apiUsage.year, year),
        eq(apiUsage.month, month)
      )
    )
    .limit(1);

  const currentUsed = existing[0]?.used ?? 0;
  const newUsed = currentUsed + params.cost;

  // Check if quota would be exceeded
  if (newUsed > params.quotaPerMonth) {
    return {
      allowed: false,
      remainingQuota: 0,
    };
  }

  // Upsert: insert or update
  if (existing.length === 0) {
    // Insert new record
    await db.insert(apiUsage).values({
      userId: params.userId,
      apiKeyId: params.apiKeyId,
      year,
      month,
      used: params.cost,
    });
  } else {
    // Update existing record
    await db
      .update(apiUsage)
      .set({
        used: newUsed,
        updatedAt: now,
      })
      .where(
        and(
          eq(apiUsage.userId, params.userId),
          eq(apiUsage.apiKeyId, params.apiKeyId),
          eq(apiUsage.year, year),
          eq(apiUsage.month, month)
        )
      );
  }

  const remainingQuota = params.quotaPerMonth - newUsed;

  return {
    allowed: true,
    remainingQuota,
  };
}

// Top-level: enforceLimits
type EnforceLimitsParams = {
  apiKeyId: string;
  apiKeyHash: string;
  userId: string;
  planLimits: PlanLimits;
  cost?: number;
  redis?: Redis;
};

export async function enforceLimits(
  params: EnforceLimitsParams
): Promise<LimitEnforceResult> {
  const cost = params.cost ?? 1;
  const { rateLimitPerMin, quotaPerMonth } = params.planLimits;

  const rl = await checkRateLimit({
    redis: params.redis,
    apiKeyHash: params.apiKeyHash,
    limitPerMin: rateLimitPerMin,
  });

  if (!rl.allowed) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      retryAfterSeconds: rl.retryAfterSeconds,
    };
  }

  const quota = await checkAndConsumeQuota({
    userId: params.userId,
    apiKeyId: params.apiKeyId,
    quotaPerMonth,
    cost,
  });

  if (!quota.allowed) {
    return {
      ok: false,
      code: "QUOTA_EXCEEDED",
      remainingQuota: 0,
    };
  }

  return {
    ok: true,
    remainingQuota: quota.remainingQuota,
  };
}
