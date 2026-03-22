# 第 3 阶段使用指南

## 概述

第 3 阶段实现了基于订阅的权限控制。现在你可以创建只有 Pro 用户才能访问的受保护路由。

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
  -d '{"email":"protest@example.com","password":"pass123"}'
```

### 4. 登录获取 Token

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"protest@example.com","password":"pass123"}'
```

复制返回的 `access_token`。

### 5. 验证 Free 用户权限

#### 5.1 查看订阅状态

```bash
curl -X GET http://localhost:8000/subscriptions/me/status \
  -H "Authorization: Bearer <your_token>"
```

预期返回：
```json
{
  "plan": "free",
  "status": "active"
}
```

#### 5.2 尝试访问 Pro 路由

```bash
curl -X GET http://localhost:8000/practice/star-light-home \
  -H "Authorization: Bearer <your_token>"
```

预期返回 **403 Forbidden**：
```json
{
  "detail": "Pro subscription required"
}
```

### 6. 升级用户到 Pro（通过数据库）

打开 SQLite 数据库 `app.db`，执行以下 SQL：

```sql
-- 查看当前用户的订阅
SELECT s.id, s.user_id, s.plan_id, p.name, s.status 
FROM subscriptions s 
JOIN plans p ON s.plan_id = p.id 
WHERE s.user_id = (SELECT id FROM users WHERE email = 'protest@example.com');

-- 获取 Pro plan 的 ID
SELECT id FROM plans WHERE name = 'Pro';

-- 假设 Pro plan ID 是 2，将用户升级到 Pro
UPDATE subscriptions 
SET plan_id = 2 
WHERE user_id = (SELECT id FROM users WHERE email = 'protest@example.com') 
AND status = 'active';
```

或者使用 Python 脚本（见下文）。

### 7. 验证 Pro 用户权限

#### 7.1 查看订阅状态

```bash
curl -X GET http://localhost:8000/subscriptions/me/status \
  -H "Authorization: Bearer <your_token>"
```

预期返回：
```json
{
  "plan": "pro",
  "status": "active"
}
```

#### 7.2 访问 Pro 路由

```bash
curl -X GET http://localhost:8000/practice/star-light-home \
  -H "Authorization: Bearer <your_token>"
```

预期返回 **200 OK**：
```json
{
  "message": "Welcome to Star Light Home (Pro only)",
  "feature": "star-light-home",
  "access": "pro"
}
```

## 使用 Swagger UI 测试

### 1. 打开 Swagger UI

访问 http://localhost:8000/docs

### 2. 点击 "Authorize" 按钮

在弹出的对话框中输入：
```
Bearer <your_token>
```

### 3. 测试端点

- 点击 `GET /subscriptions/me/status` 测试订阅查询
- 点击 `GET /practice/star-light-home` 测试 Pro 路由

## 使用自动化测试脚本

运行完整的测试流程：

```bash
python test_pro_route.py
```

这个脚本会：
1. 初始化 Plan
2. 注册新用户
3. 登录获取 token
4. 验证 Free 用户无法访问 Pro 路由（403）
5. 通过数据库升级用户到 Pro
6. 验证 Pro 用户可以访问 Pro 路由（200）

## 数据库操作

### 使用 SQLite 命令行

```bash
sqlite3 app.db
```

### 查看所有 Plan

```sql
SELECT * FROM plans;
```

### 查看所有用户

```sql
SELECT * FROM users;
```

### 查看所有订阅

```sql
SELECT s.id, s.user_id, u.email, s.plan_id, p.name, s.status 
FROM subscriptions s 
JOIN users u ON s.user_id = u.id 
JOIN plans p ON s.plan_id = p.id;
```

### 将特定用户升级到 Pro

```sql
UPDATE subscriptions 
SET plan_id = (SELECT id FROM plans WHERE name = 'Pro') 
WHERE user_id = (SELECT id FROM users WHERE email = 'protest@example.com') 
AND status = 'active';
```

### 将特定用户降级到 Free

```sql
UPDATE subscriptions 
SET plan_id = (SELECT id FROM plans WHERE name = 'Free') 
WHERE user_id = (SELECT id FROM users WHERE email = 'protest@example.com') 
AND status = 'active';
```

## 权限检查逻辑

`require_pro_subscription` 依赖检查以下条件：

1. ✅ 用户已认证（有有效的 JWT token）
2. ✅ 用户拥有至少一个订阅记录
3. ✅ 订阅状态为 "active"
4. ✅ 订阅对应的 Plan 名称为 "Pro"

如果任何条件不满足，返回 **403 Forbidden**。

## 创建新的 Pro 路由

要创建新的 Pro 专属路由，只需在 `app/routes/practice.py` 中添加：

```python
@router.get("/another-pro-feature")
def get_another_pro_feature(
    current_user: models.User = Depends(require_pro_subscription),
):
    """这是另一个 Pro 专属功能"""
    return {
        "message": "This is a Pro-only feature",
        "feature": "another-pro-feature",
        "access": "pro"
    }
```

## 常见问题

### Q: 为什么访问 Pro 路由返回 401？
**A:** 可能是以下原因：
- 没有提供 token
- token 格式不正确（应该是 `Bearer <token>`）
- token 已过期

### Q: 为什么访问 Pro 路由返回 403？
**A:** 用户没有 Pro 订阅。检查：
1. 用户是否有活跃的订阅
2. 订阅的 plan 是否为 "Pro"
3. 订阅状态是否为 "active"

### Q: 如何测试多个用户？
**A:** 注册多个用户，为不同用户分配不同的订阅级别，然后用各自的 token 测试。

### Q: 如何创建其他权限级别的路由？
**A:** 创建新的依赖函数（如 `require_premium_subscription`），检查不同的 plan 名称。

## 下一步

- 创建更多 Pro 专属路由
- 实现 Paddle 支付集成，自动升级用户到 Pro
- 添加订阅管理接口（升级、降级、取消）
- 实现订阅过期检查和自动续费
