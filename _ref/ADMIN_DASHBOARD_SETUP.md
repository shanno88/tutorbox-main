# Admin Dashboard Setup

## 概述

Tutorbox 现在包含一个简单的 admin 后台，用于管理用户、API Keys 和 Plans。

## 访问 Admin 后台

### 开发环境

在开发环境中，admin 后台默认可访问（无需鉴权）：

```
http://localhost:3000/admin
```

### 生产环境

在生产环境中，需要设置 `ADMIN_SECRET` 环境变量：

```bash
# .env.local 或 .env.production
ADMIN_SECRET=your-secret-admin-token
```

然后在请求时传递 token：

```bash
# 使用 curl
curl -H "Authorization: Bearer your-secret-admin-token" \
  https://tutorbox.cc/admin

# 或在浏览器中，使用 JavaScript 设置 localStorage
localStorage.setItem('adminToken', 'your-secret-admin-token');
```

## 功能

### 1. Users (`/admin/users`)

查看所有用户及其 trial/subscription 状态：

- **ID**: 用户 ID（显示前 8 个字符）
- **Email**: 用户邮箱
- **Trial Status**: Trial 状态（产品、有效期等）
- **Paid Status**: 付费订阅状态
- **Created At**: 用户创建时间

### 2. API Keys (`/admin/api-keys`)

管理 API Keys，支持启用/禁用：

- **Key (Masked)**: API Key 哈希值（显示前 4 个和后 4 个字符）
- **User ID**: 所有者用户 ID
- **Plan**: 关联的 Plan
- **Status**: 当前状态（Active/Revoked/Expired）
- **Expires At**: 过期时间
- **Created At**: 创建时间
- **Action**: 切换 Active/Revoked 状态

#### 修改 API Key 状态

点击 "Revoke" 或 "Activate" 按钮来切换 API Key 的状态。

**API 端点**:
```
POST /api/admin/api-keys/toggle-status
```

**请求体**:
```json
{
  "keyId": 123,
  "newStatus": "revoked"  // 或 "active"
}
```

**鉴权**: 需要 `Authorization: Bearer <ADMIN_SECRET>` 头

### 3. Plans (`/admin/plans`)

查看所有 Plans 及其限流/配额设置（只读）：

- **ID**: Plan ID
- **Slug**: Plan 标识符
- **Name**: Plan 名称
- **Rate Limit (per min)**: 每分钟请求限制
- **Quota (per month)**: 每月请求配额
- **Created At**: 创建时间

## 鉴权机制

### 开发环境

- 如果未设置 `ADMIN_SECRET`，admin 路由在开发环境中自动允许访问
- 生产环境中必须设置 `ADMIN_SECRET`

### 生产环境

- 所有 admin 路由都需要有效的 `ADMIN_SECRET`
- 通过 `Authorization: Bearer <token>` 头传递 token
- 如果 token 无效或缺失，返回 401 Unauthorized

### 实现细节

鉴权逻辑在 `src/lib/admin-auth.ts` 中：

```typescript
export function checkAdminAuth(): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret) {
    // 开发环境允许，生产环境拒绝
    return process.env.NODE_ENV === "development";
  }

  // 检查请求头中的 token
  const headersList = headers();
  const authHeader = headersList.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  return token === adminSecret;
}
```

## 使用示例

### 查看所有用户

```bash
curl http://localhost:3000/admin/users
```

### 查看所有 API Keys

```bash
curl http://localhost:3000/admin/api-keys
```

### 查看所有 Plans

```bash
curl http://localhost:3000/admin/plans
```

### 修改 API Key 状态（生产环境）

```bash
curl -X POST https://tutorbox.cc/api/admin/api-keys/toggle-status \
  -H "Authorization: Bearer your-secret-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "keyId": 123,
    "newStatus": "revoked"
  }'
```

## 文件结构

```
src/app/admin/
├── layout.tsx                    # Admin 布局（包含导航）
├── page.tsx                      # Admin 首页
├── users/
│   └── page.tsx                  # 用户列表
├── api-keys/
│   ├── page.tsx                  # API Keys 列表
│   └── toggle-status.tsx         # 切换状态的客户端组件
└── plans/
    └── page.tsx                  # Plans 列表

src/app/api/admin/
└── api-keys/
    └── toggle-status/
        └── route.ts              # 修改 API Key 状态的 API 路由

src/lib/
└── admin-auth.ts                 # Admin 鉴权工具函数
```

## 安全考虑

1. **路由保护**: 所有 admin 路由都通过 `layout.tsx` 中的 `checkAdminAuth()` 保护
2. **API 保护**: API 路由也检查 `ADMIN_SECRET`
3. **环境变量**: 在生产环境中必须设置强密码的 `ADMIN_SECRET`
4. **日志**: 所有 admin 操作都应该被记录（可选）
5. **HTTPS**: 在生产环境中必须使用 HTTPS

## 扩展功能

未来可以添加的功能：

- [ ] 用户搜索/过滤
- [ ] API Key 搜索/过滤
- [ ] 批量操作
- [ ] 操作日志
- [ ] 用户详情页面
- [ ] API Key 创建/删除
- [ ] Plan 编辑
- [ ] 导出数据

## 故障排除

### 无法访问 admin 页面

**开发环境**:
- 确保 `npm run dev` 正在运行
- 检查 URL 是否正确：`http://localhost:3000/admin`

**生产环境**:
- 检查 `ADMIN_SECRET` 是否设置
- 检查 `Authorization` 头是否正确
- 确保 token 与 `ADMIN_SECRET` 匹配

### API Key 状态修改失败

- 检查 `ADMIN_SECRET` 是否正确
- 检查 `Authorization` 头格式：`Bearer <token>`
- 检查 `keyId` 是否有效
- 检查 `newStatus` 是否为 "active" 或 "revoked"

## 相关文档

- `AUTH_RATE_LIMIT_QUOTA_IMPLEMENTATION.md` - 限流/配额系统
- `docs/RATE_LIMIT_AND_QUOTA.md` - 完整的限流/配额文档

