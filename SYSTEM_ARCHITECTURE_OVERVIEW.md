# Tutorbox 系统架构总览

## 1. Auth-Trial 模块（tutorbox 仓库）

### 代码位置
- **认证核心**: `src/lib/auth.ts`
- **API 路由**: `src/app/api/auth/[...nextauth]/`
- **试用逻辑**: `src/lib/trial/account-trial.ts`
- **匿名试用**: `src/lib/anonymous-trial.ts`

### 提供的 API 接口

#### 1.1 NextAuth 邮箱登录
- **路由**: `POST /api/auth/signin/email`
- **技术**: NextAuth.js + Resend 邮件服务
- **流程**: 用户输入邮箱 → 发送魔法链接 → 点击链接登录
- **响应**: 自动创建 session，重定向到首页

#### 1.2 获取当前用户
- **路由**: `GET /api/auth/session`
- **返回**: `{ user: { id, email, name, image }, expires }`
- **用途**: 前端检查登录状态

#### 1.3 登出
- **路由**: `POST /api/auth/signout`
- **效果**: 清除 session

### 技术栈
- **认证框架**: NextAuth.js v5
- **邮件服务**: Resend
- **数据库**: Prisma ORM
- **Session 存储**: 数据库（PrismaAdapter）
- **Token**: NextAuth 内置 JWT

### 外部 App 集成方式
1. **前端**: 使用 `useSession()` hook 获取用户信息
2. **后端**: 使用 `getServerSession(authConfig)` 验证用户身份
3. **跨域**: 通过 `NEXTAUTH_URL` 环境变量配置

---

## 2. Paddle-Next 模块（paddle-next 仓库）

### 代码位置
- **前端组件**: `src/components/paddle/checkout-button.tsx`
- **后端验证**: `src/lib/paddle-server.ts`
- **Webhook 处理**: `tutorbox/src/app/api/webhooks/paddle/route.ts`

### 前端封装

#### 2.1 CheckoutButton 组件
```tsx
<PaddleCheckoutButton
  priceId={grammarPriceId}        // Paddle 价格 ID
  userId={userId}                  // 用户 ID（custom_data）
  className="w-full"
>
  获取语法大师
</PaddleCheckoutButton>
```

**参数说明**:
- `priceId`: Paddle 系统中的价格 ID（CNY/USD 分别配置）
- `userId`: 用户 ID，传入 Paddle custom_data 用于后续 webhook 匹配
- `className`: Tailwind CSS 样式

#### 2.2 使用示例
- **语法大师**: `src/app/[locale]/(landing)/_sections/pricing.tsx` (line ~60)
- **播感大师**: `src/app/[locale]/(landing)/_sections/pricing.tsx` (line ~120)
- **美国租约**: `src/app/[locale]/(landing)/_sections/pricing.tsx` (line ~180)

### 后端封装

#### 2.3 Webhook 校验
```typescript
import { verifyPaddleWebhook } from "@/lib/paddle-server";

const isValid = await verifyPaddleWebhook(rawBody, signature);
```

**流程**:
1. 接收 Paddle 发送的 webhook 事件
2. 验证 `Paddle-Signature` 头
3. 解析事件类型（`subscription.activated`, `subscription.updated` 等）
4. 从 `custom_data.userId` 获取用户 ID
5. 写入 `productGrants` 表

#### 2.4 事件处理
- `subscription.activated`: 新订阅激活 → 创建 productGrant
- `subscription.updated`: 订阅更新 → 更新 productGrant 状态
- `subscription.canceled`: 订阅取消 → 标记为 expired

---

## 3. ProductGrants 模型

### 表结构（Drizzle ORM）
```typescript
productGrants = pgTable("product_grant", {
  id:            text("id").primaryKey(),           // UUID
  userId:        text("userId").notNull(),          // 用户 ID
  productKey:    text("productKey").notNull(),      // 产品标识
  type:          text("type").notNull(),            // "trial" | "paid" | "gift"
  status:        text("status").notNull(),          // "active" | "expired"
  trialStartsAt: timestamp("trialStartsAt"),        // 试用开始时间
  trialEndsAt:   timestamp("trialEndsAt"),          // 试用结束时间
  createdAt:     timestamp("createdAt").notNull(),  // 创建时间
});
```

### 现有 ProductKey 列表
| ProductKey | 产品名 | 域名 | 试用类型 | 支付方式 |
|-----------|--------|------|---------|---------|
| `grammar-master` | 语法大师 | gm.tutorbox.cc | 30min 匿名 + 3天账户 | Paddle 年付 |
| `ai-prompter` | 播感大师 | prompter.tutorbox.cc | 30min 匿名 | Paddle 年付 |
| `lease-ai` | 美国租约 | lease.tutorbox.cc | 一次性购买 | Paddle 一次性 |
| `en-cards` | 英语卡片 | cards.tutorbox.cc | 计划中 | 计划中 |

### 标准授权检查

#### 3.1 检查用户是否有权限
```typescript
// 在 src/lib/trial/account-trial.ts
export async function checkGrammarMasterAccess(userId: string) {
  // 1. 检查 productGrants 中是否有 grammar-master 的 active 记录
  // 2. 如果没有，检查是否在 3 天试用期内
  // 3. 返回 { hasAccess, reason, trialInfo }
}
```

#### 3.2 API 路由中的使用
- **语法大师**: `src/app/api/grammar/access/route.ts`
- **播感大师**: `src/app/api/teleprompter/access/route.ts`
- **美国租约**: `src/app/api/lease/access/route.ts`

---

## 4. 试用系统

### 4.1 匿名试用（30 分钟）
- **存储**: Cookie (`tutorbox_anon_trial`)
- **JWT 签名**: 使用 `NEXTAUTH_SECRET`
- **API**: `POST /api/anonymous-trial/start`
- **应用**: Grammar Master、Cast Master

### 4.2 账户试用（3 天）
- **存储**: User 表（`trialStart`, `trialEnd`, `hasUsedTrial`）
- **触发**: 用户首次访问产品时自动启动
- **API**: `src/lib/trial/account-trial.ts` 中的 `ensureAccountTrialForApp()`
- **应用**: Grammar Master（登录后）

---

## 5. 现有和计划中的产品

### 已有独立域名产品
| 产品 | 域名 | 状态 | 支付模式 |
|------|------|------|---------|
| 语法大师 | gm.tutorbox.cc | Live | 年付 ¥199 / $49 |
| 播感大师 | prompter.tutorbox.cc | Live | 年付 ¥99 |
| 美国租约 | lease.tutorbox.cc | Live | 一次性 $39 |

### 计划走新体系的产品
| 产品 | 功能 | 状态 | 备注 |
|------|------|------|------|
| 英语卡片 | 智能单词卡片系统 | 计划中 | 需要新 productKey: `en-cards` |
| Thinker AI | 实时语音对话 AI | 计划中 | 需要新 productKey: `thinker-ai` |
| FlowForge | 工作流自动化 | 计划中 | 需要新 productKey: `flowforge` |

---

## 6. 集成检查清单

### 新 App 需要的步骤
1. **定义 productKey**: 例如 `en-cards`
2. **Paddle 配置**: 创建价格 ID，设置 custom_data 映射
3. **环境变量**: 添加 `NEXT_PUBLIC_PADDLE_PRICE_ID_EN_CARDS`
4. **Webhook 映射**: 在 `src/app/api/webhooks/paddle/route.ts` 中添加 priceId → productKey 映射
5. **前端集成**: 使用 `<PaddleCheckoutButton priceId={...} userId={...} />`
6. **后端授权**: 在 API 路由中调用 `checkProductAccess(userId, productKey)`

---

## 7. 环境变量配置

### 必需
```env
NEXTAUTH_SECRET=xxx
RESEND_API_KEY=xxx
EMAIL_FROM=noreply@tutorbox.cc
DATABASE_URL=postgresql://...
PADDLE_API_KEY=xxx
PADDLE_WEBHOOK_SECRET=xxx
```

### 可选（开发环境可不配）
```env
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=xxx
NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD=pri_xxx
```

---

## 8. 关键文件速查表

| 功能 | 文件路径 |
|------|---------|
| 邮箱登录配置 | `tutorbox/src/lib/auth.ts` |
| 账户试用逻辑 | `tutorbox/src/lib/trial/account-trial.ts` |
| 匿名试用逻辑 | `tutorbox/src/lib/anonymous-trial.ts` |
| Paddle Webhook | `tutorbox/src/app/api/webhooks/paddle/route.ts` |
| 语法大师授权 | `tutorbox/src/app/api/grammar/access/route.ts` |
| 播感大师授权 | `tutorbox/src/app/api/teleprompter/access/route.ts` |
| 美国租约授权 | `tutorbox/src/app/api/lease/access/route.ts` |
| 定价页面 | `tutorbox/src/app/[locale]/(landing)/_sections/pricing.tsx` |
| ProductGrants 表 | `tutorbox/src/db/schema.ts` (line ~108) |

