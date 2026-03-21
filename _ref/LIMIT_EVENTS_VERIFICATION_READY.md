# Tutorbox 限流/配额链路验证 - 就绪确认

**状态**: ✅ 完全就绪  
**最后更新**: 2024-01-XX  
**验证日期**: 2024-01-XX

---

## 📋 验证清单

### 代码实现检查

- ✅ **限流实现** (`src/lib/limits.ts`)
  - `checkRateLimit()` - Redis per-minute 计数
  - `checkAndConsumeQuota()` - Postgres 月度配额
  - `enforceLimits()` - 统一入口，调用 `logLimitEvent()`

- ✅ **日志记录实现** (`src/db/limit-logging.ts`)
  - `logLimitEvent()` - 写入 `limit_events` 表
  - 支持 `rate_limited` (429) 和 `quota_exceeded` (403) 两种事件类型
  - 非阻塞式日志（错误不影响主流程）

- ✅ **验证路由** (`src/app/api/auth/validate/route.ts`)
  - 正确调用 `enforceLimits()` 并传递所有必需参数：
    - `apiKeyId` ✅
    - `apiKeyHash` ✅
    - `userId` ✅
    - `planLimits` ✅
    - `planSlug` ✅
    - `requestPath: "/api/auth/validate"` ✅
    - `cost: 1` ✅

- ✅ **数据库 Schema** (`src/db/schema.ts`)
  - `limitEvents` 表已定义，包含所有必需字段：
    - `id` (bigserial)
    - `user_id` (FK → users.id)
    - `api_key_id` (FK → api_keys.id)
    - `plan_slug` (text)
    - `event_type` ('rate_limited' | 'quota_exceeded')
    - `http_status` (429 | 403)
    - `request_path` (text)
    - `created_at` (timestamp with timezone)
  - 已创建性能索引：
    - `idx_limit_events_created_at`
    - `idx_limit_events_plan_created`
    - `idx_limit_events_user_created`

### 文档完整性检查

- ✅ **完整验证指南** (`LIMIT_EVENTS_VERIFICATION.md`)
  - 系统架构说明
  - 本地环境配置步骤
  - 测试数据准备指南
  - 429 (Rate Limited) 验证步骤
  - 403 (Quota Exceeded) 验证步骤
  - 日志查询示例
  - 故障排除指南
  - 完整的验证清单

- ✅ **快速测试指南** (`LIMIT_EVENTS_QUICK_TEST.md`)
  - 5 分钟快速验证流程
  - curl 命令示例
  - SQL 查询示例
  - 常见问题解答

### 自动化验证脚本

- ✅ **验证脚本** (`scripts/verify-limit-events.ts`)
  - 自动创建测试数据（Plan、User、API Key）
  - 自动测试 429 链路
  - 自动测试 403 链路
  - 自动查询 `limit_events` 表验证日志
  - 自动清理测试数据
  - 完整的错误处理和日志输出

---

## 🚀 快速开始

### 方式 1: 使用自动化脚本（推荐）

```bash
# 1. 启动依赖服务
redis-server
# PostgreSQL 应该已在运行

# 2. 启动 Tutorbox 后端
npm run dev

# 3. 在另一个终端运行验证脚本
npx tsx scripts/verify-limit-events.ts
```

**预期输出**:
```
🧪 Tutorbox 限流/配额链路验证

📝 设置测试数据...
✅ 创建 Plan: test-plan-1234567890
   rateLimitPerMin: 1
   quotaPerMonth: 2

✅ 创建用户: test-user-1234567890

✅ 创建 API Key
   原始 Key: test-key-verify-1234567890
   API Key ID: 123

🔴 测试 1: 限流 (429)
...
✅ 找到 2 条 rate_limited 日志

🔴 测试 2: 配额 (403)
...
✅ 找到 2 条 quota_exceeded 日志

✅ 验证完成

✅ 所有测试通过！
   - 限流 (429) 链路正常
   - 配额 (403) 链路正常
   - 日志记录正常
```

### 方式 2: 手动测试（按照文档）

参考 `LIMIT_EVENTS_VERIFICATION.md` 中的详细步骤。

---

## 📊 验证流程图

```
┌─────────────────────────────────────────────────────────────┐
│ 请求 → POST /api/auth/validate (with apiKey)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ 验证 API Key 有效性         │
        │ (status, expiry)           │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ 调用 enforceLimits()        │
        │ (传递所有必需参数)          │
        └────────────┬───────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────────┐          ┌──────────────┐
   │ 检查限流    │          │ 检查配额     │
   │ (Redis)     │          │ (Postgres)   │
   └──┬──────┬───┘          └──┬──────┬────┘
      │      │                 │      │
   ✅ │      │ ❌           ✅ │      │ ❌
      │      │                 │      │
      │      ▼                 │      ▼
      │   ┌──────────────┐     │   ┌──────────────┐
      │   │ 返回 429     │     │   │ 返回 403     │
      │   │ 调用         │     │   │ 调用         │
      │   │ logLimitEvent│     │   │ logLimitEvent│
      │   │ (rate_limited)     │   │ (quota_exceeded)
      │   └──────┬───────┘     │   └──────┬───────┘
      │          │             │          │
      │          ▼             │          ▼
      │   ┌──────────────┐     │   ┌──────────────┐
      │   │ 写入         │     │   │ 写入         │
      │   │ limit_events │     │   │ limit_events │
      │   │ (429)        │     │   │ (403)        │
      │   └──────────────┘     │   └──────────────┘
      │                        │
      └────────────┬───────────┘
                   │
                   ▼
        ┌────────────────────────────┐
        │ 返回 200 + 用户信息         │
        │ (userId, planSlug, limits) │
        └────────────────────────────┘
```

---

## 🔍 验证内容

### 429 (Rate Limited) 链路

**触发条件**: 在 60 秒内超过 `rateLimitPerMin` 次请求

**验证步骤**:
1. 创建 Plan，设置 `rateLimitPerMin = 1`
2. 在 60 秒内发送 3 次请求
3. 预期：第 1 次返回 200，第 2、3 次返回 429
4. 在 `limit_events` 表中查看 `event_type = 'rate_limited'` 的日志

**预期日志**:
```sql
SELECT * FROM limit_events 
WHERE event_type = 'rate_limited' 
ORDER BY created_at DESC LIMIT 2;

-- 结果示例：
-- id | user_id | api_key_id | plan_slug | event_type   | http_status | request_path      | created_at
-- 1  | user-1  | 123        | test-plan | rate_limited | 429         | /api/auth/validate | 2024-01-XX 10:30:46+00
-- 2  | user-1  | 123        | test-plan | rate_limited | 429         | /api/auth/validate | 2024-01-XX 10:30:47+00
```

### 403 (Quota Exceeded) 链路

**触发条件**: 在当月内超过 `quotaPerMonth` 次请求

**验证步骤**:
1. 创建 Plan，设置 `quotaPerMonth = 2`
2. 发送 4 次请求
3. 预期：第 1、2 次返回 200，第 3、4 次返回 403
4. 在 `limit_events` 表中查看 `event_type = 'quota_exceeded'` 的日志

**预期日志**:
```sql
SELECT * FROM limit_events 
WHERE event_type = 'quota_exceeded' 
ORDER BY created_at DESC LIMIT 2;

-- 结果示例：
-- id | user_id | api_key_id | plan_slug | event_type     | http_status | request_path      | created_at
-- 3  | user-1  | 123        | test-plan | quota_exceeded | 403         | /api/auth/validate | 2024-01-XX 10:35:20+00
-- 4  | user-1  | 123        | test-plan | quota_exceeded | 403         | /api/auth/validate | 2024-01-XX 10:35:21+00
```

---

## 📁 相关文件

### 核心实现
- `src/lib/limits.ts` - 限流/配额逻辑
- `src/db/limit-logging.ts` - 日志记录
- `src/app/api/auth/validate/route.ts` - 验证路由
- `src/db/schema.ts` - 数据库 Schema

### 文档
- `LIMIT_EVENTS_VERIFICATION.md` - 完整验证指南
- `LIMIT_EVENTS_QUICK_TEST.md` - 快速测试指南
- `AUTH_RATE_LIMIT_QUOTA_IMPLEMENTATION.md` - 系统实现文档
- `docs/RATE_LIMIT_AND_QUOTA.md` - 完整文档

### 脚本
- `scripts/verify-limit-events.ts` - 自动化验证脚本
- `scripts/test-limits.ts` - 基础限流测试脚本

---

## ✅ 验证成功标准

验证被认为成功，当满足以下所有条件：

1. **429 链路**
   - [ ] 第 1 次请求返回 200
   - [ ] 第 2 次请求返回 429
   - [ ] `limit_events` 表中有 `event_type = 'rate_limited'` 的日志
   - [ ] 日志中的 `http_status = 429`
   - [ ] 日志中的 `plan_slug`、`user_id`、`api_key_id` 与实际请求匹配

2. **403 链路**
   - [ ] 第 1、2 次请求返回 200
   - [ ] 第 3、4 次请求返回 403
   - [ ] `limit_events` 表中有 `event_type = 'quota_exceeded'` 的日志
   - [ ] 日志中的 `http_status = 403`
   - [ ] 日志中的 `plan_slug`、`user_id`、`api_key_id` 与实际请求匹配

3. **日志完整性**
   - [ ] 所有日志都有 `created_at` 时间戳
   - [ ] 所有日志都有 `request_path = "/api/auth/validate"`
   - [ ] 日志按 `created_at` 正确排序

---

## 🔧 故障排除

### 问题 1: 日志没有写入

**检查清单**:
1. Redis 是否正在运行？
   ```bash
   redis-cli ping
   # 应该返回 PONG
   ```

2. PostgreSQL 是否正在运行？
   ```bash
   psql -U postgres -d tutorbox_auth_dev -c "SELECT 1;"
   # 应该返回 1
   ```

3. `limit_events` 表是否存在？
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'limit_events';
   ```

4. 检查 Tutorbox 后端日志中是否有错误信息

### 问题 2: 返回 429 但没有日志

**可能原因**:
- `planSlug` 或 `requestPath` 参数没有正确传递
- 日志写入失败但没有影响主流程

**解决方案**:
- 检查 `src/app/api/auth/validate/route.ts` 中 `enforceLimits()` 的调用参数
- 在 `logLimitEvent()` 中添加日志输出进行调试

### 问题 3: 返回 403 但没有日志

**可能原因**:
- 配额检查逻辑有问题
- `apiUsage` 表的数据不正确

**解决方案**:
- 检查 `apiUsage` 表中该用户的使用记录
- 确认 `quotaPerMonth` 的值是否正确

---

## 📞 下一步

1. **运行验证脚本**
   ```bash
   npx tsx scripts/verify-limit-events.ts
   ```

2. **查看验证结果**
   - 如果所有测试通过，验证完成 ✅
   - 如果有失败，参考故障排除部分

3. **集成到 Grammar Master**
   - 参考 `TUTORBOX_AUTH_INTEGRATION.md`
   - 在 Grammar Master 后端集成 Tutorbox Auth

4. **监控生产环境**
   - 定期查询 `limit_events` 表
   - 监控 429 和 403 事件的频率
   - 根据实际使用情况调整 `rateLimitPerMin` 和 `quotaPerMonth`

---

## 📝 文档版本

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| 1.0 | 2024-01-XX | 初始版本，确认所有验证组件就绪 |

---

**状态**: ✅ 就绪  
**最后验证**: 2024-01-XX  
**下一步**: 运行 `npx tsx scripts/verify-limit-events.ts` 进行验证

