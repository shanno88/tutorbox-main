# Auth 限流 + 配额系统实现总结

## 完成的工作

已成功在 Auth 子系统中接入 ioredis + Drizzle 的限流/配额系统。

### 1. 创建的文件

#### 核心实现
- **`src/lib/redis.ts`** - Redis 连接管理
  - 导出 `getRedis()` 函数，返回共享的 ioredis 实例
  - 支持 `REDIS_URL` 环境变量配置

- **`src/lib/limits.ts`** - 限流 + 配额逻辑
  - `checkRateLimit()` - Redis per-minute 限流检查
  - `checkAndConsumeQuota()` - Postgres 月度配额检查和消耗
  - `enforceLimits()` - 统一入口，组合两种检查

#### 数据库
- **`src/db/schema.ts`** - 新增 `apiUsage` 表定义
  - 字段：`id`, `userId`, `apiKeyId`, `year`, `month`, `used`, `createdAt`, `updatedAt`
  - 唯一约束：`(userId, apiKeyId, year, month)`

- **`drizzle/0002_add_api_usage_table.sql`** - 数据库迁移脚本

#### API 路由
- **`src/app/api/auth/validate/route.ts`** - 已集成限流 + 配额
  - 在 API Key 校验通过后调用 `enforceLimits()`
  - 返回 429 (限流) 或 403 (超配额)

#### 测试
- **`scripts/test-limits.ts`** - 本地测试脚本
  - 测试限流：6 次请求，第 6 次被限流
  - 测试配额：11 次请求，第 11 次超配额
  - 验证 `api_usage` 表记录

#### 文档
- **`docs/RATE_LIMIT_AND_QUOTA.md`** - 完整使用文档

### 2. 修改的文件

- **`package.json`** - 添加 `ioredis` 依赖

### 3. 工作流程

```
POST /api/auth/validate
  ↓
验证 API Key (keyHash)
  ↓
检查 Key 状态 (active/inactive/expired)
  ↓
调用 enforceLimits()
  ├─ checkRateLimit() → Redis INCR + EXPIRE
  │  └─ 超过 rateLimitPerMin → 返回 429
  │
  └─ checkAndConsumeQuota() → Drizzle upsert
     └─ 超过 quotaPerMonth → 返回 403
  ↓
返回 200 + 剩余配额
```

## 限流算法

**Per-minute 计数器**（简单实现）
- Redis Key: `rate_limit:{apiKeyHash}`
- 操作：`INCR` + `EXPIRE 60`
- 如果计数 > `rateLimitPerMin`，返回 429

## 配额算法

**月度配额追踪**（Drizzle upsert）
- 表：`api_usage`
- 唯一键：`(userId, apiKeyId, year, month)`
- 每次调用：
  1. 查询当月使用量
  2. 检查 `used + cost > quotaPerMonth`
  3. 如果超过，返回 403
  4. 否则，upsert 更新使用量

## 环境变量

```bash
# Redis 连接（可选，默认 redis://localhost:6379）
REDIS_URL=redis://localhost:6379
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 迁移数据库
```bash
npm run db:push
```

### 3. 启动 Redis
```bash
redis-server
```

### 4. 运行测试
```bash
tsx scripts/test-limits.ts
```

## 测试结果

测试脚本会验证：

✅ **限流测试**
- 创建 Plan: `rateLimitPerMin = 5`
- 发送 6 次请求
- 第 6 次返回 429 + `retryAfterSeconds`

✅ **配额测试**
- 创建 Plan: `quotaPerMonth = 10`
- 发送 11 次请求
- 第 11 次返回 403 + `error: "quota_exceeded"`

✅ **api_usage 表验证**
- 记录正确的 `userId`, `apiKeyId`, `year`, `month`, `used`

✅ **无效 Key 不触发限流**
- 无效/过期 Key 返回 401/403
- 不会写入 `api_usage` 或触发限流

## API 响应示例

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

## 下一步

1. **运行迁移**：`npm run db:push`
2. **启动 Redis**：`redis-server`
3. **运行测试**：`tsx scripts/test-limits.ts`
4. **验证 API**：使用测试脚本生成的 API Key 调用 `/api/auth/validate`

## 文件清单

```
✅ src/lib/redis.ts                          - Redis 连接管理
✅ src/lib/limits.ts                         - 限流 + 配额逻辑
✅ src/db/schema.ts                          - 新增 apiUsage 表
✅ src/app/api/auth/validate/route.ts        - 已集成限流
✅ drizzle/0002_add_api_usage_table.sql      - 数据库迁移
✅ scripts/test-limits.ts                    - 测试脚本
✅ docs/RATE_LIMIT_AND_QUOTA.md              - 完整文档
✅ package.json                              - 添加 ioredis
✅ AUTH_RATE_LIMIT_QUOTA_IMPLEMENTATION.md   - 本文件
```

## 常见问题

**Q: 如何修改限流或配额？**
A: 修改 `plans` 表中的 `rateLimitPerMin` 或 `quotaPerMonth` 字段。

**Q: 如何重置某个 API Key 的月度配额？**
A: 删除 `api_usage` 表中对应的记录。

**Q: Redis 连接失败怎么办？**
A: 确保 Redis 正在运行，检查 `REDIS_URL` 环境变量。

详见 `docs/RATE_LIMIT_AND_QUOTA.md`。
