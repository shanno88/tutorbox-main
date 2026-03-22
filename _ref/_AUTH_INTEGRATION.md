# Grammar Master - Tutorbox Auth 集成指南

## 概述

Grammar Master 已集成 Tutorbox 的限流 + 配额系统。所有调用 LLM 的 API 现在都需要通过 Tutorbox Auth 验证。

## 已集成的 API 路由

### 1. POST /api/deepseek/chat
- **功能**: 调用 DeepSeek LLM 进行语法分析
- **认证**: 需要 `x-api-key` 请求头
- **限流**: 基于 Tutorbox Plan 的 `rateLimitPerMin`
- **配额**: 基于 Tutorbox Plan 的 `quotaPerMonth`

## 本地配置

### 1. 环境变量

在 `backend/.env` 中添加：

```bash
# Tutorbox Auth 服务的 base URL
TUTORBOX_AUTH_URL=http://localhost:3000

# DeepSeek API Key（保持不变）
DEEPSEEK_API_KEY=your-deepseek-key
```

### 2. 启动服务

```bash
# 终端 1: 启动 Tutorbox（包含 Auth 服务）
cd tutorbox
npm run dev

# 终端 2: 启动 Grammar Master 后端
cd backend
npm run dev
```

## 调用 API

### 基本调用

```bash
curl -X POST http://localhost:3001/api/deepseek/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {
        "role": "user",
        "content": "Analyze this sentence: I am going to the store."
      }
    ]
  }'
```

### 响应示例

#### 成功 (200)
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "deepseek-chat",
  "choices": [...],
  "_meta": {
    "userId": "user-123",
    "planSlug": "pro",
    "remainingQuota": 99999
  }
}
```

#### 限流 (429)
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "retryAfterSeconds": 45
  }
}
```

#### 超配额 (403)
```json
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Monthly quota exceeded"
  }
}
```

#### 无效 API Key (401)
```json
{
  "error": {
    "code": "AUTH_FAILED",
    "message": "Authentication failed"
  }
}
```

#### 缺少 API Key (400)
```json
{
  "error": {
    "code": "MISSING_API_KEY",
    "message": "Missing x-api-key header"
  }
}
```

## 测试

### 运行自动化测试脚本

```bash
# 1. 确保 Tutorbox 和 Grammar Master 都在运行

# 2. 创建一个测试 API Key（在 Tutorbox 中）
# - 创建一个 Plan（例如 rateLimitPerMin=5, quotaPerMonth=10）
# - 创建一个 API Key 关联到这个 Plan
# - 复制 API Key

# 3. 运行测试脚本
cd backend
TEST_API_KEY=your-test-key node scripts/test-tutorbox-auth.js
```

### 手动测试限流

```bash
# 创建一个 Plan，rateLimitPerMin = 5
# 创建一个 API Key 关联到这个 Plan

# 在 60 秒内发送 6 次请求
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/deepseek/chat \
    -H "Content-Type: application/json" \
    -H "x-api-key: your-test-key" \
    -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
  echo "Request $i"
done

# 第 6 次应该返回 429
```

### 手动测试配额

```bash
# 创建一个 Plan，quotaPerMonth = 10
# 创建一个 API Key 关联到这个 Plan

# 发送 11 次请求
for i in {1..11}; do
  curl -X POST http://localhost:3001/api/deepseek/chat \
    -H "Content-Type: application/json" \
    -H "x-api-key: your-test-key" \
    -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
  echo "Request $i"
done

# 第 11 次应该返回 403
```

## 中间件实现

### 位置
`backend/src/middleware/withTutorboxAuth.js`

### 工作流程

```
请求 → 读取 x-api-key 请求头
  ↓
调用 Tutorbox /api/auth/validate
  ↓
检查响应状态
  ├─ 429 → 返回 429 (限流)
  ├─ 403 → 返回 403 (超配额)
  ├─ 401/400/500 → 返回对应错误
  └─ 200 → 继续处理请求
  ↓
将用户信息附加到 req.tutorboxAuth
  ↓
调用下一个中间件/处理器
```

### 使用方法

在路由中使用中间件：

```javascript
import { withTutorboxAuth } from '../middleware/withTutorboxAuth.js';

router.post('/chat', withTutorboxAuth, async (req, res) => {
  // req.tutorboxAuth 包含：
  // - userId: 用户 ID
  // - planId: Plan ID
  // - planSlug: Plan slug
  // - planName: Plan 名称
  // - limits: { rateLimitPerMin, quotaPerMonth, remainingQuota }
  
  // 业务逻辑...
});
```

## 后续集成

### 需要集成的其他 API

以下 API 可能需要集成 Tutorbox Auth（根据业务需求）：

- `POST /api/billing/*` - 计费相关
- `POST /api/licenses/*` - 许可证相关
- 其他调用 LLM 的 API

### 集成步骤

1. 在路由中导入 `withTutorboxAuth` 中间件
2. 在需要认证的路由上添加中间件
3. 在处理器中使用 `req.tutorboxAuth` 获取用户信息
4. 测试限流和配额功能

## 故障排除

### 问题: TUTORBOX_AUTH_URL_MISSING

**原因**: 环境变量 `TUTORBOX_AUTH_URL` 未设置

**解决方案**:
```bash
# 在 backend/.env 中添加
TUTORBOX_AUTH_URL=http://localhost:3000
```

### 问题: 连接 Tutorbox Auth 失败

**原因**: Tutorbox 服务未运行或 URL 不正确

**解决方案**:
1. 确保 Tutorbox 正在运行: `npm run dev` (在 tutorbox 目录)
2. 检查 `TUTORBOX_AUTH_URL` 是否正确
3. 检查网络连接

### 问题: 总是返回 401

**原因**: API Key 无效或过期

**解决方案**:
1. 确保 API Key 在 Tutorbox 中存在
2. 确保 API Key 的状态是 "active"
3. 确保 API Key 没有过期
4. 检查 API Key 是否正确传递在 `x-api-key` 请求头中

### 问题: 限流不生效

**原因**: Redis 未运行或连接失败

**解决方案**:
1. 确保 Redis 正在运行: `redis-server`
2. 检查 `REDIS_URL` 环境变量
3. 查看 Tutorbox 的日志

## 文件清单

```
✅ backend/src/middleware/withTutorboxAuth.js    - 认证中间件
✅ backend/src/routes/deepseek.js                - 已集成的 DeepSeek 路由
✅ backend/scripts/test-tutorbox-auth.js         - 测试脚本
✅ TUTORBOX_AUTH_INTEGRATION.md                  - 本文件
```

## 相关文档

- Tutorbox Auth 实现: `tutorbox/AUTH_RATE_LIMIT_QUOTA_IMPLEMENTATION.md`
- Tutorbox 限流/配额: `tutorbox/docs/RATE_LIMIT_AND_QUOTA.md`
- Tutorbox 快速开始: `tutorbox/QUICK_START_RATE_LIMIT.md`
