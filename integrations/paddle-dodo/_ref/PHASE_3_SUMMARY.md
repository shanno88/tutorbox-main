# 第 3 阶段完成总结

## 第 3 阶段实现概览

### 新增依赖

- **`app/dependencies/subscriptions.py`** - `require_pro_subscription()`
  - 检查当前用户是否拥有活跃的 Pro 订阅
  - 如果不满足条件，返回 403 Forbidden
  - 与现有的 `get_current_user` 和 `get_db_session` 依赖风格一致

### 新增路由

- **`app/routes/practice.py`** - 演示 Pro 订阅保护的路由模块
  - `GET /practice/star-light-home` - 返回 Pro 专属内容
  - 依赖 `require_pro_subscription`，只有 Pro 用户可访问
  - 返回 JSON: `{"message": "Welcome to Star Light Home (Pro only)", "feature": "star-light-home", "access": "pro"}`

### 修改的文件

- **`app/main.py`** - 导入并注册 `practice` 路由

## 代码改动明细

### `app/dependencies/subscriptions.py`（新建）

**功能：**
- 实现 `require_pro_subscription()` 依赖函数
- 检查用户是否拥有活跃的 Pro 订阅
- 查询逻辑：
  1. 获取当前用户（通过 `get_current_user`）
  2. 查询用户最新的活跃订阅（status == "active"）
  3. 验证订阅对应的 Plan 名称为 "Pro"
  4. 如果验证失败，抛出 403 异常

**关键代码：**
```python
def require_pro_subscription(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> models.User:
    # 查询用户最新的活跃订阅
    subscription = (
        db.query(models.Subscription)
        .filter(
            models.Subscription.user_id == current_user.id,
            models.Subscription.status == "active",
        )
        .order_by(models.Subscription.created_at.desc())
        .first()
    )
    
    if not subscription:
        raise HTTPException(status_code=403, detail="Pro subscription required")
    
    # 验证 plan 是否为 Pro
    plan = db.query(models.Plan).filter(models.Plan.id == subscription.plan_id).first()
    if plan.name.lower() != "pro":
        raise HTTPException(status_code=403, detail="Pro subscription required")
    
    return current_user
```

### `app/routes/practice.py`（新建）

**功能：**
- 定义 Pro 专属路由
- 演示如何使用 `require_pro_subscription` 依赖

**端点：**
- `GET /practice/star-light-home`
  - 依赖：`require_pro_subscription`
  - 返回：`{"message": "Welcome to Star Light Home (Pro only)", "feature": "star-light-home", "access": "pro"}`
  - 权限：仅 Pro 用户可访问

**关键代码：**
```python
@router.get("/star-light-home", response_model=PracticeResponse)
def get_star_light_home(
    current_user: models.User = Depends(require_pro_subscription),
) -> PracticeResponse:
    return PracticeResponse(
        message="Welcome to Star Light Home (Pro only)",
        feature="star-light-home",
        access="pro",
    )
```

### `app/main.py`（修改）

**修改内容：**
- 导入 `practice` 路由模块
- 注册 `practice.router`

**修改前：**
```python
from .routes import auth, plans, billing
app.include_router(auth.router)
app.include_router(plans.router)
app.include_router(billing.router)
```

**修改后：**
```python
from .routes import auth, plans, billing, practice
app.include_router(auth.router)
app.include_router(plans.router)
app.include_router(billing.router)
app.include_router(practice.router)
```

## 自测验证结果

### 测试环境
- 服务器：`uvicorn app.main:app --reload`
- 数据库：SQLite (`app.db`)
- 测试用户：`protest@example.com`

### Free 用户测试

**初始化和注册：**
```
✅ POST /plans/seed → 200
✅ POST /auth/register (protest@example.com) → 200
✅ POST /auth/login → 200，获得 access_token
```

**订阅状态查询：**
```
✅ GET /subscriptions/me/status
返回：
{
  "plan": "free",
  "status": "active"
}
```

**访问 Pro 路由：**
```
✅ GET /practice/star-light-home
状态码：403 Forbidden
返回：
{
  "detail": "Pro subscription required"
}
```

### Pro 用户测试

**升级用户到 Pro：**
```
✅ 通过 SQLite 数据库操作：
UPDATE subscriptions 
SET plan_id = (SELECT id FROM plans WHERE name = 'Pro') 
WHERE user_id = (SELECT id FROM users WHERE email = 'protest@example.com') 
AND status = 'active';

验证：
SELECT s.id, s.plan_id, p.name FROM subscriptions s 
JOIN plans p ON s.plan_id = p.id 
WHERE s.user_id = (SELECT id FROM users WHERE email = 'protest@example.com');
结果：Subscription ID=1, Plan ID=2, Plan Name=Pro
```

**订阅状态查询：**
```
✅ GET /subscriptions/me/status
返回：
{
  "plan": "pro",
  "status": "active"
}
```

**访问 Pro 路由：**
```
✅ GET /practice/star-light-home
状态码：200 OK
返回：
{
  "message": "Welcome to Star Light Home (Pro only)",
  "feature": "star-light-home",
  "access": "pro"
}
```

### 完整测试流程

运行自动化测试脚本：
```bash
python test_pro_route.py
```

**测试结果：✅ 所有测试通过**
- ✅ Free 用户无法访问 Pro 路由（403）
- ✅ Pro 用户可以访问 Pro 路由（200）
- ✅ 权限控制正常工作
- ✅ 订阅状态查询正确

## 完整的故事线

### 用户旅程：从注册到访问 Pro 内容

```
1. 用户注册
   POST /auth/register
   → 自动创建 Free 订阅
   
2. 用户登录
   POST /auth/login
   → 获得 JWT token
   
3. 用户查看订阅状态
   GET /subscriptions/me/status (需要 token)
   → 返回 {"plan": "free", "status": "active"}
   
4. 用户尝试访问 Pro 内容
   GET /practice/star-light-home (需要 token)
   → 返回 403，提示需要 Pro 订阅
   
5. 用户升级到 Pro（通过支付或管理员操作）
   数据库更新：plan_id = Pro
   
6. 用户再次查看订阅状态
   GET /subscriptions/me/status (需要 token)
   → 返回 {"plan": "pro", "status": "active"}
   
7. 用户访问 Pro 内容
   GET /practice/star-light-home (需要 token)
   → 返回 200，显示 Pro 专属内容
```

## API 端点总结

| 方法 | 端点 | 认证 | 权限 | 功能 |
|------|------|------|------|------|
| POST | /auth/register | ❌ | - | 注册用户 |
| POST | /auth/login | ❌ | - | 登录获取 token |
| POST | /plans/seed | ❌ | - | 初始化 Plan |
| GET | /subscriptions/me/status | ✅ | - | 查看订阅状态 |
| GET | /practice/star-light-home | ✅ | Pro | 访问 Pro 内容 |

## 后续建议

### 1. 扩展更多 Pro 路由
- 在 `app/routes/practice.py` 中添加更多 Pro 专属端点
- 例如：`/practice/advanced-features`、`/practice/premium-content` 等
- 所有这些路由都可以复用 `require_pro_subscription` 依赖

### 2. 创建权限装饰器和中间件
- 考虑创建一个通用的权限检查装饰器
- 支持多个权限级别（Free、Pro、Enterprise 等）
- 例如：`@require_subscription("pro")` 或 `@require_subscription("enterprise")`

### 3. 与业务路由对接
- 将 `app/routes/practice.py` 作为模板
- 为马王堆、星光体式等产品创建对应的受保护路由
- 例如：`app/routes/mawangdui.py`、`app/routes/starlight.py`
- 每个产品路由都可以有自己的权限要求

### 4. 实现 Paddle 支付集成
- 完成 `app/routes/billing.py` 中的支付流程
- 实现 `POST /billing/checkout` 创建支付链接
- 实现 Paddle webhook 处理，自动升级用户订阅
- 参考 `app/services/paddle_client.py` 中的框架

### 5. 添加订阅管理功能
- 实现 `GET /subscriptions` 查看所有订阅历史
- 实现 `POST /subscriptions/upgrade` 升级订阅
- 实现 `POST /subscriptions/downgrade` 降级订阅
- 实现 `POST /subscriptions/cancel` 取消订阅

### 6. 实现订阅过期检查
- 在 `require_pro_subscription` 中添加 `current_period_end` 检查
- 如果订阅已过期，返回 403
- 实现自动续费逻辑

### 7. 添加审计日志
- 记录用户的权限检查结果
- 记录订阅状态变更
- 便于调试和合规性检查

## 文件清单

### 新增文件
- `app/dependencies/__init__.py` - 依赖模块初始化
- `app/dependencies/subscriptions.py` - 订阅权限依赖
- `app/routes/practice.py` - Pro 专属路由示例
- `test_pro_route.py` - 自动化测试脚本
- `PHASE_3_GUIDE.md` - 使用指南
- `PHASE_3_SUMMARY.md` - 本文件

### 修改文件
- `app/main.py` - 注册 practice 路由

### 未修改文件（保持兼容）
- `app/models.py` - 数据模型
- `app/schemas.py` - 请求/响应 schema
- `app/deps.py` - 基础依赖
- `app/routes/auth.py` - 认证路由
- `app/routes/plans.py` - Plan 管理路由
- `app/routes/billing.py` - 订阅查询路由

## 验证清单

- [x] 语法检查通过（`python -m py_compile`）
- [x] 服务器能正常启动
- [x] `/health` 端点返回 200
- [x] `/docs` Swagger UI 可访问
- [x] Free 用户无法访问 Pro 路由（403）
- [x] Pro 用户可以访问 Pro 路由（200）
- [x] 权限检查逻辑正确
- [x] 自动化测试脚本通过
- [x] 所有新增端点在 Swagger UI 中可见

## 关键特性

✅ **权限隔离** - Free 和 Pro 用户有不同的访问权限
✅ **灵活扩展** - 轻松添加更多 Pro 专属路由
✅ **清晰的错误消息** - 用户知道为什么被拒绝访问
✅ **数据库驱动** - 权限基于数据库中的订阅记录
✅ **标准 FastAPI 依赖** - 与现有代码风格一致
✅ **完整的测试覆盖** - 自动化测试脚本验证所有场景

## 下一步

第 3 阶段完成后，可以进入第 4 阶段：
- 完成 Paddle 支付集成
- 实现自动升级用户订阅
- 添加订阅管理接口
- 实现订阅过期检查
