# Tutorbox 后端架构分析 – Admin Billing 相关代码

**分析日期**: 2026-03-20  
**分析范围**: Admin Billing 后端实现方式

---

## 结论

### ✅ Admin 后端是 **Next.js App Router Route Handlers**

Tutorbox 项目的 admin billing 后端完全基于 **Next.js App Router** 的 Route Handlers 实现，**没有独立的 Node/Express/Nest 或 Python/FastAPI 后端**。

---

## 证据

### 1. 文件结构确认

所有 admin billing API 都位于 Next.js App Router 标准路径：

```
src/app/api/admin/billing/
├── search/
│   └── route.ts                    # GET /api/admin/billing/search
├── user/
│   └── [userId]/
│       └── route.ts                # GET /api/admin/billing/user/[userId]
└── api-keys/
    ├── revoke/
    │   └── route.ts                # POST /api/admin/billing/api-keys/revoke
    └── rotate/
        └── route.ts                # POST /api/admin/billing/api-keys/rotate
```

### 2. Route Handler 实现方式确认

所有文件都使用 **Next.js App Router 标准的 `export async function GET/POST`** 写法：

```typescript
// src/app/api/admin/billing/search/route.ts
export async function GET(req: Request) {
  if (!checkAdminAuth()) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ... 业务逻辑
}

// src/app/api/admin/billing/api-keys/revoke/route.ts
export async function POST(req: Request) {
  if (!checkAdminAuth()) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ... 业务逻辑
}

// src/app/api/admin/billing/user/[userId]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  if (!checkAdminAuth()) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ... 业务逻辑
}
```

### 3. 无独立后端框架

搜索结果确认：
- ❌ 无 `server.ts` / `index.ts` 文件
- ❌ 无 Express/Nest/Fastify 导入
- ❌ 无 `main.py` / `app.py` 或 FastAPI/Flask 代码
- ✅ 所有 API 都是 Next.js Route Handlers

---

## 关键后端文件列表（用于添加 License 中间件）

以下是 5 个关键的 admin billing 后端文件，可在这些文件中添加 license 中间件：

### 1. **搜索用户 API**
```
src/app/api/admin/billing/search/route.ts
```
- **功能**: 按邮箱或 userId 搜索用户
- **方法**: GET
- **路由**: `/api/admin/billing/search?q=<query>`
- **认证**: `checkAdminAuth()`

### 2. **获取用户详情 API**
```
src/app/api/admin/billing/user/[userId]/route.ts
```
- **功能**: 获取用户的订阅和 API 密钥信息
- **方法**: GET
- **路由**: `/api/admin/billing/user/[userId]`
- **认证**: `checkAdminAuth()`
- **动态参数**: `userId`

### 3. **撤销 API 密钥**
```
src/app/api/admin/billing/api-keys/revoke/route.ts
```
- **功能**: 标记 API 密钥为已撤销（不可用）
- **方法**: POST
- **路由**: `/api/admin/billing/api-keys/revoke`
- **认证**: `checkAdminAuth()`
- **请求体**: `{ apiKeyId: number }`

### 4. **轮换 API 密钥**
```
src/app/api/admin/billing/api-keys/rotate/route.ts
```
- **功能**: 创建新密钥，撤销旧密钥
- **方法**: POST
- **路由**: `/api/admin/billing/api-keys/rotate`
- **认证**: `checkAdminAuth()`
- **请求体**: `{ apiKeyId: number }`
- **返回**: 包含 `newPlainKey`（仅此响应中返回，不记录）

### 5. **用户自助 API（可选）**
```
src/app/api/me/api-keys/rotate/route.ts
```
- **功能**: 用户轮换自己的 API 密钥
- **方法**: POST
- **路由**: `/api/me/api-keys/rotate`
- **认证**: `getServerSession(authConfig)`
- **请求体**: `{ apiKeyId: string }`

---

## 添加 License 中间件的建议

由于所有 API 都是 Next.js Route Handlers，添加 license 中间件有以下几种方式：

### 方式 1: 在每个 route handler 中添加（最直接）

```typescript
// src/app/api/admin/billing/search/route.ts
import { checkLicense } from "@/lib/license-middleware";

export async function GET(req: Request) {
  // 检查 license
  const licenseCheck = await checkLicense();
  if (!licenseCheck.valid) {
    return new Response("License invalid", { status: 403 });
  }

  if (!checkAdminAuth()) {
    return new Response("Unauthorized", { status: 401 });
  }
  // ... 业务逻辑
}
```

### 方式 2: 创建通用 wrapper 函数（推荐）

```typescript
// src/lib/admin-api-wrapper.ts
export async function withAdminLicense(
  handler: (req: Request, params?: any) => Promise<Response>
) {
  return async (req: Request, params?: any) => {
    // 检查 license
    const licenseCheck = await checkLicense();
    if (!licenseCheck.valid) {
      return new Response("License invalid", { status: 403 });
    }

    // 检查 admin 权限
    if (!checkAdminAuth()) {
      return new Response("Unauthorized", { status: 401 });
    }

    return handler(req, params);
  };
}
```

然后在每个 route 中使用：

```typescript
// src/app/api/admin/billing/search/route.ts
export const GET = withAdminLicense(async (req: Request) => {
  // ... 业务逻辑
});
```

### 方式 3: 使用 Next.js 中间件（全局）

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/admin/billing")) {
    // 检查 license
    const licenseValid = checkLicense();
    if (!licenseValid) {
      return new Response("License invalid", { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/billing/:path*"],
};
```

---

## 架构总结

| 特性 | 值 |
|------|-----|
| **后端框架** | Next.js App Router (Route Handlers) |
| **API 路由前缀** | `/api/admin/billing/` |
| **认证方式** | `checkAdminAuth()` 函数 |
| **数据库** | Drizzle ORM (src/db/schema.ts) |
| **日志系统** | 自定义 `src/lib/billing/logger.ts` |
| **API 数量** | 4 个 admin billing APIs + 3 个用户自助 APIs |
| **是否有独立后端** | ❌ 否，完全集成在 Next.js 中 |

---

## 快速参考

### 所有 Admin Billing Route Handlers

```bash
# 搜索用户
GET /api/admin/billing/search?q=<query>
→ src/app/api/admin/billing/search/route.ts

# 获取用户详情
GET /api/admin/billing/user/[userId]
→ src/app/api/admin/billing/user/[userId]/route.ts

# 撤销 API 密钥
POST /api/admin/billing/api-keys/revoke
→ src/app/api/admin/billing/api-keys/revoke/route.ts

# 轮换 API 密钥
POST /api/admin/billing/api-keys/rotate
→ src/app/api/admin/billing/api-keys/rotate/route.ts
```

### 所有用户自助 Route Handlers

```bash
# 获取用户订阅信息
GET /api/me/billing
→ src/app/api/me/billing/route.ts

# 获取用户 API 密钥
GET /api/me/api-keys
→ src/app/api/me/api-keys/route.ts

# 用户轮换自己的密钥
POST /api/me/api-keys/rotate
→ src/app/api/me/api-keys/rotate/route.ts
```

---

## 结论

**Admin 后端完全是 Next.js App Router Route Handlers 实现**，无需考虑其他框架。在添加 license 中间件时，建议使用 **方式 2（wrapper 函数）** 或 **方式 3（Next.js 中间件）**，以保持代码的 DRY 原则。
