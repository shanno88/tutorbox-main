# Grammar Master 登录状态修复 - 代码对比

## 改动 1: 获取 status

### 当前代码（第 11 行）
```typescript
const { data: session } = useSession();
```

### 改动后
```typescript
const { data: session, status } = useSession();
```

### 说明
- 添加 `status` 解构
- 用于区分 `"loading"` | `"authenticated"` | `"unauthenticated"`

---

## 改动 2: handleStartTrial 中的跳转逻辑

### 当前代码（第 22-26 行）
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

### 改动后
```typescript
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

### 改动说明
- **添加**: `if (status === "unauthenticated")` 检查
  - 只有真的未登录时才重定向
- **添加**: `if (status !== "authenticated")` 检查
  - loading 时不做任何操作（等待加载）
- **保留**: 原有的 `if (!session?.user?.id || !session?.user?.email)` 检查
  - 作为额外的安全检查

### 逻辑流程
```
用户点击"开始试用"按钮
  ↓
检查 status === "unauthenticated"?
  ├─ 是 → 重定向到登录页面 ✅
  └─ 否 → 继续
  ↓
检查 status === "authenticated"?
  ├─ 是 → 继续执行 trial.startTrial() ✅
  └─ 否 → 返回（等待加载） ✅
```

---

## 改动 3: handleBuy 中的跳转逻辑

### 当前代码（第 42-46 行）
```typescript
const handleBuy = async () => {
  if (!session?.user?.id) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }

  try {
    const priceId =
      process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD;

    if (!priceId) {
      setError("Purchase is not available at this time.");
      return;
    }

    await openCheckout({
      priceId,
      userId: session.user.id,
    });
  } catch (err) {
    console.error("Failed to open checkout:", err);
    setError("Failed to open checkout. Please try again.");
  }
};
```

### 改动后
```typescript
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

  try {
    const priceId =
      process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD;

    if (!priceId) {
      setError("Purchase is not available at this time.");
      return;
    }

    await openCheckout({
      priceId,
      userId: session.user.id,
    });
  } catch (err) {
    console.error("Failed to open checkout:", err);
    setError("Failed to open checkout. Please try again.");
  }
};
```

### 改动说明
- 同 handleStartTrial，添加 status 检查
- 只有 `status === "unauthenticated"` 时才重定向

---

## 改动 4: 登录提示文案的显示条件

### 当前代码（第 143-150 行）
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

### 改动后
```typescript
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

### 改动说明
- **添加**: `status === "loading"` 分支
  - 显示"加载中..."
- **改动**: 原有的 `!session?.user` 改为 `status === "unauthenticated"`
  - 更准确地判断未登录状态
- **保留**: 已登录时的提示文案

### 显示逻辑
```
status === "loading"?
  ├─ 是 → 显示"加载中..." ✅
  └─ 否 → 继续

status === "unauthenticated"?
  ├─ 是 → 显示"登录后开始使用" ✅
  └─ 否 → 继续

status === "authenticated"?
  └─ 是 → 显示"包含 7 天免费试用..." ✅
```

---

## 改动 5: 按钮 disabled 状态（可选）

### 当前代码（第 95-105 行）
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

### 改动后（可选）
```typescript
<button
  onClick={handleStartTrial}
  disabled={isLoading || status === "loading"}
  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
>
  {status === "loading"
    ? isZh
      ? "加载中..."
      : "Loading..."
    : isLoading
    ? isZh
      ? "处理中..."
      : "Processing..."
    : isZh
    ? "开始 7 天免费试用"
    : "Start 7-day free trial"}
</button>
```

### 改动说明
- **添加**: `status === "loading"` 到 disabled 条件
  - 当 session 正在加载时禁用按钮
- **添加**: `status === "loading"` 分支到按钮文本
  - 显示"加载中..."
- **保留**: 原有的 isLoading 逻辑

### 按钮状态表
```
status = "loading"?
  ├─ 是 → disabled = true, 显示"加载中..." ✅
  └─ 否 → 继续

isLoading = true?
  ├─ 是 → disabled = true, 显示"处理中..." ✅
  └─ 否 → 继续

其他情况
  └─ disabled = false, 显示"开始 7 天免费试用" ✅
```

---

## 改动总结表

| 改动 | 位置 | 当前 | 改动后 | 说明 |
|------|------|------|--------|------|
| 1 | 第 11 行 | `const { data: session }` | `const { data: session, status }` | 添加 status 解构 |
| 2 | 第 22-26 行 | 直接检查 `!session?.user?.id` | 先检查 `status === "unauthenticated"` | 只有真的未登录时才重定向 |
| 3 | 第 42-46 行 | 直接检查 `!session?.user?.id` | 先检查 `status === "unauthenticated"` | 同上 |
| 4 | 第 143-150 行 | 检查 `!session?.user` | 检查 `status === "loading"` 和 `status === "unauthenticated"` | 区分 loading 和 unauthenticated |
| 5 | 第 95-105 行 | `disabled={isLoading}` | `disabled={isLoading \|\| status === "loading"}` | 可选，增强用户体验 |

---

## 改动前后的行为对比

### 场景 1: 已登录用户访问页面

#### 改动前
```
时刻 1: 页面初始加载
  session = undefined
  status = "loading"
  ↓
  显示"登录后开始使用" ❌

时刻 2: 100ms 后
  session = { user: {...} }
  status = "authenticated"
  ↓
  显示"包含 7 天免费试用..." ✅
  
用户看到"登录后开始使用"，然后变成"包含 7 天免费试用..."
感觉"页面有健忘症" ❌
```

#### 改动后
```
时刻 1: 页面初始加载
  session = undefined
  status = "loading"
  ↓
  显示"加载中..." ✅

时刻 2: 100ms 后
  session = { user: {...} }
  status = "authenticated"
  ↓
  显示"包含 7 天免费试用..." ✅
  
用户看到"加载中..."，然后变成"包含 7 天免费试用..."
感觉正常 ✅
```

### 场景 2: 未登录用户访问页面

#### 改动前
```
时刻 1: 页面初始加载
  session = undefined
  status = "loading"
  ↓
  显示"登录后开始使用" ✅

时刻 2: 100ms 后
  session = undefined
  status = "unauthenticated"
  ↓
  显示"登录后开始使用" ✅
  
用户看到"登录后开始使用"
感觉正常 ✅
```

#### 改动后
```
时刻 1: 页面初始加载
  session = undefined
  status = "loading"
  ↓
  显示"加载中..." ✅

时刻 2: 100ms 后
  session = undefined
  status = "unauthenticated"
  ↓
  显示"登录后开始使用" ✅
  
用户看到"加载中..."，然后变成"登录后开始使用"
感觉正常 ✅
```

---

## 改动风险评估

| 项目 | 评估 | 说明 |
|------|------|------|
| **改动范围** | 低 | 只修改登录状态判断逻辑 |
| **对 Trial 系统的影响** | 无 | 不修改 trial 相关逻辑 |
| **对 JWT 验证的影响** | 无 | 不修改 JWT 相关逻辑 |
| **对支付流程的影响** | 无 | 不修改支付相关逻辑 |
| **向后兼容性** | 高 | 只是添加状态检查，不改变现有行为 |
| **测试复杂度** | 低 | 只需测试登录/未登录两种场景 |

---

## 下一步

1. ✅ 排查完成
2. ✅ 改动方案已提出
3. ⏳ 等待你的确认
4. ⏳ 根据反馈调整
5. ⏳ 实施改动

