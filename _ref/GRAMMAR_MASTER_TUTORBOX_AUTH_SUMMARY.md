# Grammar Master - Tutorbox Auth 集成总结

## 完成的工作

已成功在 Grammar Master 中集成 Tutorbox 的限流 + 配额系统。

### 📦 创建的文件

1. **`backend/src/middleware/withTutorboxAuth.js`** - 认证中间件
   - 从请求头 `x-api-key` 读取 API Key
   - 调用 Tutorbox 的 `/api/auth/validate`
   - 处理 429 (限流) 和 403 (超配额) 错误
   - 将用户信息附加到 `req.tutorboxAuth`

2. **`backend/src/routes/deepseek.js`** - 已集成的 DeepSeek 路由
   - 添加 `withTutorboxAuth` 中间件
   - 使用 Tutorbox Auth 的用户信息
   - 在响应中附加 `_meta` 字段（userId, planSlug, remainingQuota）

3. **`backend/scripts/test-tutorbox-auth.js`** - 测试脚本
   - 验证 Tutorbox Auth 服务
   - 测试限流：发送超过 `rateLimitPerMin` 的请求
   - 测试配额：发送超过 `quotaPerMonth` 的请求
   - 测试错误处理：无效 Key、缺少 Key 等

4. **文档**
   - `TUTORBOX_AUTH_INTEGRATION.md` - 完整集成指南
   - `QUICK_START_TUTORBOX_AUTH.md` - 快速开始指南
   - `GRAMMAR_MASTER_TUTORBOX_AUTH_SUMMARY.md` - 本文件

### 🔧 修改的文件

- **`backend/src/routes/deepseek.js`** - 集成 Tutorbox Auth 中间件

## 已集成的 API 路由

### POST /api/deepseek/chat
- **功能**: 调用 DeepSeek LLM 进行语法分析
- **认证**: 需要 `x-api-key` 请求头
- **限流**: 基于 Tutorbox Plan 的 `rateLimitPerMin`
- **配额**: 基于 Tutorbox Plan 的 `quotaPerMonth`
- **响应**: 包含 `_meta` 字段（userId, planSlug, remainingQuota）

## 工作流程

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
调用 DeepSeek LLM
  ↓
返回结果 + 用户信息
```

## 本地配置

### 环境变量

在 `backend/.env` 中添加：

```bash
# Tutorbox Auth 服务的 base URL
TUTORBOX_AUTH_URL=http://localhost:3000

# DeepSeek API Key（保持不变）
DEEPSEEK_API_KEY=your-deepseek-key
```

### 启动服务

```bash
# 终端 1: Tutorbox
cd tutorbox
npm run dev

# 终端 2: Grammar Master 后端
cd backend
npm run dev
```

## 测试

### 快速测试

```bash
# 1. 在 Tutorbox 中创建测试 API Key
# 2. 运行测试脚本
cd backend
TEST_API_KEY=your-test-key node scripts/test-tutorbox-auth.js
```

### 手动测试限流

```bash
# 创建 Plan: rateLimitPerMin=5
# 在 60 秒内发送 6 次请求

for i in {1..6}; do
  curl -X POST http://localhost:3001/api/deepseek/chat \
    -H "Content-Type: application/json" \
    -H "x-api-key: your-test-key" \
    -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
done

# 第 6 次应该返回 429
```

### 手动测试配额

```bash
# 创建 Plan: quotaPerMonth=10
# 发送 11 次请求

for i in {1..11}; do
  curl -X POST http://localhost:3001/api/deepseek/chat \
    -H "Content-Type: application/json" \
    -H "x-api-key: your-test-key" \
    -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
done

# 第 11 次应该返回 403
```

## API 调用示例

### 成功请求

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

## 后续集成

### 需要集成的其他 API

以下 API 可能需要集成 Tutorbox Auth（根据业务需求）：

- `POST /api/billing/*` - 计费相关
- `POST /api/licenses/*` - 许可证相关
- 其他调用 LLM 的 API

### 集成步骤

1. 在路由文件中导入 `withTutorboxAuth` 中间件
2. 在需要认证的路由上添加中间件
3. 在处理器中使用 `req.tutorboxAuth` 获取用户信息
4. 测试限流和配额功能

示例：

```javascript
import { withTutorboxAuth } from '../middleware/withTutorboxAuth.js';

router.post('/analyze', withTutorboxAuth, async (req, res) => {
  const { userId, planSlug, limits } = req.tutorboxAuth;
  
  // 业务逻辑...
  
  res.json({
    result: '...',
    _meta: {
      userId,
      planSlug,
      remainingQuota: limits.remainingQuota,
    },
  });
});
```

## 文件清单

```
✅ backend/src/middleware/withTutorboxAuth.js    - 认证中间件
✅ backend/src/routes/deepseek.js                - 已集成的 DeepSeek 路由
✅ backend/scripts/test-tutorbox-auth.js         - 测试脚本
✅ TUTORBOX_AUTH_INTEGRATION.md                  - 完整集成指南
✅ QUICK_START_TUTORBOX_AUTH.md                  - 快速开始指南
✅ GRAMMAR_MASTER_TUTORBOX_AUTH_SUMMARY.md       - 本文件
```

## 相关文档

- Tutorbox Auth 实现: `tutorbox/AUTH_RATE_LIMIT_QUOTA_IMPLEMENTATION.md`
- Tutorbox 限流/配额: `tutorbox/docs/RATE_LIMIT_AND_QUOTA.md`
- Tutorbox 快速开始: `tutorbox/QUICK_START_RATE_LIMIT.md`

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

## 下一步

1. **配置环境变量**: 在 `backend/.env` 中添加 `TUTORBOX_AUTH_URL`
2. **启动服务**: 启动 Tutorbox 和 Grammar Master 后端
3. **创建测试 API Key**: 在 Tutorbox 中创建测试 API Key
4. **运行测试**: 运行 `TEST_API_KEY=your-key node scripts/test-tutorbox-auth.js`
5. **集成其他 API**: 根据需要集成其他 API 路由

---

**需要帮助？** 查看 `TUTORBOX_AUTH_INTEGRATION.md` 中的完整指南。
