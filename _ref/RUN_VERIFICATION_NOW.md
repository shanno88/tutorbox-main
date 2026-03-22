# 🚀 立即运行验证

**快速开始**: 按照以下步骤在 5 分钟内完成验证

---

## 📋 前置条件检查

```bash
# 1. 检查 Redis 是否运行
redis-cli ping
# 预期输出: PONG

# 2. 检查 PostgreSQL 是否运行
psql -U postgres -d tutorbox_auth_dev -c "SELECT 1;"
# 预期输出: 1
```

---

## 🎯 运行验证

### 步骤 1: 启动 Tutorbox 后端

```bash
cd c:\Users\Administrator\Desktop\tutorbox
npm run dev
```

等待看到:
```
> ppai-next-starter@0.1.0 dev
> next dev

  ▲ Next.js 14.2.2
  - Local:        http://localhost:3000
```

### 步骤 2: 在新终端运行验证脚本

```bash
cd c:\Users\Administrator\Desktop\tutorbox
npx tsx scripts/verify-limit-events.ts
```

### 预期输出

```
🧪 Tutorbox 限流/配额链路验证

==================================================

📝 设置测试数据...

✅ 创建 Plan: test-plan-1704067200000
   rateLimitPerMin: 1
   quotaPerMonth: 2

✅ 创建用户: test-user-1704067200000

✅ 创建 API Key
   原始 Key: test-key-verify-1704067200000
   API Key ID: 123

🔴 测试 1: 限流 (429)

发送 3 次请求（限流设置为 1 次/分钟）...

请求 1:
  ✅ 成功 (200)
     remainingQuota: 100

请求 2:
  ❌ 被限流 (429)
     错误: rate_limited
     重试等待: 59s

请求 3:
  ❌ 被限流 (429)
     错误: rate_limited
     重试等待: 59s

结果: 成功 1 次，被限流 2 次

查询 limit_events 表...

✅ 找到 2 条 rate_limited 日志:
   1. ID: 1
      event_type: rate_limited
      http_status: 429
      plan_slug: test-plan-1704067200000
      request_path: /api/auth/validate
      created_at: 2024-01-XX 10:30:46.123+00

   2. ID: 2
      event_type: rate_limited
      http_status: 429
      plan_slug: test-plan-1704067200000
      request_path: /api/auth/validate
      created_at: 2024-01-XX 10:30:46.456+00

🔴 测试 2: 配额 (403)

重置限流参数...
✅ 限流参数已重置为 60/分钟

发送 4 次请求（配额设置为 2 次/月）...

请求 1:
  ✅ 成功 (200)
     remainingQuota: 1

请求 2:
  ✅ 成功 (200)
     remainingQuota: 0

请求 3:
  ❌ 超配额 (403)
     错误: quota_exceeded

请求 4:
  ❌ 超配额 (403)
     错误: quota_exceeded

结果: 成功 2 次，超配额 2 次

查询 limit_events 表...

✅ 找到 2 条 quota_exceeded 日志:
   1. ID: 3
      event_type: quota_exceeded
      http_status: 403
      plan_slug: test-plan-1704067200000
      request_path: /api/auth/validate
      created_at: 2024-01-XX 10:35:20.789+00

   2. ID: 4
      event_type: quota_exceeded
      http_status: 403
      plan_slug: test-plan-1704067200000
      request_path: /api/auth/validate
      created_at: 2024-01-XX 10:35:20.890+00

🧹 清理测试数据...

✅ 测试数据已清理

==================================================

✅ 验证完成

✅ 所有测试通过！
   - 限流 (429) 链路正常
   - 配额 (403) 链路正常
   - 日志记录正常
```

---

## ✅ 验证成功标志

看到以下输出说明验证成功：

```
✅ 所有测试通过！
   - 限流 (429) 链路正常
   - 配额 (403) 链路正常
   - 日志记录正常
```

---

## ❌ 如果验证失败

### 问题 1: 连接错误

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**解决方案**:
- 确保 Tutorbox 后端正在运行 (`npm run dev`)
- 等待 30 秒让后端完全启动

### 问题 2: 数据库错误

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方案**:
- 确保 PostgreSQL 正在运行
- 检查 `DATABASE_URL` 环境变量是否正确

### 问题 3: Redis 错误

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**解决方案**:
- 启动 Redis: `redis-server`
- 检查 `REDIS_URL` 环境变量是否正确

### 问题 4: 日志没有写入

```
❌ 没有找到 rate_limited 日志
```

**排查步骤**:
1. 检查 `limit_events` 表是否存在
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'limit_events';
   ```

2. 检查 Tutorbox 后端日志中是否有错误信息

3. 参考 `LIMIT_EVENTS_VERIFICATION.md` 中的故障排除部分

---

## 📊 验证结果解读

### 429 (Rate Limited) 测试

**预期结果**:
- 请求 1: ✅ 成功 (200)
- 请求 2: ❌ 被限流 (429)
- 请求 3: ❌ 被限流 (429)
- 日志: 2 条 `rate_limited` 事件

**含义**: 限流系统正常工作，在 60 秒内超过 1 次请求后被限流

### 403 (Quota Exceeded) 测试

**预期结果**:
- 请求 1: ✅ 成功 (200)
- 请求 2: ✅ 成功 (200)
- 请求 3: ❌ 超配额 (403)
- 请求 4: ❌ 超配额 (403)
- 日志: 2 条 `quota_exceeded` 事件

**含义**: 配额系统正常工作，在月度配额为 2 的情况下，第 3 次请求被拒绝

---

## 🔍 手动验证日志

如果想手动查看日志，可以运行以下 SQL 查询：

```sql
-- 查看所有限流/配额事件
SELECT 
  id, user_id, api_key_id, plan_slug, event_type, 
  http_status, request_path, created_at
FROM limit_events
ORDER BY created_at DESC
LIMIT 20;

-- 查看最近的 rate_limited 事件
SELECT * FROM limit_events
WHERE event_type = 'rate_limited'
ORDER BY created_at DESC
LIMIT 5;

-- 查看最近的 quota_exceeded 事件
SELECT * FROM limit_events
WHERE event_type = 'quota_exceeded'
ORDER BY created_at DESC
LIMIT 5;

-- 按事件类型统计
SELECT event_type, COUNT(*) as count
FROM limit_events
GROUP BY event_type;
```

---

## 📚 相关文档

- `LIMIT_EVENTS_VERIFICATION.md` - 完整验证指南
- `LIMIT_EVENTS_QUICK_TEST.md` - 快速测试参考
- `LIMIT_EVENTS_VERIFICATION_READY.md` - 就绪确认
- `TASK_28_COMPLETION_SUMMARY.md` - 完成总结

---

## 💡 提示

1. **第一次运行可能较慢**
   - 脚本需要创建测试数据
   - 等待 30-60 秒

2. **多次运行是安全的**
   - 脚本会自动清理测试数据
   - 不会污染生产数据

3. **可以修改测试参数**
   - 编辑 `scripts/verify-limit-events.ts`
   - 修改 `rateLimitPerMin` 和 `quotaPerMonth` 的值

---

## 🎉 完成！

验证完成后，你可以：

1. **查看详细文档**
   - 阅读 `LIMIT_EVENTS_VERIFICATION.md` 了解完整流程

2. **集成到 Grammar Master**
   - 参考 `TUTORBOX_AUTH_INTEGRATION.md`

3. **监控生产环境**
   - 定期查询 `limit_events` 表
   - 监控限流/配额事件

---

**准备好了吗？** 现在就运行验证脚本吧！

```bash
npx tsx scripts/verify-limit-events.ts
```

