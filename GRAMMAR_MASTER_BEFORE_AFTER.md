# Grammar Master 修改 - Before/After 确认

## 改动 1: useSession() 解构

### Before
```typescript
const { data: session } = useSession();
```

### After
```typescript
const { data: session, status } = useSession();
```

**说明**: 添加 `status` 解构，用于区分 loading/authenticated/unauthenticated

---

## 改动 2: handleStartTrial 中的跳转逻辑

### Before
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
  } catch (err) {
    console.error("Failed to start trial:", err);
    setError("Failed to start trial. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
```

### After
```typescript
const handleStartTrial = async () => {
  // 只有在真的未登录时才跳转
  if (status === "unauthenticated") {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  
  // loading 时等待，不做任何操作
  if (status !== "authenticated") {
    return;
  }
  
  // 额外的安全检查
  if (!session?.user?.id || !session?.user?.email) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    await trial.startTrial();
  } catch (err) {
    console.error("Failed to start trial:", err);
    setError("Failed to start trial. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
```

**说明**:
- 第一个 if: 只有 `status === "unauthenticated"` 时才重定向
- 第二个 if: `status === "loading"` 时直接 return（等待加载）
- 第三个 if: 额外的安全检查（保留原有逻辑）

**逻辑流程**:
```
用户点击"开始试用"
  ↓
status === "unauthenticated"? → 是 → 重定向到登录页 ✅
  ↓ 否
status === "authenticated"? → 是 → 继续执行 trial.startTrial() ✅
  ↓ 否（status === "loading"）
直接 return（等待加载） ✅
```

---

## 改动 3: handleBuy 中的跳转逻辑

### Before
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

### After
```typescript
const handleBuy = async () => {
  // 只有在真的未登录时才跳转
  if (status === "unauthenticated") {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
    return;
  }
  
  // loading 时等待，不做任何操作
  if (status !== "authenticated") {
    return;
  }
  
  // 额外的安全检查
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

**说明**: 同 handleStartTrial，添加 status 检查

---

## 改动 4: 按钮 disabled 状态

### Before
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

### After
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

**说明**:
- disabled: 添加 `status === "loading"` 条件
- 按钮文本: 添加 `status === "loading"` 分支，显示"加载中..."

**按钮状态表**:
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

## 改动 5: 登录提示文案

### Before
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

### After
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

**说明**:
- 第一个分支: `status === "loading"` → 显示"加载中..."
- 第二个分支: `status === "unauthenticated"` → 显示"登录后开始使用"
- 第三个分支: `status === "authenticated"` → 显示"包含 7 天免费试用..."

**显示逻辑**:
```
status = "loading"?
  ├─ 是 → 显示"加载中..." ✅
  └─ 否 → 继续

status = "unauthenticated"?
  ├─ 是 → 显示"登录后开始使用" ✅
  └─ 否 → 继续

status = "authenticated"?
  └─ 是 → 显示"包含 7 天免费试用..." ✅
```

---

## 改动 6: 购买按钮的 disabled 状态（同步改动）

### Before
```typescript
<button
  onClick={handleBuy}
  disabled={isLoading}
  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
>
  {isZh ? "立即购买 Pro 版" : "Buy Pro version"}
</button>
```

### After
```typescript
<button
  onClick={handleBuy}
  disabled={isLoading || status === "loading"}
  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
>
  {isZh ? "立即购买 Pro 版" : "Buy Pro version"}
</button>
```

**说明**: 同试用按钮，添加 `status === "loading"` 到 disabled 条件

---

## 改动总结

| 改动 | 位置 | 类型 | 说明 |
|------|------|------|------|
| 1 | 第 11 行 | 解构 | 添加 status |
| 2 | 第 22-26 行 | 函数 | handleStartTrial 添加 status 检查 |
| 3 | 第 42-46 行 | 函数 | handleBuy 添加 status 检查 |
| 4 | 第 95-105 行 | UI | 试用按钮添加 status 检查 |
| 5 | 第 110-115 行 | UI | 购买按钮添加 status 检查 |
| 6 | 第 143-150 行 | UI | 登录提示添加 status 检查 |

---

## 验证清单

改动完成后，应该满足以下条件：

### ✅ 已登录用户
- [ ] 进入 `/zh/grammar-master` 时不看到"登录后开始使用"
- [ ] 直接看到"开始 7 天免费试用"按钮
- [ ] 页面不会重定向到登录页面
- [ ] 可以正常点击按钮开始试用

### ✅ 未登录用户
- [ ] 进入 `/zh/grammar-master` 时看到"登录后开始使用"
- [ ] 点击"开始试用"按钮后重定向到登录页面
- [ ] 登录成功后自动回到 Grammar Master 页面
- [ ] 可以继续开始试用

### ✅ 页面加载过程
- [ ] 初始加载时显示"加载中..."
- [ ] 不显示"登录后开始使用"的误导文案
- [ ] 100ms 后显示正确的内容

---

## 确认

请确认以上改动方案是否正确，然后我会正式修改文件。

