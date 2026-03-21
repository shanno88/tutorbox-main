# 限流/配额链路快速测试

## 5 分钟快速验证

### 前置条件

```bash
# 1. 启动 Redis
redis-server

# 2. 启动 PostgreSQL（确保 tutorbox_auth_dev 数据库存在）

# 3. 启动 Tutorbox 后端
cd tutorbox
npm run dev
```

### 创建测试数据

```bash
# 使用 psql 连接到数据库
psql -U postgres -d tutorbox_auth_dev

# 创建测试 Plan
INSERT INTO plans (slug, name, rate_limit_per_min, quota_per_month)
VALUES ('test-plan', 'Test Plan', 1, 2)
RETURNING id;
-- 记下 plan_id，例如：123

# 创建测试用户
INSERT INTO "user" (id, email)
VALUES ('test-user-001', 'test@example.com');

# 创建测试 API Key
-- 先计算 SHA256 哈希值
-- echo -n 'test-key-12345' | openssl dgst -sha256
-- 得到：abc123def456...

INSERT INTO api_keys (user_id, plan_id, key_hash, status)
VALUES ('test-user-001', 123, 'abc123def456...', 'active')
RETURNING id;
-- 记下 api_key_id，例如：456
```

### 测试 429 (Rate Limited)

```bash
# 第 1 次请求（成功）
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "test-key-12345"}' | jq .

# 第 2 次请求（被限流，返回 429）
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "test-key-12345"}' | jq .

# 查看日志
psql -U postgres -d tutorbox_auth_dev -c \
  "SELECT * FROM limit_events WHERE user_id = 'test-user-001' ORDER BY created_at DESC LIMIT 5;"
```

### 测试 403 (Quota Exceeded)

```bash
# 重置限流参数
psql -U postgres -d tutorbox_auth_dev -c \
  "UPDATE plans SET rate_limit_per_min = 60 WHERE id = 123;"

# 清空使用记录
psql -U postgres -d tutorbox_auth_dev -c \
  "DELETE FROM api_usage WHERE user_id = 'test-user-001' AND api_key_id = 456;"

# 连续调用 3 次（配额为 2）
for i in {1..3}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/validate \
    -H "Content-Type: application/json" \
    -d '{"apiKey": "test-key-12345"}' | jq .
  sleep 0.5
done

# 查看日志
psql -U postgres -d tutorbox_auth_dev -c \
  "SELECT * FROM limit_events WHERE user_id = 'test-user-001' ORDER BY created_at DESC LIMIT 5;"
```

## 预期结果

### 429 日志示例
```
 id | user_id      | api_key_id | plan_slug | event_type   | http_status | request_path      | created_at
----+--------------+------------+-----------+--------------+-------------+-------------------+----------------------------
  1 | test-user-001|        456 | test-plan | rate_limited |         429 | /api/auth/validate| 2024-01-XX 10:30:46.456+00
```

### 403 日志示例
```
 id | user_id      | api_key_id | plan_slug | event_type     | http_status | request_path      | created_at
----+--------------+------------+-----------+----------------+-------------+-------------------+----------------------------
  2 | test-user-001|        456 | test-plan | quota_exceeded |         403 | /api/auth/validate| 2024-01-XX 10:35:20.890+00
```

## 完整查询

```sql
-- 查看所有限流/配额事件
SELECT 
  id, user_id, api_key_id, plan_slug, event_type, 
  http_status, request_path, created_at
FROM limit_events
ORDER BY created_at DESC
LIMIT 20;

-- 按事件类型统计
SELECT event_type, COUNT(*) as count
FROM limit_events
GROUP BY event_type;

-- 查看特定用户的事件
SELECT * FROM limit_events
WHERE user_id = 'test-user-001'
ORDER BY created_at DESC;
```

## 常见问题

**Q: 如何计算 API Key 的 SHA256 哈希值？**

```bash
# 方法 1: OpenSSL
echo -n 'test-key-12345' | openssl dgst -sha256

# 方法 2: Node.js
node -e "console.log(require('crypto').createHash('sha256').update('test-key-12345').digest('hex'))"

# 方法 3: Python
python3 -c "import hashlib; print(hashlib.sha256(b'test-key-12345').hexdigest())"
```

**Q: 如何重置测试数据？**

```sql
-- 删除测试数据
DELETE FROM limit_events WHERE user_id = 'test-user-001';
DELETE FROM api_usage WHERE user_id = 'test-user-001';
DELETE FROM api_keys WHERE user_id = 'test-user-001';
DELETE FROM "user" WHERE id = 'test-user-001';
DELETE FROM plans WHERE slug = 'test-plan';
```

**Q: 如何查看实时日志？**

```bash
# 在一个终端中监听日志
psql -U postgres -d tutorbox_auth_dev -c \
  "SELECT * FROM limit_events ORDER BY created_at DESC LIMIT 1;" \
  && watch -n 1 'psql -U postgres -d tutorbox_auth_dev -c "SELECT * FROM limit_events ORDER BY created_at DESC LIMIT 5;"'
```

---

详见 `LIMIT_EVENTS_VERIFICATION.md` 了解完整的验证指南。
