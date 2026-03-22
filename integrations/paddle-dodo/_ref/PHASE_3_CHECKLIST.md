# 第 3 阶段实施检查清单

## ✅ 代码修改检查

- [x] `app/dependencies/__init__.py` - 新建依赖模块初始化文件
- [x] `app/dependencies/subscriptions.py` - 新建 `require_pro_subscription()` 依赖
- [x] `app/routes/practice.py` - 新建 Pro 专属路由示例
- [x] `app/main.py` - 导入并注册 `practice` 路由
- [x] `app/deps.py` - 修复 JWT token 的 `sub` 字段格式
- [x] `app/routes/auth.py` - 修复 token 生成时的 `exp` 字段格式
- [x] `.env` - 修复 `JWT_EXPIRE_MINUTES` 为 1440
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
python test_pro_route.py

# 或手动测试
# 1. 注册用户
# 2. 登录获取 Token
# 3. 查询订阅状态
# 4. 尝试访问 Pro 路由（应返回 403）
# 5. 升级用户到 Pro
# 6. 再次访问 Pro 路由（应返回 200）
```

## 📋 功能验证清单

### 权限检查依赖
- [x] `require_pro_subscription()` 能正确检查 Pro 订阅
- [x] Free 用户访问 Pro 路由返回 403
- [x] Pro 用户访问 Pro 路由返回 200
- [x] 未认证用户访问 Pro 路由返回 401

### Pro 路由
- [x] `GET /practice/star-light-home` 端点存在
- [x] 端点依赖 `require_pro_subscription`
- [x] 端点返回正确的 JSON 格式
- [x] 端点在 Swagger UI 中可见

### JWT Token
- [x] Token 的 `sub` 字段为字符串格式
- [x] Token 的 `exp` 字段为 Unix 时间戳
- [x] Token 过期时间为 24 小时
- [x] Token 验证正确

### 数据库
- [x] Free plan 存在
- [x] Pro plan 存在
- [x] 新用户自动分配 Free 订阅
- [x] 可以通过数据库升级用户到 Pro

## 🧪 测试场景

### 场景 1: Free 用户完整流程
1. 调用 `POST /plans/seed` ✓
2. 调用 `POST /auth/register` 注册新用户 ✓
3. 验证用户已创建 ✓
4. 验证 Free 订阅已自动创建 ✓
5. 调用 `POST /auth/login` 登录 ✓
6. 调用 `GET /subscriptions/me/status` 查询订阅 ✓
7. 验证返回 Free plan 信息 ✓
8. 调用 `GET /practice/star-light-home` ✓
9. 验证返回 403 ✓

### 场景 2: Pro 用户完整流程
1. 通过数据库升级用户到 Pro ✓
2. 调用 `GET /subscriptions/me/status` 查询订阅 ✓
3. 验证返回 Pro plan 信息 ✓
4. 调用 `GET /practice/star-light-home` ✓
5. 验证返回 200 和 Pro 内容 ✓

### 场景 3: 权限验证
1. 不提供 token 调用 `GET /practice/star-light-home` → 返回 401 ✓
2. 提供无效 token 调用 `GET /practice/star-light-home` → 返回 401 ✓
3. 提供 Free 用户 token 调用 `GET /practice/star-light-home` → 返回 403 ✓
4. 提供 Pro 用户 token 调用 `GET /practice/star-light-home` → 返回 200 ✓

## 📊 预期的 API 响应

### GET /practice/star-light-home (Free 用户)
```
状态码: 403 Forbidden
{
  "detail": "Pro subscription required"
}
```

### GET /practice/star-light-home (Pro 用户)
```
状态码: 200 OK
{
  "message": "Welcome to Star Light Home (Pro only)",
  "feature": "star-light-home",
  "access": "pro"
}
```

### GET /subscriptions/me/status (Free 用户)
```
状态码: 200 OK
{
  "plan": "free",
  "status": "active"
}
```

### GET /subscriptions/me/status (Pro 用户)
```
状态码: 200 OK
{
  "plan": "pro",
  "status": "active"
}
```

## 🐛 故障排查

### 问题: 访问 Pro 路由返回 401
**解决方案:**
- 确保提供了 Bearer token
- 检查 token 格式是否正确（`Authorization: Bearer <token>`）
- 检查 token 是否过期

### 问题: 访问 Pro 路由返回 403
**解决方案:**
- 用户没有 Pro 订阅
- 检查数据库中的 subscription 记录
- 确保 plan_id 指向 Pro plan
- 确保 status 为 "active"

### 问题: Token 验证失败
**解决方案:**
- 检查 `.env` 中的 `JWT_SECRET_KEY` 是否正确
- 检查 `JWT_EXPIRE_MINUTES` 是否足够大（至少 60）
- 检查 token 的 `sub` 字段是否为字符串

### 问题: 无法注册用户
**解决方案:**
- 检查邮箱是否已被注册
- 检查邮箱格式是否正确
- 检查数据库连接是否正常

## ✨ 完成标志

当以下条件都满足时，第 3 阶段完成：

- [x] 所有代码修改已应用
- [x] 语法检查通过
- [x] 服务器能正常启动
- [x] `/health` 端点返回 200
- [x] `/docs` Swagger UI 可访问
- [x] `require_pro_subscription` 依赖正常工作
- [x] `/practice/star-light-home` 路由正常工作
- [x] Free 用户无法访问 Pro 路由（403）
- [x] Pro 用户可以访问 Pro 路由（200）
- [x] 权限控制逻辑正确
- [x] 自动化测试脚本通过
- [x] 所有新增端点在 Swagger UI 中可见

## 📝 备注

- 当前使用 SQLite 数据库，生产环境建议改为 PostgreSQL
- 密码使用简单 SHA256，生产环境建议改为 bcrypt
- JWT secret key 使用默认值，生产环境必须改为强密钥
- 所有时间戳使用 UTC，前端需要自行转换为本地时区

## 🎉 下一步

第 3 阶段完成后，可以进入第 4 阶段：
- 完成 Paddle 支付集成
- 实现自动升级用户订阅
- 添加订阅管理接口
- 实现订阅过期检查
- 为不同产品创建受保护路由

## 📚 相关文件

- `PHASE_3_GUIDE.md` - 详细使用指南
- `PHASE_3_SUMMARY.md` - 完整总结
- `PHASE_3_FINAL_SUMMARY.md` - 最终总结
- `test_pro_route.py` - 自动化测试脚本
- `PHASE_3_CHECKLIST.md` - 本文件
