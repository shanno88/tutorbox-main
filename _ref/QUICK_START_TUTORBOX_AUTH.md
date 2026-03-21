# 快速开始：Grammar Master + Tutorbox Auth

## 5 分钟快速上手

### 1️⃣ 配置环境变量

在 `backend/.env` 中添加：

```bash
TUTORBOX_AUTH_URL=http://localhost:3000
```

### 2️⃣ 启动服务

```bash
# 终端 1: Tutorbox
cd tutorbox
npm run dev

# 终端 2: Grammar Master 后端
cd backend
npm run dev
```

### 3️⃣ 创建测试 API Key

在 Tutorbox 中：
1. 创建一个 Plan（例如 rateLimitPerMin=5, quotaPerMonth=10）
2. 创建一个 API Key 关联到这个 Plan
3. 复制 API Key

### 4️⃣ 测试 API

```bash
# 基本调用
curl -X POST http://localhost:3001/api/deepseek/chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# 运行自动化测试
cd backend
TEST_API_KEY=your-api-key node scripts/test-tutorbox-auth.js
```

## 已集成的 API

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/deepseek/chat` | POST | 调用 DeepSeek LLM |

## 请求头

| 请求头 | 必需 | 说明 |
|--------|------|------|
| `x-api-key` | ✅ | Tutorbox API Key |
| `Content-Type` | ✅ | 应为 `application/json` |

## 响应状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 缺少 API Key |
| 401 | 无效 API Key |
| 403 | 超配额 |
| 429 | 限流 |
| 500 | 服务器错误 |

## 测试限流

```bash
# 创建 Plan: rateLimitPerMin=5
# 在 60 秒内发送 6 次请求，第 6 次返回 429

for i in {1..6}; do
  curl -X POST http://localhost:3001/api/deepseek/chat \
    -H "Content-Type: application/json" \
    -H "x-api-key: your-test-key" \
    -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
done
```

## 测试配额

```bash
# 创建 Plan: quotaPerMonth=10
# 发送 11 次请求，第 11 次返回 403

for i in {1..11}; do
  curl -X POST http://localhost:3001/api/deepseek/chat \
    -H "Content-Type: application/json" \
    -H "x-api-key: your-test-key" \
    -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
done
```

## 环境变量

```bash
# 必需
TUTORBOX_AUTH_URL=http://localhost:3000

# 可选（保持现有配置）
DEEPSEEK_API_KEY=your-deepseek-key
```

## 文件位置

- 中间件: `backend/src/middleware/withTutorboxAuth.js`
- 路由: `backend/src/routes/deepseek.js`
- 测试: `backend/scripts/test-tutorbox-auth.js`
- 文档: `TUTORBOX_AUTH_INTEGRATION.md`

## 常见问题

**Q: 如何添加更多 API 到 Tutorbox Auth？**
A: 在路由中导入 `withTutorboxAuth` 中间件，添加到需要认证的路由上。

**Q: 如何获取用户信息？**
A: 在处理器中使用 `req.tutorboxAuth.userId` 等。

**Q: 限流不生效？**
A: 确保 Redis 正在运行，检查 `TUTORBOX_AUTH_URL` 是否正确。

---

详见 `TUTORBOX_AUTH_INTEGRATION.md`
