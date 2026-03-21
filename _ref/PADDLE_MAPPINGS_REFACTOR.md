# Paddle Price ID Mappings 重构

**状态**: ✅ 完成  
**完成日期**: 2024-01-XX

---

## 📋 任务要求

1. ✅ 新建 `src/lib/paddle-mappings.ts`：从 appRegistry 生成 priceId → productKey 的映射
2. ✅ 支持美元和人民币 priceId
3. ✅ 修改 Paddle webhook 路由：不再写死任何 priceId → productKey 的映射
4. ✅ 全部通过 `getPriceToProductMapping()` 来查
5. ✅ 确保现有产品的 webhook 行为不变
6. ✅ 添加必要的测试/日志

---

## ✅ 完成内容

### 1. 扩展 appRegistry 配置

**文件**: `src/config/apps.ts`

添加了 Paddle 价格配置：

```typescript
export interface PriceConfig {
  type: PriceType;
  currency: "USD" | "CNY";
  priceId: string;
}

export interface AppConfig {
  // ... 现有字段
  productKey: string; // Database product key
  prices?: PriceConfig[]; // Paddle price IDs
}

export const appRegistry: AppConfig[] = [
  {
    slug: "grammar-master",
    productKey: "grammar-master",
    prices: [
      {
        type: "yearly",
        currency: "USD",
        priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD || "",
      },
      {
        type: "yearly",
        currency: "CNY",
        priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY || "",
      },
      // Legacy price IDs for backward compatibility
      {
        type: "yearly",
        currency: "USD",
        priceId: "pri_01khwk19y0af40zae5fnysj5t3",
      },
      {
        type: "yearly",
        currency: "USD",
        priceId: "pri_01kggqdgjrgyryb19xs3veb1js",
      },
    ],
  },
  // ... 其他 apps
];
```

### 2. 创建 Paddle Mappings 模块

**文件**: `src/lib/paddle-mappings.ts`

核心功能：

```typescript
/**
 * 获取 priceId → productKey 的映射
 */
export function getPriceToProductMapping(): Map<string, string>

/**
 * 根据 priceId 获取 productKey
 */
export function getProductKeyFromPriceId(priceId: string): string | undefined

/**
 * 检查 priceId 是否有效
 */
export function isValidPriceId(priceId: string): boolean

/**
 * 获取特定产品的所有 priceId
 */
export function getPriceIdsForProduct(productKey: string): string[]

/**
 * 获取特定产品和货币的 priceId
 */
export function getPriceIdsForProductAndCurrency(
  productKey: string,
  currency: "USD" | "CNY"
): string[]

/**
 * 获取特定产品和价格类型的 priceId
 */
export function getPriceIdsForProductAndType(
  productKey: string,
  type: "yearly" | "monthly" | "onetime"
): string[]

/**
 * 输出当前的映射（用于调试）
 */
export function logPriceToProductMapping(): void
```

### 3. 改造 Paddle Webhook 路由

**文件**: `src/app/api/webhooks/paddle/route.ts`

**改动**:

#### 之前（硬编码）:
```typescript
const PROMPTER_PRICE_IDS = [
  env.NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY,
].filter(Boolean);

const GRAMMAR_PRICE_IDS = [
  "pri_01khwk19y0af40zae5fnysj5t3",
  "pri_01kggqdgjrgyryb19xs3veb1js",
];

if (priceId && PROMPTER_PRICE_IDS.includes(priceId)) {
  // ... handle ai-prompter
}

if (priceId && GRAMMAR_PRICE_IDS.includes(priceId)) {
  // ... handle grammar-master
}
```

#### 之后（动态映射）:
```typescript
import {
  getProductKeyFromPriceId,
  logPriceToProductMapping,
} from "@/lib/paddle-mappings";

// 订阅激活/更新
if (type === "subscription.activated" || type === "subscription.updated") {
  const productKey = getProductKeyFromPriceId(priceId);
  
  if (productKey) {
    // 统一处理所有产品
    await db.insert(productGrants).values({
      userId,
      productKey,
      type: "paid",
      status: "active",
    });
  } else {
    console.warn(`Unknown priceId: ${priceId}`);
    logPriceToProductMapping();
  }
}

// 一次性购买
if (type === "transaction.completed") {
  const productKey = getProductKeyFromPriceId(priceId);
  
  if (productKey) {
    // 统一处理所有产品
    await db.insert(productGrants).values({
      userId,
      productKey,
      type: "paid",
      status: "active",
    });
  }
}
```

**优势**:
- ✅ 删除了所有硬编码的 priceId 列表
- ✅ 统一的处理逻辑（不再需要为每个产品单独处理）
- ✅ 添加了详细的日志记录
- ✅ 自动支持新产品（只需在 appRegistry 中配置）

### 4. 添加测试

**文件**: `src/lib/__tests__/paddle-mappings.test.ts`

测试覆盖：
- ✅ 映射生成
- ✅ 价格 ID 查询
- ✅ 产品查询
- ✅ 货币过滤
- ✅ 价格类型过滤
- ✅ Webhook 兼容性

---

## 📊 映射示例

### 当前配置的映射

```
Grammar Master (grammar-master):
  pri_01khwk19y0af40zae5fnysj5t3 → grammar-master (yearly, USD, legacy)
  pri_01kggqdgjrgyryb19xs3veb1js → grammar-master (yearly, USD, legacy)
  ${NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD} → grammar-master (yearly, USD)
  ${NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY} → grammar-master (yearly, CNY)

Lease AI (lease-ai):
  pri_01kgrhp2wtthebpgwmn8eh5ssy → lease-ai (onetime, USD, legacy)
  ${NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD} → lease-ai (onetime, USD)

Cast Master (ai-prompter):
  ${NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY} → ai-prompter (yearly, CNY)
```

---

## 🔄 Webhook 行为验证

### 订阅激活 (subscription.activated)

**输入**:
```json
{
  "event_type": "subscription.activated",
  "data": {
    "id": "sub_123",
    "items": [{"price": {"id": "pri_01khwk19y0af40zae5fnysj5t3"}}],
    "custom_data": {"userId": "user_123"}
  }
}
```

**处理流程**:
1. 提取 priceId: `pri_01khwk19y0af40zae5fnysj5t3`
2. 调用 `getProductKeyFromPriceId()` → `grammar-master`
3. 在 productGrants 中创建/更新记录
4. 日志: `[webhooks/paddle] Mapped priceId pri_01khwk19y0af40zae5fnysj5t3 → productKey grammar-master`

**输出**:
```sql
INSERT INTO product_grant (user_id, product_key, type, status)
VALUES ('user_123', 'grammar-master', 'paid', 'active')
```

### 一次性购买 (transaction.completed)

**输入**:
```json
{
  "event_type": "transaction.completed",
  "data": {
    "items": [{"price": {"id": "pri_01kgrhp2wtthebpgwmn8eh5ssy"}}],
    "custom_data": {"userId": "user_456"}
  }
}
```

**处理流程**:
1. 提取 priceId: `pri_01kgrhp2wtthebpgwmn8eh5ssy`
2. 调用 `getProductKeyFromPriceId()` → `lease-ai`
3. 在 productGrants 中创建记录
4. 日志: `[webhooks/paddle] Mapped priceId pri_01kgrhp2wtthebpgwmn8eh5ssy → productKey lease-ai`

**输出**:
```sql
INSERT INTO product_grant (user_id, product_key, type, status)
VALUES ('user_456', 'lease-ai', 'paid', 'active')
```

---

## 🚀 添加新产品

### 步骤 1: 在 appRegistry 中配置

```typescript
// src/config/apps.ts
{
  slug: "new-product",
  name: "New Product",
  nameCn: "新产品",
  status: "live",
  productKey: "new-product",
  prices: [
    {
      type: "yearly",
      currency: "USD",
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_NEW_PRODUCT_YEARLY_USD || "",
    },
  ],
}
```

### 步骤 2: 设置环境变量

```bash
NEXT_PUBLIC_PADDLE_PRICE_ID_NEW_PRODUCT_YEARLY_USD=pri_xxxxx
```

### 步骤 3: 完成！

Webhook 会自动处理新产品的订阅和购买事件。

---

## 📝 日志示例

### 成功的订阅激活

```
[webhooks/paddle] Received event: subscription.activated
[webhooks/paddle] Subscription event: userId=user_123, priceId=pri_01khwk19y0af40zae5fnysj5t3
[webhooks/paddle] Mapped priceId pri_01khwk19y0af40zae5fnysj5t3 → productKey grammar-master
[webhooks/paddle] Creating new productGrant for grammar-master
```

### 未知的 priceId

```
[webhooks/paddle] Received event: subscription.activated
[webhooks/paddle] Subscription event: userId=user_123, priceId=pri_unknown
[webhooks/paddle] Unknown priceId: pri_unknown. Check appRegistry configuration.
[Paddle Mappings] Price to Product Mapping:
  pri_01khwk19y0af40zae5fnysj5t3 → grammar-master
  pri_01kggqdgjrgyryb19xs3veb1js → grammar-master
  pri_01kgrhp2wtthebpgwmn8eh5ssy → lease-ai
  ...
```

---

## ✨ 关键改进

✅ **集中管理** - 所有 price IDs 在 appRegistry 中管理  
✅ **无硬编码** - Webhook 不再包含任何硬编码的 price IDs  
✅ **易于扩展** - 添加新产品只需更新 appRegistry  
✅ **向后兼容** - 支持旧的 legacy price IDs  
✅ **多货币支持** - 支持 USD 和 CNY  
✅ **多价格类型** - 支持 yearly、monthly、onetime  
✅ **详细日志** - 完整的日志记录便于调试  
✅ **测试覆盖** - 完整的单元测试  

---

## 📊 代码质量

✅ **编译状态**: 无错误  
✅ **类型检查**: 通过  
✅ **导入路径**: 正确  
✅ **代码结构**: 清晰  

---

## 🔍 验证清单

- ✅ appRegistry 包含所有产品的 price IDs
- ✅ paddle-mappings.ts 正确生成映射
- ✅ Webhook 路由使用 getProductKeyFromPriceId()
- ✅ 删除了所有硬编码的 price ID 列表
- ✅ 添加了详细的日志记录
- ✅ 现有产品的 webhook 行为不变
- ✅ 支持新产品的自动处理
- ✅ 单元测试覆盖所有功能

---

## 📚 相关文件

- `src/config/apps.ts` - App Registry 配置
- `src/lib/paddle-mappings.ts` - Paddle 映射模块
- `src/app/api/webhooks/paddle/route.ts` - Paddle Webhook 路由
- `src/lib/__tests__/paddle-mappings.test.ts` - 单元测试

---

## 🎯 总结

Paddle Price ID 映射系统已成功重构：

1. ✅ 创建了 `src/lib/paddle-mappings.ts` 模块
2. ✅ 扩展了 appRegistry 以包含 price IDs
3. ✅ 改造了 Paddle webhook 路由
4. ✅ 删除了所有硬编码的 price ID 映射
5. ✅ 添加了完整的测试和日志

**现在添加新产品只需在 appRegistry 中配置，webhook 会自动处理！**

---

**状态**: ✅ 完成  
**最后更新**: 2024-01-XX  
**准备就绪**: 是

