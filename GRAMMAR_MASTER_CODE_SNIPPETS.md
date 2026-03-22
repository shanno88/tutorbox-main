# Grammar Master - 关键代码片段

## 问题代码位置

### 文件: `src/app/[locale]/grammar-master/page.tsx`

---

## 代码片段 1: Session 获取

**位置**: 第 8-9 行

```typescript
const { data: session } = useSession();
const router = useRouter();
```

**问题**:
- ❌ 只解构了 `data`，没有获取 `status`
- ❌ 无法区分 "loading" 和 "unauthenticated"

**依赖的状态**:
- `session` (来自 `useSession()`)
- 缺少: `status`

---

## 代码片段 2: 开始试用按钮处理

**位置**: 第 22-25 行

```typescript
const handleStartTrial = async () => {
  if (!session?.user?.id || !session?.user?.email) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    await trial.startTrial();
    // Trial started successfully, page will show remaining days
  } catch (err) {
    console.error("Failed to start trial:", err);
    setError("Failed to start trial. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
```

**问题**:
- ❌ 当 `session === undefined` 时重定向到登录页面
- ❌ 但 `session === undefined` 可能是因为 `status === "loading"`，而不是真的未登录
- ❌ 没有检查 `status`

**依赖的状态**:
- `session` (来自 `useSession()`)
- `locale`
- 缺少: `status`

---

## 代码片段 3: 开始试用按钮 UI

**位置**: 第 95-105 行

```typescript
<button
  onClick={handleStartTrial}
  disabled={isLoading}
  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
>
  {isLoading
    ? isZh
      ? "处理中..."
      : "Processing..."
    : isZh
    ? "开始 7 天免费试用"
    : "Start 7-day free trial"}
</button>
```

**问题**:
- ❌ 只检查 `isLoading`，没有检查 `status === "loading"`
- ❌ 当 session 正在加载时，按钮仍然可点击

**依赖的状态**:
- `isLoading` (本地状态)
- `isZh`
- 缺少: `status`

---

## 代码片段 4: 登录提示文本

**位置**: 第 143-150 行

```typescript
<p className="text-xs text-muted-foreground mt-6">
  {!session?.user
    ? isZh
      ? "登录后开始使用"
      : "Sign in to get started"
    : isZh
    ? "包含 7 天免费试用，无需订阅。"
    : "7-day free trial included. No subscription required."}
</p>
```

**问题**:
- ❌ 当 `session === undefined` 时显示"登录后开始使用"
- ❌ 但这可能是因为 `status === "loading"`，而不是真的未登录
- ❌ 没有显示加载状态

**依赖的状态**:
- `session` (来自 `useSession()`)
- `isZh`
- 缺少: `status`

**当前逻辑**:
```
if (!session?.user) {
  显示 "登录后开始使用"
} else {
  显示 "包含 7 天免费试用..."
}
```

**问题**: 没有第三种情况处理 `status === "loading"`

---

## 状态流转表

| 时刻 | `session` | `status` | 当前显示 | 问题 |
|------|-----------|----------|--------|------|
| 页面初始加载 | `undefined` | `"loading"` | "登录后开始使用" | ❌ 应显示加载状态 |
| Session 加载完成（已登录） | `{ user: {...} }` | `"authenticated"` | "包含 7 天免费试用..." | ✅ 正确 |
| Session 加载完成（未登录） | `undefined` | `"unauthenticated"` | "登录后开始使用" | ✅ 正确 |

---

## 完整的 useSession() 返回值

```typescript
const { data, status, update } = useSession();

// data: Session | null | undefined
// status: "loading" | "authenticated" | "unauthenticated"
// update: (data?: any) => Promise<Session | null>
```

**当前代码只使用了**:
```typescript
const { data: session } = useSession();
// 缺少 status
```

---

## 问题根源

### 时间线

```
1. 页面初始加载 (SSR)
   ↓
   useSession() 返回 { data: undefined, status: "loading" }
   ↓
   session === undefined
   ↓
   显示 "登录后开始使用"
   ↓
   ❌ 用户看到登录提示，即使他们已登录

2. 客户端 Hydration
   ↓
   NextAuth 检查 cookie
   ↓
   如果已登录，useSession() 更新为 { data: { user: {...} }, status: "authenticated" }
   ↓
   页面重新渲染
   ↓
   显示 "包含 7 天免费试用..."
   ↓
   ✅ 现在显示正确的内容

但用户已经看到了"登录后开始使用"，造成"页面有健忘症"的感觉
```

---

## 修复建议（最小改动）

### 步骤 1: 获取 `status`

```typescript
// 当前
const { data: session } = useSession();

// 修改为
const { data: session, status } = useSession();
```

### 步骤 2: 在显示登录提示时检查 `status`

```typescript
// 当前
{!session?.user
  ? isZh
    ? "登录后开始使用"
    : "Sign in to get started"
  : isZh
  ? "包含 7 天免费试用，无需订阅。"
  : "7-day free trial included. No subscription required."}

// 修改为
{status === "loading"
  ? isZh
    ? "加载中..."
    : "Loading..."
  : !session?.user
  ? isZh
    ? "登录后开始使用"
    : "Sign in to get started"
  : isZh
  ? "包含 7 天免费试用，无需订阅。"
  : "7-day free trial included. No subscription required."}
```

### 步骤 3: 在按钮处理中检查 `status`

```typescript
// 当前
const handleStartTrial = async () => {
  if (!session?.user?.id || !session?.user?.email) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  // ...
};

// 修改为
const handleStartTrial = async () => {
  if (status === "loading") {
    return; // 等待 session 加载
  }
  if (!session?.user?.id || !session?.user?.email) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  // ...
};
```

### 步骤 4: 在按钮 UI 中检查 `status`

```typescript
// 当前
<button
  onClick={handleStartTrial}
  disabled={isLoading}
  className="..."
>
  {isLoading ? "处理中..." : "开始 7 天免费试用"}
</button>

// 修改为
<button
  onClick={handleStartTrial}
  disabled={isLoading || status === "loading"}
  className="..."
>
  {status === "loading"
    ? isZh ? "加载中..." : "Loading..."
    : isLoading
    ? isZh ? "处理中..." : "Processing..."
    : isZh ? "开始 7 天免费试用" : "Start 7-day free trial"}
</button>
```

---

## 总结

**问题**: 页面没有区分 `status === "loading"` 和 `status === "unauthenticated"`

**表现**: 已登录用户看到"登录后开始使用"的提示

**根本原因**: `useSession()` 在 SSR 阶段返回 `undefined`，页面没有等待 session 加载完成

**修复**: 添加 `status` 检查，在 loading 时显示加载状态

**改动范围**: 最小化，只需在 4 个地方添加 `status` 检查

