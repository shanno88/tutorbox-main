# Paddle Mappings 快速测试指南

## 🚀 快速开始

### 1. 验证映射生成

在 Node.js REPL 中测试：

```bash
node -e "
const { getPriceToProductMapping, logPriceToProductMapping } = require('./dist/lib/paddle-mappings.js');
logPriceToProductMapping();
"
```

或在代码中：

```typescript
import { logPriceToProductMapping } from "@/lib/paddle-mappings";

// 在应用启动时调用
logPriceToProductMapping();
```

### 2. 测试单个映射

```typescript
import { getProductKeyFromPriceId } from "@/lib/paddle-mappings";

// 测试 Grammar Master
console.log(getProductKeyFromPriceId("pri_01khwk19y0af40zae5fnysj5t3"));
// 输出: "grammar-master"

// 测试 Lease AI
console.log(getProductKeyFromPriceId("pri_01kgrhp2wtthebpgwmn8eh5ssy"));
// 输出: "lease-ai"

// 测试未知 ID
console.log(getProductKeyFromPriceId("pri_unknown"));
// 输出: undefined
```

---

## 🧪 测试场景

### 场景 1: 订阅激活 (Grammar Master)

**模拟 Webhook 请求**:

```bash
curl -X POST http://localhost:3000/api/webhooks/paddle \
  -H "Content-Type: application/json" \
  -H "Paddle-Signature: <valid-signature>" \
  -d '{
    "event_type": "subscription.activated",
    "data": {
      "id": "sub_test_123",
      "items": [{"price": {"id": "pri_01khwk19y0af40zae5fnysj5t3"}}],
      "custom_data": {"userId": "test_user_123"}
    }
  }'
```

**预期日志**:
```
[webhooks/paddle] Received event: subscription.activated
[webhooks/paddle] Subscription event: userId=test_user_123, priceId=pri_01khwk19y0af40zae5fnysj5t3
[webhooks/paddle] Mapped priceId pri_01khwk19y0af40zae5fnysj5t3 → productKey grammar-master
[webhooks/paddle] Creating new productGrant for grammar-master
```

**验证数据库**:
```sql
SELECT * FROM product_grant 
WHERE user_id = 'test_user_123' 
  AND product_key = 'grammar-master' 
  AND type = 'paid';
```

应该返回一条记录，status = 'active'。

### 场景 2: 一次性购买 (Lease AI)

**模拟 Webhook 请求**:

```bash
curl -X POST http://localhost:3000/api/webhooks/paddle \
  -H "Content-Type: application/json" \
  -H "Paddle-Signature: <valid-signature>" \
  -d '{
    "event_type": "transaction.completed",
    "data": {
      "items": [{"price": {"id": "pri_01kgrhp2wtthebpgwmn8eh5ssy"}}],
      "custom_data": {"userId": "test_user_456"}
    }
  }'
```

**预期日志**:
```
[webhooks/paddle] Received event: transaction.completed
[webhooks/paddle] Transaction completed: userId=test_user_456, priceId=pri_01kgrhp2wtthebpgwmn8eh5ssy
[webhooks/paddle] Mapped priceId pri_01kgrhp2wtthebpgwmn8eh5ssy → productKey lease-ai
[webhooks/paddle] Creating new productGrant for lease-ai
```

**验证数据库**:
```sql
SELECT * FROM product_grant 
WHERE user_id = 'test_user_456' 
  AND product_key = 'lease-ai' 
  AND type = 'paid';
```

应该返回一条记录，status = 'active'。

### 场景 3: 订阅取消 (Cast Master)

**模拟 Webhook 请求**:

```bash
curl -X POST http://localhost:3000/api/webhooks/paddle \
  -H "Content-Type: application/json" \
  -H "Paddle-Signature: <valid-signature>" \
  -d '{
    "event_type": "subscription.canceled",
    "data": {
      "items": [{"price": {"id": "pri_cast_master_cny"}}],
      "custom_data": {"userId": "test_user_789"}
    }
  }'
```

**预期日志**:
```
[webhooks/paddle] Received event: subscription.canceled
[webhooks/paddle] Subscription canceled: userId=test_user_789, priceId=pri_cast_master_cny
[webhooks/paddle] Deactivating productGrant for ai-prompter
```

**验证数据库**:
```sql
SELECT * FROM product_grant 
WHERE user_id = 'test_user_789' 
  AND product_key = 'ai-prompter' 
  AND type = 'paid';
```

应该返回一条记录，status = 'inactive'。

### 场景 4: 未知 Price ID

**模拟 Webhook 请求**:

```bash
curl -X POST http://localhost:3000/api/webhooks/paddle \
  -H "Content-Type: application/json" \
  -H "Paddle-Signature: <valid-signature>" \
  -d '{
    "event_type": "subscription.activated",
    "data": {
      "items": [{"price": {"id": "pri_unknown_id"}}],
      "custom_data": {"userId": "test_user_unknown"}
    }
  }'
```

**预期日志**:
```
[webhooks/paddle] Received event: subscription.activated
[webhooks/paddle] Subscription event: userId=test_user_unknown, priceId=pri_unknown_id
[webhooks/paddle] Unknown priceId: pri_unknown_id. Check appRegistry configuration.
[Paddle Mappings] Price to Product Mapping:
  pri_01khwk19y0af40zae5fnysj5t3 → grammar-master
  pri_01kggqdgjrgyryb19xs3veb1js → grammar-master
  pri_01kgrhp2wtthebpgwmn8eh5ssy → lease-ai
  ...
```

**验证数据库**:
```sql
SELECT * FROM product_grant 
WHERE user_id = 'test_user_unknown';
```

应该返回空结果（没有创建记录）。

---

## 🧬 单元测试

### 运行测试

```bash
npm test -- paddle-mappings.test.ts
```

### 测试覆盖

- ✅ 映射生成
- ✅ 价格 ID 查询
- ✅ 产品查询
- ✅ 货币过滤
- ✅ 价格类型过滤
- ✅ Webhook 兼容性

### 预期输出

```
PASS  src/lib/__tests__/paddle-mappings.test.ts
  Paddle Mappings
    getPriceToProductMapping
      ✓ should return a map of price IDs to product keys
      ✓ should include legacy price IDs
    getProductKeyFromPriceId
      ✓ should return product key for valid price ID
      ✓ should return undefined for invalid price ID
    isValidPriceId
      ✓ should return true for valid price ID
      ✓ should return false for invalid price ID
    getPriceIdsForProduct
      ✓ should return all price IDs for a product
      ✓ should return empty array for non-existent product
    getPriceIdsForProductAndCurrency
      ✓ should return price IDs for specific currency
      ✓ should return empty array for non-existent currency
    getPriceIdsForProductAndType
      ✓ should return price IDs for specific type
      ✓ should return empty array for non-existent type
    Webhook compatibility
      ✓ should map all subscription price IDs correctly
      ✓ should map all transaction price IDs correctly

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
```

---

## 📊 验证清单

### 映射验证

- [ ] `getPriceToProductMapping()` 返回非空 Map
- [ ] Grammar Master 的所有 price IDs 都映射到 "grammar-master"
- [ ] Lease AI 的所有 price IDs 都映射到 "lease-ai"
- [ ] Cast Master 的所有 price IDs 都映射到 "ai-prompter"
- [ ] Legacy price IDs 都被正确映射

### Webhook 验证

- [ ] 订阅激活事件正确创建 productGrant
- [ ] 订阅更新事件正确更新 productGrant
- [ ] 订阅取消事件正确标记为 inactive
- [ ] 一次性购买事件正确创建 productGrant
- [ ] 未知 price ID 被正确记录为警告

### 日志验证

- [ ] 所有事件都有日志记录
- [ ] 映射成功时有 "Mapped" 日志
- [ ] 未知 price ID 时有 "Unknown" 警告
- [ ] 数据库操作有相应的日志

### 数据库验证

- [ ] productGrant 表中的记录正确
- [ ] user_id 正确
- [ ] product_key 正确
- [ ] type 为 "paid"
- [ ] status 正确（active/inactive）

---

## 🐛 常见问题

### Q: 日志中看不到映射信息

**A**: 检查以下几点：
1. 确保 NODE_ENV 是 "production"（webhook 在非生产环境返回 200）
2. 检查 Paddle webhook 签名是否有效
3. 查看应用日志是否有错误

### Q: productGrant 没有被创建

**A**: 检查以下几点：
1. 确保 userId 不为空
2. 确保 priceId 在 appRegistry 中配置
3. 检查数据库连接是否正常
4. 查看日志中是否有 "Unknown priceId" 警告

### Q: 旧的 price IDs 不工作

**A**: 检查以下几点：
1. 确保 legacy price IDs 在 appRegistry 中配置
2. 运行 `logPriceToProductMapping()` 验证映射
3. 检查是否有拼写错误

---

## 📝 测试报告模板

```
测试日期: 2024-01-XX
测试环境: 生产环境模拟
测试工具: curl / Postman

测试结果:
- [ ] 映射生成: ✅ 通过 / ❌ 失败
- [ ] 订阅激活: ✅ 通过 / ❌ 失败
- [ ] 一次性购买: ✅ 通过 / ❌ 失败
- [ ] 订阅取消: ✅ 通过 / ❌ 失败
- [ ] 未知 ID 处理: ✅ 通过 / ❌ 失败
- [ ] 单元测试: ✅ 通过 / ❌ 失败

问题描述:
(如有失败，请描述问题)

备注:
(其他观察或建议)
```

---

**准备好测试了吗？** 现在就开始吧！

```bash
# 1. 运行单元测试
npm test -- paddle-mappings.test.ts

# 2. 查看映射
node -e "require('./dist/lib/paddle-mappings.js').logPriceToProductMapping();"

# 3. 测试 webhook（使用 curl 或 Postman）
```

