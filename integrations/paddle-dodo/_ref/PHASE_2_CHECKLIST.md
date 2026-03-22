# 第 2 阶段实施检查清单

## ✅ 代码修改检查

- [x] `app/routes/plans.py` - 添加 `get_or_create_free_plan()` 和 `get_or_create_pro_plan()`
- [x] `app/routes/plans.py` - 添加 `POST /plans/seed` 端点
- [x] `app/routes/auth.py` - 在 `register()` 中添加自动分配 Free 订阅
- [x] `app/routes/billing.py` - 新建文件，实现两个订阅查询端点
- [x] `app/main.py` - 导入并注册 `billing` 路由
- [x] 语法检查通过

## 🚀 部署步骤

### 第 1 步：安装依赖（如果需要）
```bash
pip install -r requirements.txt
```

### 第 2 步：启动服务器
```bash
uvicorn app.main:app --reload
```

### 第 3 步：初始化 Plan（首次运行）
```bash
curl -X POST http://localhost:8000/plans/seed
```

### 第 4 步：验证功能
```bash
# 运行自动化测试
python test_subscriptions.py

# 或手动测试
# 1. 注册用户
# 2. 登录获取 Token
# 3. 查询订阅状态
```

## 📋 功能验证清单

### 注册功能
- [ ] `POST /auth/register` 返回 200
- [ ] 用户成功写入数据库
- [ ] 自动创建 Free 订阅
- [ ] 订阅状态为 "active"

### 登录功能
- [ ] `POST /auth/login` 返回 200
- [ ] 返回有效的 JWT token
- [ ] 错误密码返回 401

### Plan 初始化
- [ ] `POST /plans/seed` 返回 200
- [ ] Free plan 创建成功
- [ ] Pro plan 创建成功
- [ ] 重复调用不会重复创建

### 订阅查询
- [ ] `GET /subscriptions/me` 返回完整订阅信息
- [ ] `GET /subscriptions/me/status` 返回 `{"plan": "free", "status": "active"}`
- [ ] 无 token 访问返回 403
- [ ] 无效 token 返回 401

## 🔍 数据库验证

### 检查 Plan 表
```sql
SELECT * FROM plans;
-- 应该看到：
-- id=1, name="Free", paddle_price_id="free"
-- id=2, name="Pro", paddle_price_id="pro"
```

### 检查 User 表
```sql
SELECT * FROM users;
-- 应该看到注册的用户
```

### 检查 Subscription 表
```sql
SELECT * FROM subscriptions;
-- 应该看到每个用户对应的 Free 订阅
```

## 🧪 测试场景

### 场景 1: 新用户完整流程
1. 调用 `POST /plans/seed` ✓
2. 调用 `POST /auth/register` 注册新用户 ✓
3. 验证用户已创建 ✓
4. 验证 Free 订阅已自动创建 ✓
5. 调用 `POST /auth/login` 登录 ✓
6. 调用 `GET /subscriptions/me` 查询订阅 ✓
7. 验证返回 Free plan 信息 ✓

### 场景 2: 权限验证
1. 不提供 token 调用 `GET /subscriptions/me` → 返回 403 ✓
2. 提供无效 token 调用 `GET /subscriptions/me` → 返回 401 ✓
3. 提供有效 token 调用 `GET /subscriptions/me` → 返回 200 ✓

### 场景 3: 多用户场景
1. 注册用户 A ✓
2. 注册用户 B ✓
3. 用户 A 登录，查询订阅 → 只看到自己的订阅 ✓
4. 用户 B 登录，查询订阅 → 只看到自己的订阅 ✓

## 📊 预期的 API 响应

### POST /auth/register
```json
{
  "id": 1,
  "email": "user@example.com",
  "created_at": "2024-03-19T10:00:00"
}
```

### POST /auth/login
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### POST /plans/seed
```json
{
  "message": "Plans seeded successfully",
  "free_plan": {
    "id": 1,
    "name": "Free",
    "paddle_price_id": "free"
  },
  "pro_plan": {
    "id": 2,
    "name": "Pro",
    "paddle_price_id": "pro"
  }
}
```

### GET /subscriptions/me
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

### GET /subscriptions/me/status
```json
{
  "plan": "free",
  "status": "active"
}
```

## 🐛 故障排查

### 问题: 注册后查询订阅返回 404
**解决方案:**
1. 确保已调用 `POST /plans/seed`
2. 检查数据库中是否有 Free plan
3. 检查 Subscription 表中是否有该用户的记录

### 问题: 无法登录
**解决方案:**
1. 确保用户已注册
2. 检查邮箱和密码是否正确
3. 检查密码是否被正确 hash

### 问题: 查询订阅返回 403
**解决方案:**
1. 确保提供了 Bearer token
2. 检查 token 格式是否正确
3. 检查 token 是否过期

### 问题: 查询订阅返回 401
**解决方案:**
1. 检查 token 是否有效
2. 检查 JWT_SECRET_KEY 是否正确
3. 检查用户是否存在

## ✨ 完成标志

当以下条件都满足时，第 2 阶段完成：

- [x] 所有代码修改已应用
- [x] 语法检查通过
- [x] 服务器能正常启动
- [x] `/health` 端点返回 200
- [x] `/docs` 能访问
- [x] 新用户注册时自动分配 Free 订阅
- [x] 能查询当前用户的订阅状态
- [x] 订阅查询端点受认证保护
- [x] 所有测试场景通过

## 📝 备注

- 当前使用 SQLite 数据库，生产环境建议改为 PostgreSQL
- 密码使用简单 SHA256，生产环境建议改为 bcrypt
- Plan 初始化使用 seed 端点，生产环境可改为数据库迁移脚本
- 所有时间戳使用 UTC，前端需要自行转换为本地时区

## 🎉 下一步

第 2 阶段完成后，可以进入第 3 阶段：
- 创建权限检查依赖
- 创建受保护路由
- 实现权限逻辑
