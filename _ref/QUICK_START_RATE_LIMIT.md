# 快速开始：限流 + 配额系统

## 5 分钟快速上手

### 1️⃣ 安装依赖
```bash
npm install
```

### 2️⃣ 迁移数据库
```bash
npm run db:push
```

### 3️⃣ 启动 Redis
```bash
redis-server
```

### 4️⃣ 运行测试
```bash
tsx scripts/test-limits.ts
```

## 测试会验证什么？

✅ **限流** - 60 秒内超过 `rateLimitPerMin` 返回 429  
✅ **配额** - 月度超过 `quotaPerMonth` 返回 403  
✅ **数据库** - `api_usage` 表正确记录使用量  
✅ **安全** - 无效/过期 Key 不触发限流  

## 核心文件

| 文件 | 作用 |
|------|------|
| `src/lib/redis.ts` | Redis 连接管理 |
| `src/lib/limits.ts` | 限流 + 配额逻辑 |
| `src/db/schema.ts` | `apiUsage` 表定义 |
| `src/app/api/auth/validate/route.ts` | 已集成限流的 API 路由 |

## 工作原理

```
请求 → 验证 API Key → 检查限流 → 检查配额 → 返回结果
                    (Redis)      (Postgres)
```

## 响应示例

### ✅ 成功 (200)
```json
{
  "ok": true,
  "remainingQuota": 99999
}
```

### ⚠️ 限流 (429)
```json
{
  "ok": false,
  "error": "rate_limited",
  "retryAfterSeconds": 45
}
```

### ❌ 超配额 (403)
```json
{
  "ok": false,
  "error": "quota_exceeded"
}
```

## 环境变量

```bash
# Redis 连接（可选，默认 redis://localhost:6379）
REDIS_URL=redis://localhost:6379
```

## 常见命令

```bash
# 查看 Redis 中的限流计数器
redis-cli KEYS "rate_limit:*"

# 查看 api_usage 表
psql -c "SELECT * FROM api_usage;"

# 重置某个 API Key 的月度配额
psql -c "DELETE FROM api_usage WHERE api_key_id = 123 AND year = 2024 AND month = 3;"
```

## 故障排除

| 问题 | 解决方案 |
|------|--------|
| Redis 连接失败 | 运行 `redis-server` |
| 数据库错误 | 运行 `npm run db:push` |
| 限流不生效 | 检查 `REDIS_URL` 环境变量 |
| 配额不生效 | 检查 Plan 的 `quotaPerMonth` 设置 |

## 详细文档

- 完整使用指南：`docs/RATE_LIMIT_AND_QUOTA.md`
- 实现总结：`AUTH_RATE_LIMIT_QUOTA_IMPLEMENTATION.md`

---

**需要帮助？** 查看 `docs/RATE_LIMIT_AND_QUOTA.md` 中的常见问题部分。
