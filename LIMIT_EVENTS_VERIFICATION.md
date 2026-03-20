# Tutorbox 限流/配额链路验证指南

## 概述

本文档指导如何在本地验证 Tutorbox 的限流 (429) 和配额 (403) 链路，以及如何在 `limit_events` 表中查看对应的日志记录。

## 系统架构

```
请求 → POST /api/auth/validate
  ↓
验证 API Key
  ↓
调用 enforceLimits()
  ├─ checkRateLimit() → Redis per-minute 计数
  │  └─ 超过 rateLimitPerMin → 返回 429，调用 logLimitEvent()
  │
  └─ checkAndConsumeQuota() → Postgres 月度配额
     └─ 超过 quotaPerMonth → 返回 403，调用 logLimitEvent()
  ↓
logLimitEvent() 写入 limit_events 表
  ├─ event_type: 'rate_limited' | 'quota_exceeded'
  ├─ http_status: 429 | 403
  └─ 其他字段: userId, apiKeyId, planSlug, requestPath, created_at
```

## 本地环境配置

### 前置条件

1. **Tutorbox 后端正在运行**
   ```bash
   cd tutorbox
   npm run dev
   ```
   默认运行在 `http://localhost:3000`

2. **Redis 正在运行**
   ```bash
   redis-server
   ```
   默认运行在 `localhost:6379`

3. **PostgreSQL 正在运行**
   - 数据库：`tutorbox_auth_dev`
   - 用户：根据 `.env` 配置

4. **环境变量配置**
   在 `tutorbox/.env` 中确保以下配置正确：
   ```bash
   DATABASE_URL=postgresql://user:password@localhost:5432/tutorbox_auth_dev
   REDIS_URL=redis://localhost:6379
   NEXTAUTH_SECRET=your-secret
   ```

### 准备测试数据

1. **创建测试 Plan**
   ```sql
   INSERT INTO plans (slug, name, rate_limit_per_min, quota_per_month)
   VALUES ('test-plan', 'Test Plan', 5, 100)
   RETURNING id;
   ```
   记下返回的 `plan_id`（例如：123）

2. **创建测试用户**
   ```sql
   INSERT INTO "user" (id, email)
   VALUES ('test-user-001', 'test@example.com')
   RETURNING id;
   ```

3. **创建测试 API Key**
   ```sql
   -- 先生成一个 API Key（例如：test-key-12345）
   -- 计算其 SHA256 哈希值
   
   INSERT INTO api_keys (user_id, plan_id, key_hash, status)
   VALUES ('test-user-001', 123, 'sha256_hash_of_test_key_12345', 'active')
   RETURNING id;
   ```
   记下返回的 `api_key_id`（例如：456）

   **计算 SHA256 哈希值的方法**：
   ```bash
   # 使用 Node.js
   node -e "console.log(require('crypto').createHash('sha256').update('test-key-12345').digest('hex'))"
   
   # 或使用 OpenSSL
   echo -n 'test-key-12345' | openssl dgst -sha256
   ```

## 验证 429 (Rate Limited) 链路

### 步骤 1: 临时调整 Plan 的限流参数

```sql
-- 将 rateLimitPerMin 改成 1，这样第 2 次请求就会被限流
UPDATE plans SET rate_limit_per_min = 1 WHERE id = 123;
```

### 步骤 2: 准备测试脚本

创建 `test-rate-limit.sh`：

```bash
#!/bin/bash

API_KEY="test-key-12345"
TUTORBOX_URL="http://localhost:3000"

echo "🧪 开始测试限流 (429)..."
echo "将在 60 秒内连续调用 /api/auth/validate 3 次"
echo ""

for i in {1..3}; do
  echo "请求 $i:"
  curl -X POST "$TUTORBOX_URL/api/auth/validate" \
    -H "Content-Type: application/json" \
    -d "{\"apiKey\": \"$API_KEY\"}" \
    -w "\nHTTP Status: %{http_code}\n" \
    -s | jq .
  
  echo ""
  sleep 1
done
```

### 步骤 3: 运行测试

```bash
chmod +x test-rate-limit.sh
./test-rate-limit.sh
```

### 预期结果

**请求 1**：返回 200
```json
{
  "ok": true,
  "userId": "test-user-001",
  "planSlug": "test-plan",
  "limits": {
    "rateLimitPerMin": 1,
    "quotaPerMonth": 100,
    "remainingQuota": 100
  }
}
```

**请求 2 和 3**：返回 429
```json
{
  "ok": false,
  "error": "rate_limited",
  "retryAfterSeconds": 59
}
```

### 步骤 4: 验证日志

在 PostgreSQL 中查询 `limit_events` 表：

```sql
SELECT 
  id,
  user_id,
  api_key_id,
  plan_slug,
  event_type,
  http_status,
  request_path,
  created_at
FROM limit_events
WHERE user_id = 'test-user-001'
  AND event_type = 'rate_limited'
ORDER BY created_at DESC
LIMIT 10;
```

**预期输出**：
```
 id | user_id      | api_key_id | plan_slug  | event_type    | http_status | request_path      | created_at
----+--------------+------------+------------+---------------+-------------+-------------------+----------------------------
  1 | test-user-001|        456 | test-plan  | rate_limited  |         429 | /api/auth/validate| 2024-01-XX 10:30:45.123+00
  2 | test-user-001|        456 | test-plan  | rate_limited  |         429 | /api/auth/validate| 2024-01-XX 10:30:46.456+00
```

## 验证 403 (Quota Exceeded) 链路

### 步骤 1: 重置限流参数并调整配额

```sql
-- 恢复限流参数
UPDATE plans SET rate_limit_per_min = 60 WHERE id = 123;

-- 将 quotaPerMonth 改成 2，这样第 3 次请求就会超配额
UPDATE plans SET quota_per_month = 2 WHERE id = 123;

-- 清空该用户本月的使用记录（可选）
DELETE FROM api_usage 
WHERE user_id = 'test-user-001' 
  AND api_key_id = 456
  AND year = EXTRACT(YEAR FROM NOW())
  AND month = EXTRACT(MONTH FROM NOW());
```

### 步骤 2: 准备测试脚本

创建 `test-quota-limit.sh`：

```bash
#!/bin/bash

API_KEY="test-key-12345"
TUTORBOX_URL="http://localhost:3000"

echo "🧪 开始测试配额 (403)..."
echo "将连续调用 /api/auth/validate 4 次（配额为 2）"
echo ""

for i in {1..4}; do
  echo "请求 $i:"
  curl -X POST "$TUTORBOX_URL/api/auth/validate" \
    -H "Content-Type: application/json" \
    -d "{\"apiKey\": \"$API_KEY\"}" \
    -w "\nHTTP Status: %{http_code}\n" \
    -s | jq .
  
  echo ""
  sleep 0.5
done
```

### 步骤 3: 运行测试

```bash
chmod +x test-quota-limit.sh
./test-quota-limit.sh
```

### 预期结果

**请求 1 和 2**：返回 200
```json
{
  "ok": true,
  "userId": "test-user-001",
  "planSlug": "test-plan",
  "limits": {
    "rateLimitPerMin": 60,
    "quotaPerMonth": 2,
    "remainingQuota": 1  // 第 2 次请求后
  }
}
```

**请求 3 和 4**：返回 403
```json
{
  "ok": false,
  "error": "quota_exceeded"
}
```

### 步骤 4: 验证日志

在 PostgreSQL 中查询 `limit_events` 表：

```sql
SELECT 
  id,
  user_id,
  api_key_id,
  plan_slug,
  event_type,
  http_status,
  request_path,
  created_at
FROM limit_events
WHERE user_id = 'test-user-001'
  AND event_type = 'quota_exceeded'
ORDER BY created_at DESC
LIMIT 10;
```

**预期输出**：
```
 id | user_id      | api_key_id | plan_slug  | event_type      | http_status | request_path      | created_at
----+--------------+------------+------------+-----------------+-------------+-------------------+----------------------------
  3 | test-user-001|        456 | test-plan  | quota_exceeded  |         403 | /api/auth/validate| 2024-01-XX 10:35:20.789+00
  4 | test-user-001|        456 | test-plan  | quota_exceeded  |         403 | /api/auth/validate| 2024-01-XX 10:35:20.890+00
```

## 查看完整的限流/配额日志

### 查询所有限流事件

```sql
SELECT 
  id,
  user_id,
  api_key_id,
  plan_slug,
  event_type,
  http_status,
  request_path,
  created_at
FROM limit_events
ORDER BY created_at DESC
LIMIT 50;
```

### 按用户统计

```sql
SELECT 
  user_id,
  event_type,
  COUNT(*) as count,
  MAX(created_at) as last_event
FROM limit_events
GROUP BY user_id, event_type
ORDER BY last_event DESC;
```

### 按 Plan 统计

```sql
SELECT 
  plan_slug,
  event_type,
  COUNT(*) as count,
  MAX(created_at) as last_event
FROM limit_events
GROUP BY plan_slug, event_type
ORDER BY last_event DESC;
```

### 查看最近 1 小时的事件

```sql
SELECT 
  id,
  user_id,
  api_key_id,
  plan_slug,
  event_type,
  http_status,
  request_path,
  created_at
FROM limit_events
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## 使用 curl 进行手动测试

### 测试 429 (Rate Limited)

```bash
# 第 1 次请求（应该成功）
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "test-key-12345"}' \
  -w "\nStatus: %{http_code}\n"

# 第 2 次请求（应该返回 429）
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "test-key-12345"}' \
  -w "\nStatus: %{http_code}\n"
```

### 测试 403 (Quota Exceeded)

```bash
# 连续调用多次，直到超过配额
for i in {1..5}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/validate \
    -H "Content-Type: application/json" \
    -d '{"apiKey": "test-key-12345"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 0.5
done
```

## 故障排除

### 问题 1: 日志没有写入 limit_events 表

**可能原因**：
1. `logLimitEvent` 函数没有被调用
2. 数据库连接失败
3. `limit_events` 表不存在

**排查步骤**：
1. 检查 Tutorbox 后端日志是否有错误信息
2. 确认 `limit_events` 表存在：
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'limit_events';
   ```
3. 检查 `enforceLimits` 是否正确调用了 `logLimitEvent`

### 问题 2: 返回 429 但没有看到日志

**可能原因**：
1. `planSlug` 或 `requestPath` 参数没有正确传递
2. 日志写入失败但没有影响主流程

**排查步骤**：
1. 在 `logLimitEvent` 中添加日志输出
2. 检查 `enforceLimits` 的调用参数是否完整

### 问题 3: 返回 403 但没有看到日志

**可能原因**：
1. 配额检查逻辑有问题
2. `apiUsage` 表的数据不正确

**排查步骤**：
1. 检查 `apiUsage` 表中该用户的使用记录：
   ```sql
   SELECT * FROM api_usage 
   WHERE user_id = 'test-user-001' 
     AND api_key_id = 456;
   ```
2. 确认 `quotaPerMonth` 的值是否正确

## 完整的验证清单

- [ ] Redis 正在运行
- [ ] PostgreSQL 正在运行
- [ ] Tutorbox 后端正在运行
- [ ] 创建了测试 Plan（rateLimitPerMin=1, quotaPerMonth=2）
- [ ] 创建了测试用户
- [ ] 创建了测试 API Key
- [ ] 运行了限流测试，看到 429 响应
- [ ] 在 limit_events 表中看到 rate_limited 日志
- [ ] 运行了配额测试，看到 403 响应
- [ ] 在 limit_events 表中看到 quota_exceeded 日志
- [ ] 验证了日志中的 userId、apiKeyId、planSlug 与实际请求匹配

## 相关文件

- 限流/配额实现：`src/lib/limits.ts`
- 日志记录实现：`src/db/limit-logging.ts`
- 验证路由：`src/app/api/auth/validate/route.ts`
- 数据库 Schema：`src/db/schema.ts`

## 下一步

1. 在本地按照本文档验证 429 和 403 链路
2. 确认 limit_events 表中有对应的日志记录
3. 如果有问题，参考故障排除部分
4. 验证完成后，可以继续集成到 Grammar Master 或其他应用

---

**文档版本**: 1.0
**最后更新**: 2024-01-XX
**状态**: 完成
