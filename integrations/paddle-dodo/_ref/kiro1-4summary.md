 第 1 阶段完成 - 修改总结
修改的文件
文件	修改内容
app/config.py	✅ 添加 jwt_secret_key、jwt_algorithm、jwt_expire_minutes 配置
app/deps.py	✅ 添加 get_current_user() 依赖，从 Bearer token 解析用户
app/routes/auth.py	✅ 添加 /auth/login 端点、verify_password() 和 create_access_token() 函数
app/schemas.py	✅ 添加 SubscriptionOut schema（为第 2 阶段准备）
requirements.txt	✅ 添加 PyJWT 和 pydantic-settings 依赖
.env.example	✅ 添加 JWT 配置示例
新增的功能
POST /auth/login - 登录端点

接收 email 和 password
验证成功返回 {"access_token": "...", "token_type": "bearer"}
验证失败返回 401
get_current_user() - 依赖注入

从 Authorization: Bearer <token> header 中提取 token
解析 JWT，获取 user_id
从数据库查询用户
可在任何路由中使用 Depends(get_current_user) 来保护端点
下一步操作
安装新依赖

pip install -r requirements.txt
创建 .env 文件（从 .env.example 复制）

cp .env.example .env
修改 JWT_SECRET_KEY 为一个强密钥（生产环境必须改）

启动服务器

uvicorn app.main:app --reload
测试流程

# 终端 1：启动服务器
uvicorn app.main:app --reload

# 终端 2：运行测试脚本
python test_auth.py
手动测试（用 curl 或 Postman）

# 注册
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# 登录
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# 返回示例
# {"access_token":"eyJhbGc...","token_type":"bearer"}
关键代码片段说明
JWT Token 生成（在 auth.py）

def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "exp": expire}
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token
Token 验证（在 deps.py）

def get_current_user(credentials: HTTPAuthCredentials = Depends(security), ...):
    token = credentials.credentials
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user
使用示例（在任何路由中）

@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
准备好进入第 2 阶段了吗？ 下一步是实现订阅状态查询和自动分配 Free 订阅。

第 2 阶段完成总结
我已经为你完成了第 2 阶段的所有实现。以下是修改的文件和关键功能：

📂 修改的文件
文件	修改内容
app/routes/plans.py	✅ 添加 get_or_create_free_plan() 和 get_or_create_pro_plan() 函数；添加 POST /plans/seed 端点
app/routes/auth.py	✅ 在 register() 中添加自动分配 Free 订阅的逻辑
app/routes/billing.py	✅ 新建文件，实现 GET /subscriptions/me 和 GET /subscriptions/me/status
app/main.py	✅ 导入并注册 billing 路由
🎯 实现的功能
1️⃣ 自动初始化 Free/Pro Plan
端点: POST /plans/seed
功能: 检查数据库，如果不存在则创建 Free 和 Pro plan
特点: 可重复调用，已存在则跳过
2️⃣ 注册时自动分配 Free 订阅
修改: POST /auth/register
逻辑: 用户注册后自动创建 Subscription 记录（plan_id=Free, status=active）
结果: 新用户立即拥有 Free 订阅
3️⃣ 订阅查询接口
GET /subscriptions/me - 返回完整订阅信息（包括 plan 详情）
GET /subscriptions/me/status - 返回简化状态 {"plan": "free", "status": "active"}
认证: 两个端点都需要有效的 Bearer token
🚀 快速开始
# 1. 启动服务器
uvicorn app.main:app --reload

# 2. 初始化 Plan（首次运行）
curl -X POST http://localhost:8000/plans/seed

# 3. 注册用户（自动分配 Free 订阅）
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# 4. 登录获取 Token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}' | jq -r '.access_token')

# 5. 查询订阅状态
curl -X GET http://localhost:8000/subscriptions/me/status \
  -H "Authorization: Bearer $TOKEN"
# 返回: {"plan": "free", "status": "active"}
🧪 测试
# 运行自动化测试脚本
python test_subscriptions.py
📊 数据流
用户注册 → 创建 User → 获取/创建 Free Plan → 创建 Subscription
                                                    ↓
用户登录 → 生成 JWT Token → 查询 /subscriptions/me → 返回订阅详情
📝 生成的文档
PHASE_2_GUIDE.md - 详细使用指南
PHASE_2_SUMMARY.md - 完整总结
PHASE_2_CHECKLIST.md - 实施检查清单
test_subscriptions.py - 自动化测试脚本
curl_examples.sh - curl 命令示例
⚠️ 重要提醒
首次运行: 必须先调用 POST /plans/seed 初始化 Plan
认证格式: 使用 Authorization: Bearer <token> 格式
数据库: 所有数据存储在 app.db（SQLite）
密码: 当前使用 SHA256，生产环境应改为 bcrypt
🎉 下一步
第 2 阶段完成后，可以进入第 3 阶段：

创建权限检查依赖 require_pro_subscription()
创建受保护路由示例 GET /practice/star-light-home
实现权限逻辑：Free 用户返回 403，Pro 用户返回内容
准备好进入第 3 阶段了吗？ 我可以帮你实现权限保护和受保护路由。
第 3 阶段实现概览
新增依赖
subscriptions.py
 - require_pro_subscription()
检查当前用户是否拥有活跃的 Pro 订阅
验证订阅状态为 "active" 且 plan 名称为 "Pro"
不满足条件时返回 403 Forbidden，detail: "Pro subscription required"
新增路由
practice.py
 - 演示 Pro 订阅保护的路由模块
GET /practice/star-light-home - Pro 专属内容示例
依赖 require_pro_subscription，只有 Pro 用户可访问
返回 JSON: {"message": "Welcome to Star Light Home (Pro only)", "feature": "star-light-home", "access": "pro"}
代码改动明细
subscriptions.py
（新建）
实现 require_pro_subscription() 依赖函数，检查用户是否拥有活跃的 Pro 订阅。查询逻辑：获取当前用户 → 查询最新活跃订阅 → 验证 plan 名称为 "Pro" → 不满足则返回 403。

practice.py
（新建）
定义 Pro 专属路由，包含 GET /practice/star-light-home 端点，依赖 require_pro_subscription，返回 Pro 专属内容。

main.py
（修改）
导入 practice 路由模块并通过 app.include_router(practice.router) 注册。

deps.py
（修改）
修复 JWT token 的 sub 字段必须为字符串的问题。在生成 token 时将 user_id 转换为字符串，在解码时转换回整数。

auth.py
（修改）
修复 token 生成时的 exp 字段为 Unix 时间戳（整数），而不是 datetime 对象。

.env（修改）
修复 JWT_EXPIRE_MINUTES 从 60 改为 1440（24 小时），防止 token 过期。

自测验证结果
Free 用户
/subscriptions/me/status 返回：{"plan": "free", "status": "active"}
/practice/star-light-home 返回：状态码 403，detail: "Pro subscription required"
Pro 用户
切换到 Pro 的具体方式：在 SQLite 的 subscriptions 表中执行 UPDATE subscriptions SET plan_id = 2 WHERE user_id = X AND status = 'active'（其中 2 是 Pro plan 的 ID）
/subscriptions/me/status 返回：{"plan": "pro", "status": "active"}
/practice/star-light-home 返回：状态码 200，响应体 {"message": "Welcome to Star Light Home (Pro only)", "feature": "star-light-home", "access": "pro"}
后续建议
扩展更多 Pro 路由 - 在 
practice.py
 中添加更多 Pro 专属端点（如 /practice/advanced-features），所有路由都可复用 require_pro_subscription 依赖，减少代码重复。

创建权限装饰器 - 考虑创建通用的权限检查装饰器支持多个权限级别（Free、Pro、Enterprise），例如 @require_subscription("pro")，提高代码可维护性。

与业务路由对接 - 为马王堆、星光体式等产品创建对应的受保护路由（如 
mawangdui.py
、
starlight.py
），每个产品路由可有自己的权限要求，形成清晰的模块化结构。


第 4 阶段实现概览 - 新增 dodo 路由
新增路由：

GET /dodo/profile (Free) - 返回用户基本信息（user_id、email、projects、created_at）
GET /dodo/pro-dashboard (Pro-only) - 返回仪表盘数据（workflows、projects、API calls、storage、last_sync）
权限规则：

Free: /dodo/ping、/dodo/profile 可访问
Pro-only: /dodo/pro-workflow、/dodo/pro-dashboard 可访问
修改的文件
__init__.py
：

添加 GET /dodo/profile 端点，依赖 get_current_user，返回用户基本信息
添加 GET /dodo/pro-dashboard 端点，依赖 require_pro_subscription，返回 Pro 仪表盘数据
更新现有路由的 docstring，标明 Free/Pro 权限
PHASE_4_GUIDE.md：

新建完整的使用指南
包含 4 个可直接复制的 curl 示例（Free 和 Pro 用户各 2 个）
说明如何通过数据库升级用户到 Pro
提供 Swagger UI 和完整测试流程
PHASE_4_SUMMARY.md：

新建实现总结文档
包含代码改动明细、自测验证结果、后续建议
自测结果
Free 用户：

✅ GET /dodo/ping → 200 OK
✅ GET /dodo/profile → 200 OK（返回用户信息）
✅ GET /dodo/pro-workflow → 403 Forbidden（Pro subscription required）
✅ GET /dodo/pro-dashboard → 403 Forbidden（Pro subscription required）
Pro 用户（升级后）：

✅ GET /dodo/ping → 200 OK
✅ GET /dodo/profile → 200 OK
✅ GET /dodo/pro-workflow → 200 OK（返回 Pro 工作流）
✅ GET /dodo/pro-dashboard → 200 OK（返回仪表盘数据）
主要验证结论：

所有路由正常工作，权限检查逻辑正确
Free 用户无法访问 Pro 路由（403）
Pro 用户可以访问所有路由（200）
语法检查通过，服务器正常启动
所有新增端点在 Swagger UI 中可见
后续建议
将 Mock 数据移到 Service 层 - 创建 
dodo_service.py
，抽象数据生成逻辑，便于后续与数据库集成

添加数据库持久化 - 创建 Project 和 Workflow 模型，存储实际的用户项目和工作流数据，替换硬编码的 mock 数据


__init__.py
 和 
__init__.py