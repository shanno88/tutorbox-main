# Grammar Master 登录状态问题 - 排查完成

## 排查状态: ✅ 完成

---

## 问题确认

### 用户反馈
- ✅ `/api/auth/session` 返回正常的 user（确实登录了）
- ❌ 进入 `/zh/grammar-master` 时仍看到"输入邮箱获取 magic link"的提示
- ❌ 页面有"健忘症"，显示登录提示，即使用户已登录

### 产品期望
- ✅ 用户邮箱登录成功后，全站认为已登录
- ✅ 各产品页不再单独要求再登录一次
- ✅ Grammar Master 页只在「真的未登录」时才提示去登录
- ✅ 已登录用户进来直接看到试用按钮/内容

---

## 排查结果

### 问题 1: useSession() 只用了 data，没有用 status

**文件**: `src/app/[locale]/grammar-master/page.tsx`
**位置**: 第 11 行

```typescript
const { data: session } = useSession();  // ❌ 缺少 status
```

**问题**: 无法区分 `status === "loading"` 和 `status === "unauthenticated"`

---

### 问题 2: 决定是否跳转到登录页的逻辑

#### 位置 A: handleStartTrial（第 22-26 行）

```typescript
const handleStartTrial = async () => {
  if (!session?.user?.id || !session?.user?.email) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);  // ❌ 当 status === "loading" 时也会重定向
    return;
  }
  // ...
};
```

**问题**: 当 session 正在加载时，会错误地重定向到登录页面

#### 位置 B: handleBuy（第 42-46 行）

```typescript
const handleBuy = async () => {
  if (!session?.user?.id) {
    router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);  // ❌ 当 status === "loading" 时也会重定向
    return;
  }
  // ...
};
```

**问题**: 同上

---

### 问题 3: 控制登录提示文案的条件

**位置**: 第 143-150 行

```typescript
<p className="text-xs text-muted-foreground mt-6">
  {!session?.user
    ? isZh
      ? "登录后开始使用"  // ❌ 当 status === "loading" 时也会显示
      : "Sign in to get started"
    : isZh
    ? "包含 7 天免费试用，无需订阅。"
    : "7-day free trial included. No subscription required."}
</p>
```

**问题**: 当 session 正在加载时，显示"登录后开始使用"的提示

---

## 根本原因

**useSession() 在 SSR 阶段返回 `{ data: undefined, status: "loading" }`**

页面没有等待 session 加载完成，直接根据 `session === undefined` 判断为未登录

---

## 最小改动方案

### 核心思路

**只修改登录状态判断逻辑，不动 Trial/JWT 相关逻辑**

### 改动清单

| 改动 | 位置 | 说明 |
|------|------|------|
| 1 | 第 11 行 | 添加 `status` 解构 |
| 2 | 第 22-26 行 | handleStartTrial 中添加 status 检查 |
| 3 | 第 42-46 行 | handleBuy 中添加 status 检查 |
| 4 | 第 143-150 行 | 登录提示中添加 status 检查 |
| 5 | 第 95-105 行 | 按钮 UI 中添加 status 检查（可选） |

### 改动原则

1. **只有 `status === "unauthenticated"` 时才跳转到登录页**
   - `status === "loading"` 时不做任何操作（等待加载）
   - `status === "authenticated"` 时继续执行

2. **显示逻辑**
   - `status === "loading"` → 显示"加载中..."
   - `status === "unauthenticated"` → 显示"登录后开始使用"
   - `status === "authenticated"` → 显示"包含 7 天免费试用..."

3. **按钮状态**
   - `status === "loading"` → 禁用按钮，显示"加载中..."
   - `status === "authenticated"` → 启用按钮，显示"开始 7 天免费试用"

---

## 改动前后对比

### 已登录用户

#### 改动前 ❌
```
页面初始加载 → 显示"登录后开始使用" → 100ms 后显示"包含 7 天免费试用..."
用户感觉"页面有健忘症"
```

#### 改动后 ✅
```
页面初始加载 → 显示"加载中..." → 100ms 后显示"包含 7 天免费试用..."
用户感觉正常
```

### 未登录用户

#### 改动前 ✅
```
页面初始加载 → 显示"登录后开始使用" → 100ms 后仍显示"登录后开始使用"
用户感觉正常
```

#### 改动后 ✅
```
页面初始加载 → 显示"加载中..." → 100ms 后显示"登录后开始使用"
用户感觉正常
```

---

## 改动影响范围

### 修改的文件
- `src/app/[locale]/grammar-master/page.tsx` (1 个文件)

### 改动行数
- 约 20-40 行

### 不修改的内容
- ✅ NextAuth 配置
- ✅ Trial 系统逻辑
- ✅ JWT 验证逻辑
- ✅ 支付/订阅逻辑
- ✅ 页面其他部分

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

## 文档清单

我已为你准备了以下文档：

1. **GRAMMAR_MASTER_LOGIN_FIX_PLAN.md** ← 详细的修复计划
2. **GRAMMAR_MASTER_CODE_COMPARISON.md** ← 代码对比和改动说明
3. **GRAMMAR_MASTER_INVESTIGATION_COMPLETE.md** ← 本文档

---

## 下一步

1. ✅ 排查完成
2. ⏳ 等待你的确认和反馈
3. ⏳ 根据反馈调整改动方案
4. ⏳ 实施改动
5. ⏳ 测试验证

---

## 关键要点总结

| 项目 | 内容 |
|------|------|
| **问题** | useSession() 只用了 data，没有用 status，导致无法区分 loading 和 unauthenticated |
| **表现** | 已登录用户看到"登录后开始使用"的提示 |
| **根本原因** | 页面没有等待 session 加载完成 |
| **修复方案** | 添加 status 检查，只有 status === "unauthenticated" 时才跳转到登录页 |
| **改动文件** | 1 个文件 (`src/app/[locale]/grammar-master/page.tsx`) |
| **改动行数** | 约 20-40 行 |
| **改动范围** | 只修改登录状态判断逻辑 |
| **风险等级** | 低 |

---

## 确认清单

- [x] 排查了 useSession() 的使用
- [x] 排查了跳转到登录页的逻辑
- [x] 排查了登录提示文案的显示条件
- [x] 确认了问题根源
- [x] 提出了最小改动方案
- [x] 准备了代码对比文档
- [ ] 等待你的确认

**请确认改动方案是否合理，然后我们可以开始实施。**

