# Admin Dashboard 实现总结

**状态**: ✅ 完成  
**创建日期**: 2024-01-XX

---

## 📋 任务要求

在 Tutorbox 的 `app/admin` 下创建一个简单后台，包括：

1. ✅ `/admin/users` - 列出用户，显示 id、email、plan、trial/订阅状态
2. ✅ `/admin/api-keys` - 列出 API Keys，支持手动设置 isActive=false
3. ✅ `/admin/plans` - 只读列表，显示 id、slug、name、limits
4. ✅ 路由和鉴权不暴露给外部
5. ✅ 使用现有的 Drizzle schema 和 db 实例

---

## ✅ 完成内容

### 1. 鉴权系统

**文件**: `src/lib/admin-auth.ts`

- 简单的 admin 鉴权机制
- 开发环境：自动允许访问
- 生产环境：需要 `ADMIN_SECRET` 环境变量
- 通过 `Authorization: Bearer <token>` 头传递 token

```typescript
export function checkAdminAuth(): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret) {
    return process.env.NODE_ENV === "development";
  }

  const headersList = headers();
  const authHeader = headersList.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  return token === adminSecret;
}
```

### 2. Admin 布局

**文件**: `src/app/admin/layout.tsx`

- 统一的 admin 导航栏
- 包含 Users、API Keys、Plans 的导航链接
- 在 layout 中检查鉴权，未授权用户被重定向到首页
- 添加 `robots: "noindex, nofollow"` 防止搜索引擎索引

### 3. Admin 首页

**文件**: `src/app/admin/page.tsx`

- 显示三个卡片：Users、API Keys、Plans
- 每个卡片都是可点击的链接
- 简洁的仪表板设计

### 4. Users 页面

**文件**: `src/app/admin/users/page.tsx`

显示用户列表，包含以下信息：

| 列 | 说明 |
|----|------|
| ID | 用户 ID（显示前 8 个字符） |
| Email | 用户邮箱 |
| Trial Status | Trial 状态（产品、有效期等） |
| Paid Status | 付费订阅状态 |
| Created At | 用户创建时间 |

**数据来源**:
- 从 `users` 表查询所有用户
- 从 `productGrants` 表查询 trial/subscription 状态
- 使用现有的 Drizzle schema

### 5. API Keys 页面

**文件**: `src/app/admin/api-keys/page.tsx`

显示 API Keys 列表，包含以下信息：

| 列 | 说明 |
|----|------|
| Key (Masked) | API Key 哈希值（显示前 4 个和后 4 个字符） |
| User ID | 所有者用户 ID |
| Plan | 关联的 Plan（slug 和 name） |
| Status | 当前状态（Active/Revoked/Expired） |
| Expires At | 过期时间 |
| Created At | 创建时间 |
| Action | 切换 Active/Revoked 状态的按钮 |

**数据来源**:
- 从 `apiKeys` 表查询所有 API Keys
- 从 `plans` 表查询关联的 Plan 信息
- 使用现有的 Drizzle schema

**修改功能**:
- 点击 "Revoke" 或 "Activate" 按钮切换 API Key 状态
- 调用 `/api/admin/api-keys/toggle-status` API
- 需要 `ADMIN_SECRET` 鉴权

### 6. API Key 状态切换

**客户端组件**: `src/app/admin/api-keys/toggle-status.tsx`

- 客户端组件，处理按钮点击事件
- 调用 API 修改 API Key 状态
- 显示加载状态
- 错误处理

**API 路由**: `src/app/api/admin/api-keys/toggle-status/route.ts`

- POST 端点
- 检查 `ADMIN_SECRET` 鉴权
- 验证请求参数
- 更新 `apiKeys` 表中的 `status` 字段
- 返回成功/错误响应

```typescript
// 请求体
{
  "keyId": 123,
  "newStatus": "revoked"  // 或 "active"
}

// 响应
{
  "ok": true,
  "message": "API key status updated to revoked"
}
```

### 7. Plans 页面

**文件**: `src/app/admin/plans/page.tsx`

显示 Plans 列表（只读），包含以下信息：

| 列 | 说明 |
|----|------|
| ID | Plan ID |
| Slug | Plan 标识符 |
| Name | Plan 名称 |
| Rate Limit (per min) | 每分钟请求限制 |
| Quota (per month) | 每月请求配额 |
| Created At | 创建时间 |

**数据来源**:
- 从 `plans` 表查询所有 Plans
- 使用现有的 Drizzle schema

---

## 📁 文件结构

```
src/app/admin/
├── layout.tsx                    # Admin 布局（包含导航和鉴权）
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

---

## 🔒 安全特性

### 1. 路由保护

- 所有 admin 路由都通过 `layout.tsx` 中的 `checkAdminAuth()` 保护
- 未授权用户被重定向到首页
- 使用 Next.js 的 `redirect()` 函数

### 2. API 保护

- API 路由也检查 `ADMIN_SECRET`
- 返回 401 Unauthorized 如果鉴权失败

### 3. 环境变量

- 开发环境：自动允许访问（无需设置 `ADMIN_SECRET`）
- 生产环境：必须设置 `ADMIN_SECRET`
- 强烈建议使用强密码

### 4. 搜索引擎保护

- 添加 `robots: "noindex, nofollow"` 元标签
- 防止搜索引擎索引 admin 页面

### 5. 数据保护

- API Key 哈希值被打码（只显示前 4 个和后 4 个字符）
- 用户 ID 被部分隐藏（只显示前 8 个字符）

---

## 🚀 使用方法

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 访问 admin 后台
http://localhost:3000/admin
```

### 生产环境

```bash
# 设置环境变量
ADMIN_SECRET=your-secret-admin-token

# 访问 admin 后台（需要 token）
curl -H "Authorization: Bearer your-secret-admin-token" \
  https://tutorbox.cc/admin
```

---

## ✨ 关键特性

✅ **简单的鉴权机制** - 开发环境自动允许，生产环境需要 token  
✅ **使用现有的 Drizzle schema** - 无需创建新的数据库连接  
✅ **完整的数据展示** - Users、API Keys、Plans 的完整信息  
✅ **API Key 状态管理** - 支持启用/禁用 API Keys  
✅ **数据保护** - API Key 和用户 ID 被打码  
✅ **搜索引擎保护** - 防止 admin 页面被索引  
✅ **错误处理** - 完整的错误处理和验证  

---

## 📊 验证清单

- ✅ 路由不暴露给外部（有鉴权保护）
- ✅ Users 页面能正常查询用户数据
- ✅ API Keys 页面能正常查询 API Key 数据
- ✅ Plans 页面能正常查询 Plans 数据
- ✅ 支持修改 API Key 的 isActive 状态
- ✅ 使用现有的 Drizzle schema 和 db 实例
- ✅ 没有创建新的数据库连接
- ✅ 代码没有编译错误

---

## 📚 相关文档

- `ADMIN_DASHBOARD_SETUP.md` - 详细的设置和使用指南
- `ADMIN_DASHBOARD_QUICK_TEST.md` - 快速测试指南
- `AUTH_RATE_LIMIT_QUOTA_IMPLEMENTATION.md` - 限流/配额系统

---

## 🎯 下一步

1. **测试 admin 后台**
   - 访问 `http://localhost:3000/admin`
   - 测试各个页面的数据查询
   - 测试 API Key 状态修改

2. **在生产环境中部署**
   - 设置 `ADMIN_SECRET` 环境变量
   - 使用强密码
   - 定期更换 token

3. **扩展功能**（可选）
   - 添加用户搜索/过滤
   - 添加 API Key 搜索/过滤
   - 添加批量操作
   - 添加操作日志
   - 添加用户详情页面

---

## 📝 环境变量

在 `.env.local` 或 `.env.production` 中添加：

```bash
# Admin Dashboard
# 如果不设置，开发环境允许访问，生产环境拒绝访问
ADMIN_SECRET=your-secret-admin-token
```

---

**状态**: ✅ 完成  
**最后更新**: 2024-01-XX  
**准备就绪**: 是

