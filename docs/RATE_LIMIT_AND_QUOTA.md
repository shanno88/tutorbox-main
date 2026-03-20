# Rate Limit & Quota System

本文档说明如何在 Auth 子系统中使用限流 + 配额功能。

## 架构概览

系统由三个部分组成：

1. **Redis 限流** (`src/lib/redis.ts` + `src/lib/limits.ts::checkRateLimit`)
   - 基于 ioredis 的 per-minute 计数器
   - 使用 Redis INCR + EXPIRE 实现简单的限流
   - 返回 429 (Too Many Requests)

2. **Postgres 配额** (`src/lib/limits.ts::checkAndConsumeQuota`)
   - 基于 Drizzle ORM 的月度配额追踪
   - 在 `api_usage` 表中记录每个 API Key 的月度使用量
   - 返回 403 (Forbidden) 当超过配额

3. **统一入口** (`src/lib/limits.ts::enforceLimits`)
   - 组合限流 + 配额检查
   - 在 `POST /api/auth/validate` 中调用

## 数据库表

### `api_usage` 表

```sql
CREATE TABLE api_usage (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, api_key_id, year, month)
);
```

## 环境变量

```bash
# Redis 连接字符串（可选，默认 redis://localhost:6379）
REDIS_URL=redis://localhost:6379
```

## 使用示例

### 1. 在 API 路由中使用

```typescript
import { enforceLimits, type PlanLimits } from "@/lib/limits";

export async function POST(req: Request) {
  // ... 验证 API Key ...

  const planLimits: PlanLimits = {
    rateLimitPerMin: 60,      // 每分钟最多 60 次
    quotaPerMonth: 100000,    // 每月最多 100000 次
  };

  const limitResult = await enforceLimits({
    apiKeyId: record.apiKeyId,
    apiKeyHash: hashed,
    userId: record.userId,
    planLimits,
    cost: 1,  // 每次调用消耗 1 个配额
  });

  if (!limitResult.ok) {
    if (limitResult.code === "RATE_LIMITED") {
      return NextResponse.json(
        {
          ok: false,
          error: "rate_limited",
          retryAfterSeconds: limitResult.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    if (limitResult.code === "QUOTA_EXCEEDED") {
      return NextResponse.json(
        {
          ok: false,
          error: "quota_exceeded",
        },
        { status: 403 }
      );
    }
  }

  // 继续处理请求...
  return NextResponse.json({
    ok: true,
    remainingQuota: limitResult.remainingQuota,
  });
}
```

### 2. 自定义成本

某些操作可能消耗更多配额：

```typescript
const limitResult = await enforceLimits({
  apiKeyId: record.apiKeyId,
  apiKeyHash: hashed,
  userId: record.userId,
  planLimits,
  cost: 10,  // 这个操作消耗 10 个配额
});
```

## 测试

### 本地测试脚本

```bash
# 1. 确保 Redis 运行在 localhost:6379
redis-server

# 2. 运行测试脚本
npm run db:push  # 先迁移数据库
tsx scripts/test-limits.ts
```

测试脚本会：
1. 创建测试用户、Plan 和 API Key
2. 测试限流：发送 6 次请求，第 6 次应该被限流 (429)
3. 测试配额：发送 11 次请求，第 11 次应该超配额 (403)
4. 验证 `api_usage` 表中的记录
5. 清理测试数据

### 手动测试

#### 测试限流 (429)

```bash
# 创建一个 Plan，rateLimitPerMin = 5
# 创建一个 API Key 关联到这个 Plan
# 在 60 秒内发送 6 次请求

for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/validate \
    -H "Content-Type: application/json" \
    -d '{"apiKey":"your-test-key"}'
  echo "Request $i"
done

# 第 6 次应该返回 429
```

#### 测试配额 (403)

```bash
# 创建一个 Plan，quotaPerMonth = 10
# 创建一个 API Key 关联到这个 Plan
# 发送 11 次请求

for i in {1..11}; do
  curl -X POST http://localhost:3000/api/auth/validate \
    -H "Content-Type: application/json" \
    -d '{"apiKey":"your-test-key"}'
  echo "Request $i"
done

# 第 11 次应该返回 403
```

#### 验证无效/过期 Key 不触发限流

```bash
# 使用无效的 API Key
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"invalid-key"}'

# 应该返回 401，不会写入 api_usage 或触发限流
```

## 响应格式

### 成功 (200)

```json
{
  "ok": true,
  "userId": "user-123",
  "planId": 1,
  "planSlug": "pro",
  "planName": "Pro Plan",
  "limits": {
    "rateLimitPerMin": 60,
    "quotaPerMonth": 100000,
    "remainingQuota": 99999
  }
}
```

### 限流 (429)

```json
{
  "ok": false,
  "error": "rate_limited",
  "retryAfterSeconds": 45
}
```

### 超配额 (403)

```json
{
  "ok": false,
  "error": "quota_exceeded"
}
```

### 无效 Key (401)

```json
{
  "ok": false,
  "error": "invalid_api_key"
}
```

## 常见问题

### Q: 如何重置某个 API Key 的月度配额？

```typescript
import { db } from "@/db";
import { apiUsage } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const now = new Date();
const year = now.getUTCFullYear();
const month = now.getUTCMonth() + 1;

await db
  .delete(apiUsage)
  .where(
    and(
      eq(apiUsage.userId, "user-id"),
      eq(apiUsage.apiKeyId, 123),
      eq(apiUsage.year, year),
      eq(apiUsage.month, month)
    )
  );
```

### Q: 如何查看某个 API Key 的当前使用量？

```typescript
import { db } from "@/db";
import { apiUsage } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const now = new Date();
const year = now.getUTCFullYear();
const month = now.getUTCMonth() + 1;

const usage = await db
  .select()
  .from(apiUsage)
  .where(
    and(
      eq(apiUsage.userId, "user-id"),
      eq(apiUsage.apiKeyId, 123),
      eq(apiUsage.year, year),
      eq(apiUsage.month, month)
    )
  );

console.log(`Current usage: ${usage[0]?.used ?? 0}`);
```

### Q: 如何修改限流或配额？

修改 `plans` 表中的 `rateLimitPerMin` 或 `quotaPerMonth` 字段：

```typescript
import { db } from "@/db";
import { plans } from "@/db/schema";
import { eq } from "drizzle-orm";

await db
  .update(plans)
  .set({
    rateLimitPerMin: 120,
    quotaPerMonth: 200000,
  })
  .where(eq(plans.id, 1));
```

## 故障排除

### Redis 连接失败

确保 Redis 正在运行：

```bash
# 检查 Redis 是否运行
redis-cli ping
# 应该返回 PONG

# 如果没有运行，启动 Redis
redis-server
```

### 限流不生效

1. 检查 `REDIS_URL` 环境变量是否正确设置
2. 确保 Redis 中没有旧的限流计数器：`redis-cli DEL "rate_limit:*"`
3. 检查 Plan 的 `rateLimitPerMin` 是否设置正确

### 配额不生效

1. 确保数据库迁移已运行：`npm run db:push`
2. 检查 `api_usage` 表是否存在：`SELECT * FROM api_usage;`
3. 确保 Plan 的 `quotaPerMonth` 是否设置正确
4. 检查 API Key 的 `planId` 是否指向正确的 Plan

## 性能考虑

- **Redis 限流**：O(1) 操作，非常快
- **Postgres 配额**：需要查询和更新，建议在 `(userId, apiKeyId, year, month)` 上建立索引（已在 schema 中定义为 UNIQUE）
- **建议**：对于高流量 API，考虑在应用层缓存配额信息，定期从数据库同步
