# Grammar Master 登录状态修复计划

## 目标
用户邮箱登录成功后，全站认为已登录。Grammar Master 页只在「真的未登录」时才提示去登录；已登录用户进来直接看到试用按钮。

---

## 排查结果

### 问题 1️⃣: useSession() 只用了 data，没有用 status

**位置**: 第 11 行

```typescript
const { data: session } = useSession();
```

**当前状态依赖**:
- ✅ `session` (来自 `useSession().data`)
- ❌ **缺少**: `status` (来自 `useSession().status`)

**问题**:
- 无法区分 `status === "loading"` 和 `status === "unauthenticated"`
- 当 session 正在加载时，`session === undefined`，页面会误认为用户未登录

---

### 问题 2️⃣: 决定是否跳转到登录页的逻辑

#### 逻辑 A: handleStartTrial 中的跳转

**位置**: 第 22-26 行

```typescript
const handleStartTrial = async () => {
  if (!session?.user?.id || !session?.user?.email) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  // ...
};
```

**当前状态依赖**:
- ✅ `session` (来自 `useSession().data`)
- ❌ **缺少**: `status`

**问题**:
- 当 `status === "loading"` 时，`session === undefined`
- 条件 `!session?.user?.id` 为 true
- 用户被错误地重定向到登录页面
- 用户看到"输入邮箱获取 magic link"的表单

**时间线**:
```
时刻 1: 用户点击"开始试用"按钮
  status = "loading"
  session = undefined
  ↓
  条件 !session?.user?.id 为 true
  ↓
  重定向到登录页面 ❌

时刻 2: 100ms 后，session 加载完成
  status = "authenticated"
  session = { user: { id: 123, email: "..." } }
  ↓
  但用户已经被重定向到登录页面了 ❌
```

#### 逻辑 B: handleBuy 中的跳转

**位置**: 第 42-46 行

```typescript
const handleBuy = async () => {
  if (!session?.user?.id) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  // ...
};
```

**当前状态依赖**:
- ✅ `session` (来自 `useSession().data`)
- ❌ **缺少**: `status`

**问题**: 同上，当 `status === "loading"` 时会错误重定向

---

### 问题 3️⃣: 控制登录提示文案的条件

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

**当前状态依赖**:
- ✅ `session` (来自 `useSession().data`)
- ✅ `isZh`
- ❌ **缺少**: `status`

**问题**:
- 当 `status === "loading"` 时，`session === undefined`
- 条件 `!session?.user` 为 true
- 显示"登录后开始使用" ❌
- 用户看到登录提示，即使他们已登录

**显示逻辑表**:
```
状态                    | session?.user | 显示内容              | 问题
------------------------|---------------|---------------------|------
status = "loading"      | undefined     | "登录后开始使用"     | ❌ 应显示"加载中..."
status = "authenticated"| { ... }       | "包含 7 天免费试用..." | ✅ 正确
status = "unauthenticated" | undefined | "登录后开始使用"     | ✅ 正确
```

---

## 完整的问题流程

### 已登录用户访问 Grammar Master 页面

```
1. 用户已登录，访问 /zh/grammar-master
   ↓
2. 页面初始加载 (SSR)
   useSession() → { data: undefined, status: "loading" }
   ↓
3. 页面渲染
   session === undefined
   ↓
4. 显示登录提示
   "登录后开始使用" ❌
   ↓
5. 用户看到登录提示，感到困惑
   ↓
6. 100ms 后，客户端 Hydration
   NextAuth 检查 cookie
   useSession() → { data: { user: {...} }, status: "authenticated" }
   ↓
7. 页面重新渲染
   session !== undefined
   ↓
8. 显示试用选项
   "包含 7 天免费试用..." ✅
   ↓
9. 用户看到正确的内容，但已经看过"登录后开始使用"
   感觉"页面有健忘症" ❌
```

---

## 最小改动方案思路

### 核心思路

**只修改登录状态判断逻辑，不动 Trial/JWT 相关逻辑**

### 改动方案

#### 改动 1: 获取 status

**位置**: 第 11 行

```typescript
// 当前
const { data: session } = useSession();

// 改为
const { data: session, status } = useSession();
```

**说明**: 解构出 `status` 字段，用于区分 loading 和 unauthenticated

---

#### 改动 2: handleStartTrial 中的跳转逻辑

**位置**: 第 22-26 行

```typescript
// 当前
const handleStartTrial = async () => {
  if (!session?.user?.id || !session?.user?.email) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  // ...
};

// 改为
const handleStartTrial = async () => {
  // 只有在真的未登录时才跳转，loading 时不做任何操作
  if (status === "unauthenticated") {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  
  // loading 时等待，authenticated 时继续
  if (status !== "authenticated") {
    return;
  }
  
  if (!session?.user?.id || !session?.user?.email) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  // ...
};
```

**说明**:
- 只有 `status === "unauthenticated"` 时才跳转到登录页
- `status === "loading"` 时不做任何操作（等待加载）
- `status === "authenticated"` 时继续执行

---

#### 改动 3: handleBuy 中的跳转逻辑

**位置**: 第 42-46 行

```typescript
// 当前
const handleBuy = async () => {
  if (!session?.user?.id) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  // ...
};

// 改为
const handleBuy = async () => {
  // 只有在真的未登录时才跳转，loading 时不做任何操作
  if (status === "unauthenticated") {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  
  // loading 时等待，authenticated 时继续
  if (status !== "authenticated") {
    return;
  }
  
  if (!session?.user?.id) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  // ...
};
```

**说明**: 同上

---

#### 改动 4: 登录提示文案的显示条件

**位置**: 第 143-150 行

```typescript
// 当前
<p className="text-xs text-muted-foreground mt-6">
  {!session?.user
    ? isZh
      ? "登录后开始使用"
      : "Sign in to get started"
    : isZh
    ? "包含 7 天免费试用，无需订阅。"
    : "7-day free trial included. No subscription required."}
</p>

// 改为
<p className="text-xs text-muted-foreground mt-6">
  {status === "loading"
    ? isZh
      ? "加载中..."
      : "Loading..."
    : status === "unauthenticated"
    ? isZh
      ? "登录后开始使用"
      : "Sign in to get started"
    : isZh
    ? "包含 7 天免费试用，无需订阅。"
    : "7-day free trial included. No subscription required."}
</p>
```

**说明**:
- `status === "loading"` 时显示"加载中..."
- `status === "unauthenticated"` 时显示"登录后开始使用"
- `status === "authenticated"` 时显示"包含 7 天免费试用..."

---

#### 改动 5: 按钮 disabled 状态（可选）

**位置**: 第 95-105 行

```typescript
// 当前
<button
  onClick={handleStartTrial}
  disabled={isLoading}
  className="..."
>
  {isLoading
    ? isZh ? "处理中..." : "Processing..."
    : isZh ? "开始 7 天免费试用" : "Start 7-day free trial"}
</button>

// 改为（可选，增强用户体验）
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

**说明**: 当 session 正在加载时禁用按钮，并显示"加载中..."

---

## 改动影响范围

### 修改的文件
- `src/app/[locale]/grammar-master/page.tsx` (1 个文件)

### 修改的行数
- 第 11 行: 1 行 (添加 status)
- 第 22-26 行: 改动 handleStartTrial (约 5-10 行)
- 第 42-46 行: 改动 handleBuy (约 5-10 行)
- 第 143-150 行: 改动登录提示 (约 5-10 行)
- 第 95-105 行: 改动按钮 UI (可选，约 5-10 行)

**总计**: 约 20-40 行改动

### 不修改的内容
- ✅ NextAuth 配置
- ✅ useSession() 的其他用法
- ✅ Trial 系统逻辑
- ✅ JWT 验证逻辑
- ✅ 支付/订阅逻辑
- ✅ 页面其他部分

---

## 修复后的行为

### 已登录用户
```
1. 访问 /zh/grammar-master
   ↓
2. 页面初始加载
   status = "loading"
   显示"加载中..." ✅
   ↓
3. 100ms 后，session 加载完成
   status = "authenticated"
   显示"包含 7 天免费试用..." ✅
   ↓
4. 用户直接看到试用按钮，无需再登录 ✅
```

### 未登录用户
```
1. 访问 /zh/grammar-master
   ↓
2. 页面初始加载
   status = "loading"
   显示"加载中..." ✅
   ↓
3. 100ms 后，session 加载完成
   status = "unauthenticated"
   显示"登录后开始使用" ✅
   ↓
4. 用户点击"开始试用"按钮
   ↓
5. 重定向到登录页面 ✅
```

---

## 验证方法

### 测试场景 1: 已登录用户
1. 登录账号
2. 访问 `/zh/grammar-master`
3. **预期**: 直接看到"开始 7 天免费试用"按钮，不看到"登录后开始使用"
4. **验证**: 页面不会重定向到登录页面

### 测试场景 2: 未登录用户
1. 清除 cookie 或使用无痕模式
2. 访问 `/zh/grammar-master`
3. **预期**: 看到"登录后开始使用"提示
4. **验证**: 点击"开始试用"按钮后重定向到登录页面

### 测试场景 3: 页面加载过程
1. 打开浏览器 DevTools → Network 标签
2. 登录账号
3. 访问 `/zh/grammar-master`
4. **预期**: 
   - 初始加载时显示"加载中..."
   - 100ms 后显示"开始 7 天免费试用"按钮
   - 不会重定向到登录页面

---

## 总结

| 项目 | 内容 |
|------|------|
| **问题根源** | useSession() 只用了 data，没有用 status，导致无法区分 loading 和 unauthenticated |
| **表现** | 已登录用户看到"登录后开始使用"的提示，感觉"页面有健忘症" |
| **修复方案** | 添加 status 检查，只有 status === "unauthenticated" 时才跳转到登录页 |
| **改动文件** | 1 个文件 (`src/app/[locale]/grammar-master/page.tsx`) |
| **改动行数** | 约 20-40 行 |
| **改动范围** | 只修改登录状态判断逻辑，不动 Trial/JWT 相关逻辑 |
| **风险等级** | 低 - 只是添加状态检查，不改变整体架构 |

---

## 下一步

1. ✅ 排查完成
2. ⏳ 等待你的确认和反馈
3. ⏳ 根据反馈调整改动方案
4. ⏳ 实施改动
5. ⏳ 测试验证

