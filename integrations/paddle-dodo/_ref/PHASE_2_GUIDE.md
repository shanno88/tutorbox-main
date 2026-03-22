# 第 2 阶段完成指南

## ✅ 已完成的功能

### 1. 自动初始化 Free/Pro Plan
- **端点**: `POST /plans/seed`
- **功能**: 检查数据库中是否存在 Free 和 Pro plan，如果不存在则创建
- **返回**: 
  ```json
  {
    "message": "Plans seeded successfully",
    "free_plan": {"id": 1, "name": "Free", "paddle_price_id": "free"},
    "pro_plan": {"id": 2, "name": "Pro", "paddle_price_id": "pro"}
  }
  ```

### 2. 注册时自动分配 Free 订阅
- **修改**: `POST /auth/register`
- **逻辑**: 
  1. 创建用户
  2. 自动获取或创建 Free plan
  3. 为用户创建 Subscription 记录（plan_id=Free, status=active）
- **结果**: 新用户注册后立即拥有 Free 订阅

### 3. 订阅查询接口
- **端点 1**: `GET /subscriptions/me`
  - **认证**: 需要 Bearer token
  - **返回**: 完整订阅信息（包括 plan 详情）
  ```json
  {
    "id": 1,
    "user_id": 1,
    "plan_id": 1,
    "status": "active",
    "paddle_subscription_id": null,
    "current_period_end": null,
    "cancel_at_period_end": false,
    "created_at": "2024-03-19T10:00:00",
    "plan": {
      "id": 1,
      "name": "Free",
      "paddle_price_id": "free",
      "description": "Free plan",
      "created_at": "2024-03-19T10:00:00"
    }
  }
  ```

- **端点 2**: `GET /subscriptions/me/status`
  - **认证**: 需要 Bearer token
  - **返回**: 简化的订阅状态
  ```json
  {
    "plan": "free",
    "status": "active"
  }
  ```

## 📋 修改的文件

| 文件 | 修改内容 |
|------|--------|
| `app/routes/plans.py` | ✅ 添加 `get_or_create_free_plan()` 和 `get_or_create_pro_plan()` 函数；添加 `POST /plans/seed` 端点 |
| `app/routes/auth.py` | ✅ 在 `register()` 中添加自动分配 Free 订阅的逻辑 |
| `app/routes/billing.py` | ✅ 新建文件，实现 `GET /subscriptions/me` 和 `GET /subscriptions/me/status` |
| `app/main.py` | ✅ 导入并注册 `billing` 路由 |

## 🚀 快速开始

### 1. 启动服务器
```bash
uvicorn app.main:app --reload
```

### 2. 初始化 Plan（首次运行）
```bash
curl -X POST http://localhost:8000/plans/seed
```

### 3. 注册用户
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
```

### 4. 登录获取 Token
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'
```

### 5. 查询订阅状态
```bash
# 完整信息
curl -X GET http://localhost:8000/subscriptions/me \
  -H "Authorization: Bearer <your_token>"

# 简化版
curl -X GET http://localhost:8000/subscriptions/me/status \
  -H "Authorization: Bearer <your_token>"
```

## 🧪 运行测试脚本
```bash
python test_subscriptions.py
```

## 📊 数据流

```
用户注册
  ↓
创建 User 记录
  ↓
获取或创建 Free Plan
  ↓
创建 Subscription 记录 (user_id, plan_id=Free, status=active)
  ↓
用户登录获得 Token
  ↓
使用 Token 查询 /subscriptions/me
  ↓
返回订阅详情（包括 plan 名称、状态等）
```

## 🔄 下一步（第 3 阶段）

- 创建权限检查依赖 `require_pro_subscription()`
- 创建受保护路由示例 `GET /practice/star-light-home`
- 实现权限逻辑：Free 用户返回 403，Pro 用户返回内容

## 💡 关键代码片段

### 在注册时自动分配 Free 订阅
```python
# 在 auth.py 的 register() 函数中
free_plan = get_or_create_free_plan(db)
subscription = models.Subscription(
    user_id=user.id,
    plan_id=free_plan.id,
    status="active",
)
db.add(subscription)
db.commit()
```

### 查询当前用户的订阅
```python
# 在 billing.py 中
subscription = (
    db.query(models.Subscription)
    .filter(models.Subscription.user_id == current_user.id)
    .order_by(models.Subscription.created_at.desc())
    .first()
)
```

### 使用 get_current_user 保护端点
```python
@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
```

## ⚠️ 注意事项

1. **Plan 初始化**: 第一次运行时需要调用 `POST /plans/seed` 来初始化 Free/Pro plan
2. **自动分配**: 每个新注册的用户都会自动获得 Free 订阅
3. **认证**: `/subscriptions/me` 和 `/subscriptions/me/status` 都需要有效的 Bearer token
4. **数据库**: 所有数据都存储在本地 SQLite 数据库中（`app.db`）

## 🐛 常见问题

**Q: 为什么注册后查询订阅返回 404？**
A: 确保已经调用过 `POST /plans/seed` 来初始化 Free plan。

**Q: 如何手动修改用户的订阅状态？**
A: 可以直接修改数据库中 `subscriptions` 表的 `plan_id` 或 `status` 字段进行测试。

**Q: 能否为同一个用户创建多个订阅？**
A: 可以，但查询时会返回最新的订阅记录（按 `created_at` 倒序）。
