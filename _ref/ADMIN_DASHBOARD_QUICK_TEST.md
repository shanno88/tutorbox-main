# Admin Dashboard 快速测试指南

## 快速开始

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 访问 Admin 后台

在浏览器中打开：
```
http://localhost:3000/admin
```

你应该看到 Admin Dashboard 首页，包含三个卡片：
- Users
- API Keys
- Plans

## 测试各个页面

### 测试 Users 页面

1. 点击 "Users" 卡片或导航栏中的 "Users"
2. 应该看到用户列表，包含以下列：
   - ID（前 8 个字符）
   - Email
   - Trial Status
   - Paid Status
   - Created At

**预期结果**:
- 如果有用户，应该显示用户列表
- 如果没有用户，应该显示 "No users found"

### 测试 API Keys 页面

1. 点击 "API Keys" 卡片或导航栏中的 "API Keys"
2. 应该看到 API Keys 列表，包含以下列：
   - Key (Masked) - 显示前 4 个和后 4 个字符
   - User ID
   - Plan
   - Status - 显示绿色（Active）或红色（Revoked/Expired）
   - Expires At
   - Created At
   - Action - "Revoke" 或 "Activate" 按钮

**预期结果**:
- 如果有 API Keys，应该显示列表
- 如果没有 API Keys，应该显示 "No API keys found"

#### 测试修改 API Key 状态

1. 在 API Keys 列表中找到一个 Active 的 API Key
2. 点击 "Revoke" 按钮
3. 按钮应该变成 "Updating..."
4. 几秒后，按钮应该变成 "Activate"，状态应该变成 Revoked

**预期结果**:
- API Key 状态从 Active 变成 Revoked
- 按钮文本从 "Revoke" 变成 "Activate"
- 状态指示器从绿色变成红色

### 测试 Plans 页面

1. 点击 "Plans" 卡片或导航栏中的 "Plans"
2. 应该看到 Plans 列表，包含以下列：
   - ID
   - Slug
   - Name
   - Rate Limit (per min)
   - Quota (per month)
   - Created At

**预期结果**:
- 应该显示所有 Plans
- 每个 Plan 的限流和配额应该正确显示

## 测试鉴权

### 开发环境

在开发环境中，admin 后台应该自动允许访问（无需鉴权）。

### 生产环境模拟

1. 在 `.env.local` 中设置 `ADMIN_SECRET`：
   ```
   ADMIN_SECRET=test-secret-token
   ```

2. 重启开发服务器

3. 尝试访问 `/admin`，应该被重定向到首页（因为没有有效的 token）

4. 使用 curl 测试 API：
   ```bash
   # 没有 token - 应该返回 401
   curl -X POST http://localhost:3000/api/admin/api-keys/toggle-status \
     -H "Content-Type: application/json" \
     -d '{"keyId": 1, "newStatus": "revoked"}'
   
   # 有效的 token - 应该成功
   curl -X POST http://localhost:3000/api/admin/api-keys/toggle-status \
     -H "Authorization: Bearer test-secret-token" \
     -H "Content-Type: application/json" \
     -d '{"keyId": 1, "newStatus": "revoked"}'
   ```

## 测试数据库查询

### 验证 Users 页面查询

```sql
-- 查看所有用户
SELECT id, email, "emailVerified" FROM "user" LIMIT 10;

-- 查看用户的 trial/subscription 状态
SELECT * FROM product_grant WHERE type IN ('trial', 'paid') LIMIT 10;
```

### 验证 API Keys 页面查询

```sql
-- 查看所有 API Keys
SELECT 
  api_keys.id,
  api_keys.user_id,
  api_keys.key_hash,
  api_keys.status,
  api_keys.expires_at,
  plans.slug,
  plans.name
FROM api_keys
JOIN plans ON api_keys.plan_id = plans.id
LIMIT 10;
```

### 验证 Plans 页面查询

```sql
-- 查看所有 Plans
SELECT id, slug, name, rate_limit_per_min, quota_per_month FROM plans;
```

## 测试修改 API Key 状态

### 使用浏览器

1. 打开 `/admin/api-keys`
2. 找到一个 Active 的 API Key
3. 点击 "Revoke" 按钮
4. 检查数据库：
   ```sql
   SELECT id, status FROM api_keys WHERE id = <keyId>;
   ```
   应该显示 `status = 'revoked'`

### 使用 curl

```bash
# 获取一个 API Key 的 ID
curl http://localhost:3000/admin/api-keys

# 修改状态
curl -X POST http://localhost:3000/api/admin/api-keys/toggle-status \
  -H "Content-Type: application/json" \
  -d '{"keyId": 1, "newStatus": "revoked"}'

# 验证修改
curl http://localhost:3000/admin/api-keys
```

## 常见问题

### Q: 访问 /admin 时被重定向到首页

**A**: 这是正常的，说明鉴权生效了。检查：
1. 是否设置了 `ADMIN_SECRET`
2. 是否在生产环境中
3. 是否传递了正确的 token

### Q: API Key 状态修改失败

**A**: 检查以下几点：
1. 是否设置了 `ADMIN_SECRET`
2. 是否传递了正确的 `Authorization` 头
3. `keyId` 是否有效
4. `newStatus` 是否为 "active" 或 "revoked"

### Q: 看不到任何数据

**A**: 检查以下几点：
1. 数据库是否正确连接
2. 是否有测试数据
3. 检查浏览器控制台是否有错误

## 下一步

1. 在生产环境中设置 `ADMIN_SECRET`
2. 添加操作日志
3. 添加用户搜索/过滤功能
4. 添加批量操作功能

