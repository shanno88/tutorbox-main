// scripts/test-limits.ts
/**
 * 本地测试脚本：验证限流 + 配额功能
 * 
 * 使用方法：
 * 1. 确保 Redis 运行在 localhost:6379
 * 2. 确保数据库已迁移
 * 3. 创建测试 API Key 和 Plan
 * 4. 运行: tsx scripts/test-limits.ts
 */

import { db } from "@/db";
import { apiKeys, plans, apiUsage, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { getRedis } from "@/lib/redis";
import { enforceLimits, type PlanLimits } from "@/lib/limits";

async function hashKey(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function runTests() {
  console.log("🧪 开始测试限流 + 配额系统...\n");

  try {
    // 1. 创建测试用户
    console.log("📝 创建测试用户...");
    const testUserId = "test-user-" + Date.now();
    
    // 检查用户是否存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
      });
    }
    console.log(`✅ 用户创建/获取成功: ${testUserId}\n`);

    // 2. 创建测试 Plan（限流 5/min，配额 10/month）
    console.log("📝 创建测试 Plan...");
    const planResult = await db
      .insert(plans)
      .values({
        slug: `test-plan-${Date.now()}`,
        name: "Test Plan",
        rateLimitPerMin: 5,
        quotaPerMonth: 10,
      })
      .returning();

    const testPlan = planResult[0];
    console.log(`✅ Plan 创建成功: ${testPlan.slug} (限流: 5/min, 配额: 10/month)\n`);

    // 3. 创建测试 API Key
    console.log("📝 创建测试 API Key...");
    const rawKey = `test-key-${Date.now()}`;
    const hashedKey = await hashKey(rawKey);

    const keyResult = await db
      .insert(apiKeys)
      .values({
        userId: testUserId,
        planId: testPlan.id,
        keyHash: hashedKey,
        status: "active",
      })
      .returning();

    const testApiKey = keyResult[0];
    console.log(`✅ API Key 创建成功: ${rawKey}\n`);

    // 4. 测试 1: 限流测试
    console.log("🔴 测试 1: 限流 (5/min)");
    console.log("发送 6 次请求，第 6 次应该返回 429...\n");

    const planLimits: PlanLimits = {
      rateLimitPerMin: testPlan.rateLimitPerMin,
      quotaPerMonth: testPlan.quotaPerMonth,
    };

    let rateLimitHit = false;
    for (let i = 1; i <= 6; i++) {
      const result = await enforceLimits({
        apiKeyId: testApiKey.id,
        apiKeyHash: hashedKey,
        userId: testUserId,
        planLimits,
        cost: 1,
      });

      if (result.ok) {
        console.log(`  请求 ${i}: ✅ 通过 (剩余配额: ${result.remainingQuota})`);
      } else {
        console.log(
          `  请求 ${i}: ❌ 被限流 (code: ${result.code}, retryAfter: ${result.retryAfterSeconds}s)`
        );
        rateLimitHit = true;
      }
    }

    if (rateLimitHit) {
      console.log("✅ 限流测试通过！\n");
    } else {
      console.log("❌ 限流测试失败：没有触发限流\n");
    }

    // 5. 清理 Redis 中的限流计数器，准备配额测试
    console.log("🔄 清理 Redis 限流计数器...");
    const redis = getRedis();
    const rateLimitKey = `rate_limit:${hashedKey}`;
    await redis.del(rateLimitKey);
    console.log("✅ 清理完成\n");

    // 6. 测试 2: 配额测试
    console.log("🔴 测试 2: 配额 (10/month)");
    console.log("发送 11 次请求，第 11 次应该返回 403...\n");

    let quotaExceededHit = false;
    for (let i = 1; i <= 11; i++) {
      const result = await enforceLimits({
        apiKeyId: testApiKey.id,
        apiKeyHash: hashedKey,
        userId: testUserId,
        planLimits,
        cost: 1,
      });

      if (result.ok) {
        console.log(`  请求 ${i}: ✅ 通过 (剩余配额: ${result.remainingQuota})`);
      } else {
        console.log(
          `  请求 ${i}: ❌ 超配额 (code: ${result.code}, 剩余: ${result.remainingQuota})`
        );
        quotaExceededHit = true;
      }
    }

    if (quotaExceededHit) {
      console.log("✅ 配额测试通过！\n");
    } else {
      console.log("❌ 配额测试失败：没有触发配额限制\n");
    }

    // 7. 验证 api_usage 表
    console.log("🔴 测试 3: 验证 api_usage 表");
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;

    const usageRecord = await db
      .select()
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.userId, testUserId),
          eq(apiUsage.apiKeyId, testApiKey.id),
          eq(apiUsage.year, year),
          eq(apiUsage.month, month)
        )
      )
      .limit(1);

    if (usageRecord.length > 0) {
      console.log(`✅ api_usage 记录存在`);
      console.log(`   userId: ${usageRecord[0].userId}`);
      console.log(`   apiKeyId: ${usageRecord[0].apiKeyId}`);
      console.log(`   year: ${usageRecord[0].year}`);
      console.log(`   month: ${usageRecord[0].month}`);
      console.log(`   used: ${usageRecord[0].used}`);
      console.log(`✅ 配额计数验证通过！\n`);
    } else {
      console.log("❌ api_usage 记录不存在\n");
    }

    // 8. 清理测试数据
    console.log("🧹 清理测试数据...");
    await db.delete(apiUsage).where(eq(apiUsage.userId, testUserId));
    await db.delete(apiKeys).where(eq(apiKeys.id, testApiKey.id));
    await db.delete(plans).where(eq(plans.id, testPlan.id));
    await db.delete(users).where(eq(users.id, testUserId));
    await redis.del(rateLimitKey);
    console.log("✅ 清理完成\n");

    console.log("✅ 所有测试完成！");
    process.exit(0);
  } catch (error) {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  }
}

runTests();
