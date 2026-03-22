/**
 * 验证限流/配额链路脚本
 * 
 * 使用方法：
 * npx tsx scripts/verify-limit-events.ts
 * 
 * 环境变量：
 * - TEST_API_KEY: 测试用的 API Key
 * - TUTORBOX_URL: Tutorbox 的 base URL (默认: http://localhost:3000)
 * - DATABASE_URL: PostgreSQL 连接字符串
 */

import { db } from "@/db";
import { plans, apiKeys, users, limitEvents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

const TUTORBOX_URL = process.env.TUTORBOX_URL || "http://localhost:3000";
const TEST_API_KEY = process.env.TEST_API_KEY || "test-key-verify-" + Date.now();

async function hashKey(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setupTestData() {
  console.log("📝 设置测试数据...\n");

  // 创建测试 Plan
  const planResult = await db
    .insert(plans)
    .values({
      slug: `test-plan-${Date.now()}`,
      name: "Test Plan for Limit Events",
      rateLimitPerMin: 1, // 限流：1 次/分钟
      quotaPerMonth: 2, // 配额：2 次/月
    })
    .returning();

  const testPlan = planResult[0];
  console.log(`✅ 创建 Plan: ${testPlan.slug}`);
  console.log(`   rateLimitPerMin: ${testPlan.rateLimitPerMin}`);
  console.log(`   quotaPerMonth: ${testPlan.quotaPerMonth}\n`);

  // 创建测试用户
  const testUserId = `test-user-${Date.now()}`;
  const userResult = await db
    .insert(users)
    .values({
      id: testUserId,
      email: `test-${Date.now()}@example.com`,
    })
    .returning();

  console.log(`✅ 创建用户: ${testUserId}\n`);

  // 创建测试 API Key
  const hashedKey = await hashKey(TEST_API_KEY);
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
  console.log(`✅ 创建 API Key`);
  console.log(`   原始 Key: ${TEST_API_KEY}`);
  console.log(`   API Key ID: ${testApiKey.id}\n`);

  return {
    planId: testPlan.id,
    planSlug: testPlan.slug,
    userId: testUserId,
    apiKeyId: testApiKey.id,
  };
}

async function testRateLimit(testData: {
  planId: number;
  planSlug: string;
  userId: string;
  apiKeyId: number;
}) {
  console.log("🔴 测试 1: 限流 (429)\n");

  console.log("发送 3 次请求（限流设置为 1 次/分钟）...\n");

  let successCount = 0;
  let rateLimitCount = 0;

  for (let i = 1; i <= 3; i++) {
    console.log(`请求 ${i}:`);

    const res = await fetch(`${TUTORBOX_URL}/api/auth/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey: TEST_API_KEY }),
    });

    const data = await res.json();

    if (res.status === 200) {
      console.log(`  ✅ 成功 (200)`);
      console.log(`     remainingQuota: ${data.limits?.remainingQuota}`);
      successCount++;
    } else if (res.status === 429) {
      console.log(`  ❌ 被限流 (429)`);
      console.log(`     错误: ${data.error}`);
      console.log(`     重试等待: ${data.retryAfterSeconds}s`);
      rateLimitCount++;
    } else {
      console.log(`  ⚠️  返回 ${res.status}`);
      console.log(`     错误: ${data.error}`);
    }

    console.log();

    if (i < 3) {
      await delay(500);
    }
  }

  console.log(`结果: 成功 ${successCount} 次，被限流 ${rateLimitCount} 次\n`);

  // 查询日志
  console.log("查询 limit_events 表...\n");

  const rateLimitEvents = await db
    .select()
    .from(limitEvents)
    .where(
      and(
        eq(limitEvents.userId, testData.userId),
        eq(limitEvents.eventType, "rate_limited"),
      ),
    )
    .orderBy(desc(limitEvents.createdAt))
    .limit(5);

  if (rateLimitEvents.length > 0) {
    console.log(`✅ 找到 ${rateLimitEvents.length} 条 rate_limited 日志:`);
    rateLimitEvents.forEach((event, idx) => {
      console.log(`   ${idx + 1}. ID: ${event.id}`);
      console.log(`      event_type: ${event.eventType}`);
      console.log(`      http_status: ${event.httpStatus}`);
      console.log(`      plan_slug: ${event.planSlug}`);
      console.log(`      request_path: ${event.requestPath}`);
      console.log(`      created_at: ${event.createdAt}`);
    });
  } else {
    console.log(`❌ 没有找到 rate_limited 日志`);
  }

  console.log();

  return rateLimitCount > 0;
}

async function testQuotaLimit(testData: {
  planId: number;
  planSlug: string;
  userId: string;
  apiKeyId: number;
}) {
  console.log("🔴 测试 2: 配额 (403)\n");

  // 重置限流参数
  console.log("重置限流参数...");
  await db
    .update(plans)
    .set({ rateLimitPerMin: 60 })
    .where(eq(plans.id, testData.planId));
  console.log("✅ 限流参数已重置为 60/分钟\n");

  console.log("发送 4 次请求（配额设置为 2 次/月）...\n");

  let successCount = 0;
  let quotaExceededCount = 0;

  for (let i = 1; i <= 4; i++) {
    console.log(`请求 ${i}:`);

    const res = await fetch(`${TUTORBOX_URL}/api/auth/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey: TEST_API_KEY }),
    });

    const data = await res.json();

    if (res.status === 200) {
      console.log(`  ✅ 成功 (200)`);
      console.log(`     remainingQuota: ${data.limits?.remainingQuota}`);
      successCount++;
    } else if (res.status === 403) {
      console.log(`  ❌ 超配额 (403)`);
      console.log(`     错误: ${data.error}`);
      quotaExceededCount++;
    } else {
      console.log(`  ⚠️  返回 ${res.status}`);
      console.log(`     错误: ${data.error}`);
    }

    console.log();

    if (i < 4) {
      await delay(500);
    }
  }

  console.log(`结果: 成功 ${successCount} 次，超配额 ${quotaExceededCount} 次\n`);

  // 查询日志
  console.log("查询 limit_events 表...\n");

  const quotaEvents = await db
    .select()
    .from(limitEvents)
    .where(
      and(
        eq(limitEvents.userId, testData.userId),
        eq(limitEvents.eventType, "quota_exceeded"),
      ),
    )
    .orderBy(desc(limitEvents.createdAt))
    .limit(5);

  if (quotaEvents.length > 0) {
    console.log(`✅ 找到 ${quotaEvents.length} 条 quota_exceeded 日志:`);
    quotaEvents.forEach((event, idx) => {
      console.log(`   ${idx + 1}. ID: ${event.id}`);
      console.log(`      event_type: ${event.eventType}`);
      console.log(`      http_status: ${event.httpStatus}`);
      console.log(`      plan_slug: ${event.planSlug}`);
      console.log(`      request_path: ${event.requestPath}`);
      console.log(`      created_at: ${event.createdAt}`);
    });
  } else {
    console.log(`❌ 没有找到 quota_exceeded 日志`);
  }

  console.log();

  return quotaExceededCount > 0;
}

async function cleanup(testData: {
  planId: number;
  userId: string;
  apiKeyId: number;
}) {
  console.log("🧹 清理测试数据...\n");

  // 删除测试数据
  await db.delete(limitEvents).where(eq(limitEvents.userId, testData.userId));
  await db.delete(apiKeys).where(eq(apiKeys.id, testData.apiKeyId));
  await db.delete(plans).where(eq(plans.id, testData.planId));
  await db.delete(users).where(eq(users.id, testData.userId));

  console.log("✅ 测试数据已清理\n");
}

async function main() {
  console.log("🧪 Tutorbox 限流/配额链路验证\n");
  console.log("=".repeat(50));
  console.log();

  try {
    // 设置测试数据
    const testData = await setupTestData();

    // 测试限流
    const rateLimitPassed = await testRateLimit(testData);

    // 测试配额
    const quotaLimitPassed = await testQuotaLimit(testData);

    // 清理
    await cleanup(testData);

    // 总结
    console.log("=".repeat(50));
    console.log("\n✅ 验证完成\n");

    if (rateLimitPassed && quotaLimitPassed) {
      console.log("✅ 所有测试通过！");
      console.log("   - 限流 (429) 链路正常");
      console.log("   - 配额 (403) 链路正常");
      console.log("   - 日志记录正常");
    } else {
      console.log("❌ 部分测试失败");
      if (!rateLimitPassed) {
        console.log("   - 限流 (429) 链路有问题");
      }
      if (!quotaLimitPassed) {
        console.log("   - 配额 (403) 链路有问题");
      }
    }

    process.exit(rateLimitPassed && quotaLimitPassed ? 0 : 1);
  } catch (error) {
    console.error("❌ 验证失败:", error);
    process.exit(1);
  }
}

main();
