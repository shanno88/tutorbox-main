# 第 4 阶段使用指南

## 概述

第 4 阶段扩展了 dodo 模块，添加了两个新的示例路由：
- `GET /dodo/profile` - 返回用户基本信息（Free 用户可访问）
- `GET /dodo/pro-dashboard` - 返回仪表盘数据（Pro 用户专属）

现在 dodo 模块包含 4 个路由，展示了 Free 和 Pro 权限的完整示例。

## 快速开始

### 1. 启动服务器

```bash
uvicorn app.main:app --reload
```

### 2. 初始化 Plan

```bash
curl -X POST http://localhost:8000/plans/seed
```

### 3. 注册新用户

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"pass123"}'
```

### 4. 登录获取 Token

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"pass123"}'
```

复制返回的 `access_token`，后续用 `<TOKEN>` 表示。

## Dodo 模块路由总览

| 路由 | 方法 | 权限 | 功能 |
|------|------|------|------|
| `/dodo/ping` | GET | Free | 简单的活跃检查 |
| `/dodo/profile` | GET | Free | 返回用户基本信息 |
| `/dodo/pro-workflow` | GET | Pro | Pro 专属工作流示例 |
| `/dodo/pro-dashboard` | GET | Pro | Pro 专属仪表盘 |

## Curl 示例

### Free 用户测试

#### 1. 访问 /dodo/ping（Free）

```bash
curl -X GET http://localhost:8000/dodo/ping \
  -H "Authorization: Bearer <TOKEN>"
```

预期返回 **200 OK**：
```json
{
  "message": "dodo base alive",
  "user_id": 1,
  "scope": "public"
}
```

#### 2. 访问 /dodo/profile（Free）

```bash
curl -X GET http://localhost:8000/dodo/profile \
  -H "Authorization: Bearer <TOKEN>"
```

预期返回 **200 OK**：
```json
{
  "user_id": 1,
  "email": "testuser@example.com",
  "projects": 0,
  "created_at": "2026-03-19T10:00:00",
  "scope": "free"
}
```

#### 3. 尝试访问 /dodo/pro-workflow（Pro-only）

```bash
curl -X GET http://localhost:8000/dodo/pro-workflow \
  -H "Authorization: Bearer <TOKEN>"
```

预期返回 **403 Forbidden**：
```json
{
  "detail": "Pro subscription required"
}
```

#### 4. 尝试访问 /dodo/pro-dashboard（Pro-only）

```bash
curl -X GET http://localhost:8000/dodo/pro-dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

预期返回 **403 Forbidden**：
```json
{
  "detail": "Pro subscription required"
}
```

### Pro 用户测试

#### 升级用户到 Pro（通过数据库）

打开 SQLite 数据库 `app.db`，执行以下 SQL：

```sql
-- 获取 Pro plan 的 ID
SELECT id FROM plans WHERE name = 'Pro';

-- 假设 Pro plan ID 是 2，将用户升级到 Pro
UPDATE subscriptions 
SET plan_id = 2 
WHERE user_id = (SELECT id FROM users WHERE email = 'testuser@example.com') 
AND status = 'active';
```

#### 1. 访问 /dodo/pro-workflow（Pro）

```bash
curl -X GET http://localhost:8000/dodo/pro-workflow \
  -H "Authorization: Bearer <TOKEN>"
```

预期返回 **200 OK**：
```json
{
  "message": "dodo pro workflow",
  "user_id": 1,
  "scope": "pro"
}
```

#### 2. 访问 /dodo/pro-dashboard（Pro）

```bash
curl -X GET http://localhost:8000/dodo/pro-dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

预期返回 **200 OK**：
```json
{
  "user_id": 1,
  "dashboard": {
    "total_workflows": 5,
    "active_projects": 2,
    "api_calls_this_month": 1250,
    "storage_used_gb": 2.5,
    "last_sync": "2026-03-19T10:30:00Z"
  },
  "scope": "pro"
}
```

#### 3. 访问 /dodo/profile（Free 路由，Pro 用户也可访问）

```bash
curl -X GET http://localhost:8000/dodo/profile \
  -H "Authorization: Bearer <TOKEN>"
```

预期返回 **200 OK**：
```json
{
  "user_id": 1,
  "email": "testuser@example.com",
  "projects": 0,
  "created_at": "2026-03-19T10:00:00",
  "scope": "free"
}
```

## 使用 Swagger UI 测试

### 1. 打开 Swagger UI

访问 http://localhost:8000/docs

### 2. 点击 "Authorize" 按钮

在弹出的对话框中输入：
```
Bearer <TOKEN>
```

### 3. 测试 Dodo 路由

在 Swagger UI 中找到 "dodo" 标签，可以看到 4 个路由：
- `GET /dodo/ping`
- `GET /dodo/profile`
- `GET /dodo/pro-workflow`
- `GET /dodo/pro-dashboard`

点击每个路由的 "Try it out" 按钮进行测试。

## 完整测试流程

### 步骤 1：初始化

```bash
# 启动服务器
uvicorn app.main:app --reload

# 初始化 Plan
curl -X POST http://localhost:8000/plans/seed
```

### 步骤 2：注册并登录

```bash
# 注册用户
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"pass123"}'

# 登录获取 token
TOKEN=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"pass123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"
```

### 步骤 3：测试 Free 用户权限

```bash
# 测试 Free 路由
curl -X GET http://localhost:8000/dodo/ping \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:8000/dodo/profile \
  -H "Authorization: Bearer $TOKEN"

# 测试 Pro 路由（应该返回 403）
curl -X GET http://localhost:8000/dodo/pro-workflow \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:8000/dodo/pro-dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### 步骤 4：升级用户到 Pro

```bash
# 使用 SQLite 升级用户
sqlite3 app.db << EOF
UPDATE subscriptions 
SET plan_id = (SELECT id FROM plans WHERE name = 'Pro') 
WHERE user_id = (SELECT id FROM users WHERE email = 'testuser@example.com') 
AND status = 'active';
EOF
```

### 步骤 5：测试 Pro 用户权限

```bash
# 测试 Pro 路由（应该返回 200）
curl -X GET http://localhost:8000/dodo/pro-workflow \
  -H "Authorization: Bearer $TOKEN"

curl -X GET http://localhost:8000/dodo/pro-dashboard \
  -H "Authorization: Bearer $TOKEN"

# Free 路由仍然可访问
curl -X GET http://localhost:8000/dodo/profile \
  -H "Authorization: Bearer $TOKEN"
```

## 权限规则

### Free 用户可访问
- ✅ `/dodo/ping` - 活跃检查
- ✅ `/dodo/profile` - 用户信息

### Pro 用户可访问
- ✅ `/dodo/ping` - 活跃检查
- ✅ `/dodo/profile` - 用户信息
- ✅ `/dodo/pro-workflow` - Pro 工作流
- ✅ `/dodo/pro-dashboard` - Pro 仪表盘

### 权限检查失败返回
- **401 Unauthorized** - 没有提供有效的 token
- **403 Forbidden** - 用户没有 Pro 订阅

## 常见问题

### Q: 为什么访问路由返回 401？
**A:** 可能是以下原因：
- 没有提供 token
- token 格式不正确（应该是 `Bearer <token>`）
- token 已过期

### Q: 为什么访问 Pro 路由返回 403？
**A:** 用户没有 Pro 订阅。检查：
1. 用户是否有活跃的订阅
2. 订阅的 plan 是否为 "Pro"
3. 订阅状态是否为 "active"

### Q: 如何在 Swagger UI 中测试？
**A:** 
1. 访问 http://localhost:8000/docs
2. 点击右上角 "Authorize" 按钮
3. 输入 `Bearer <token>`
4. 点击 "Authorize" 确认
5. 现在可以在 Swagger UI 中测试所有路由

## 下一步

- 将 mock 数据移到独立的 service 层（`app/services/dodo_service.py`）
- 添加数据库持久化，存储用户的实际项目和工作流数据
- 创建更多 dodo 子路由，例如：
  - `GET /dodo/workflows` - 列出用户的工作流
  - `POST /dodo/workflows` - 创建新工作流
  - `GET /dodo/workflows/{id}` - 获取工作流详情
- 为其他产品（马王堆、星光体式等）创建类似的模块结构
