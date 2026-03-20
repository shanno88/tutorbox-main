# Task 9 – Quick Reference Guide

## Module Locations

- `src/lib/billing/issueApiKeyForSubscription.ts` - API key issuance with idempotency
- `src/lib/billing/handleSuccessfulSubscription.ts` - Generic subscription handler
- `src/app/api/webhooks/paddle/route.ts` - Updated webhook handler

## Main Functions

### handleSuccessfulSubscription()
Process a successful subscription payment.

```typescript
import { handleSuccessfulSubscription } from '@/lib/billing/handleSuccessfulSubscription';

const result = await handleSuccessfulSubscription({
  subscription: descriptor, // SubscriptionDescriptor
  rawEvent: event,          // Original webhook event
});

if (result.success) {
  console.log(`API key issued: ${result.apiKeyId}`);
} else {
  console.error(`Failed: ${result.error}`);
}
```

**Returns**:
```typescript
{
  success: boolean;
  userId?: string;
  planSlug?: string;
  apiKeyId?: number;
  subscriptionId?: string;
  error?: string;
  reason?: string;
}
```

### issueApiKeyForSubscription()
Issue or reuse an API key for a subscription (idempotent).

```typescript
import { issueApiKeyForSubscription } from '@/lib/billing/issueApiKeyForSubscription';

const result = await issueApiKeyForSubscription(subscription);

if (result.success) {
  if (result.isNew) {
    // New key created, send to user
    console.log(`New key: ${result.apiKey}`);
  } else {
    // Existing key reused
    console.log(`Reused key: ${result.apiKeyId}`);
  }
}
```

**Returns**:
```typescript
{
  success: boolean;
  apiKeyId?: number;
  apiKey?: string;      // Only on first issuance
  isNew?: boolean;      // true if newly created, false if reused
  error?: string;
  reason?: string;
}
```

### maskApiKey()
Mask an API key for safe logging.

```typescript
import { maskApiKey } from '@/lib/billing/issueApiKeyForSubscription';

const masked = maskApiKey('tutorbox_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
// Result: tutorbox_a1b2c3d4...m3n4o5p6
```

### logApiKeyIssuance()
Log API key issuance without exposing full keys.

```typescript
import { logApiKeyIssuance } from '@/lib/billing/issueApiKeyForSubscription';

logApiKeyIssuance(result);
// Logs: [logApiKeyIssuance] API key newly created: keyId=42, key=tutorbox_a1b2c3d4...m3n4o5p6
```

## Type Definitions

### SuccessfulSubscriptionContext
```typescript
interface SuccessfulSubscriptionContext {
  subscription: SubscriptionDescriptor;
  rawEvent: unknown;
}
```

### IssueApiKeyResult
```typescript
interface IssueApiKeyResult {
  success: boolean;
  apiKeyId?: number;
  apiKey?: string;
  isNew?: boolean;
  error?: string;
  reason?: string;
}
```

### HandleSuccessfulSubscriptionResult
```typescript
interface HandleSuccessfulSubscriptionResult {
  success: boolean;
  userId?: string;
  planSlug?: string;
  apiKeyId?: number;
  subscriptionId?: string;
  error?: string;
  reason?: string;
}
```

## Idempotency

The `issueApiKeyForSubscription()` function is idempotent:

**First Call**:
```
Input: subscription for user_123, plan_1
Output: {
  success: true,
  apiKeyId: 42,
  apiKey: "tutorbox_...",  // Unhashed key
  isNew: true
}
```

**Second Call (Same Subscription)**:
```
Input: subscription for user_123, plan_1
Output: {
  success: true,
  apiKeyId: 42,
  apiKey: undefined,  // No key returned
  isNew: false
}
```

**Why**: Prevents duplicate keys from being created if the same webhook is processed multiple times.

## Webhook Integration

### Before
```typescript
const result = await handleSuccessfulPayment({
  provider: "paddle",
  rawEvent: event,
  priceId: event.data.items?.[0]?.price?.id || "",
  productKey: descriptor.productKey,
  userIdentifier: descriptor.userId,
  subscriptionId: descriptor.providerSubscriptionId,
});
```

### After
```typescript
const result = await handleSuccessfulSubscription({
  subscription: descriptor,
  rawEvent: event,
});
```

## Processing Flow

```
1. Extract SubscriptionDescriptor from webhook
2. Call handleSuccessfulSubscription()
   ├─ Upsert subscription record
   ├─ Issue or reuse API key
   └─ Log operation
3. Return 200 OK to Paddle
```

## Error Handling

### Plan Not Found
```typescript
const result = await issueApiKeyForSubscription(subscription);
// result.success === false
// result.error === "Plan not found"
// result.reason === "No plan found with slug: unknown-plan"
```

### Database Error
```typescript
const result = await handleSuccessfulSubscription(ctx);
// result.success === false
// result.error === "Unexpected error"
// result.reason === "Connection timeout"
```

### Always Return 200 OK
```typescript
if (!result.success) {
  console.error(`Failed: ${result.error}`);
  // Still return 200 OK to Paddle (don't retry)
  return new Response("OK", { status: 200 });
}
```

## Logging

### Safe Logging (No Secrets)
```
[issueApiKeyForSubscription] Processing subscription for userId=user_123, planSlug=grammar-master-yearly-usd
[issueApiKeyForSubscription] Found plan: Grammar Master - Yearly (USD) (id=1)
[issueApiKeyForSubscription] Generated new API key for userId=user_123, planId=1
[issueApiKeyForSubscription] Successfully issued new API key: keyId=42
[logApiKeyIssuance] API key newly created: keyId=42, key=tutorbox_a1b2c3d4...m3n4o5p6
```

### Masked Keys
- Full key: `tutorbox_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- Masked: `tutorbox_a1b2c3d4...m3n4o5p6`
- Only first 8 and last 4 characters shown

## Testing

### Test Successful Payment
```typescript
const descriptor: SubscriptionDescriptor = {
  provider: "paddle",
  providerSubscriptionId: "sub_123",
  userId: "user_123",
  productKey: "grammar-master",
  planSlug: "grammar-master-yearly-usd",
  status: "active",
};

const result = await handleSuccessfulSubscription({
  subscription: descriptor,
  rawEvent: mockEvent,
});

expect(result.success).toBe(true);
expect(result.apiKeyId).toBeDefined();
```

### Test Idempotency
```typescript
// First call
const result1 = await issueApiKeyForSubscription(subscription);
expect(result1.isNew).toBe(true);
expect(result1.apiKey).toBeDefined();

// Second call (same subscription)
const result2 = await issueApiKeyForSubscription(subscription);
expect(result2.isNew).toBe(false);
expect(result2.apiKey).toBeUndefined();
expect(result2.apiKeyId).toBe(result1.apiKeyId); // Same key ID
```

## Common Patterns

### Pattern 1: Process Webhook
```typescript
const descriptor = extractPaddleSubscriptionDescriptor(payload);
if (!descriptor) return new Response("OK", { status: 200 });

const result = await handleSuccessfulSubscription({
  subscription: descriptor,
  rawEvent: event,
});

if (!result.success) {
  console.error(`Failed: ${result.error}`);
}

return new Response("OK", { status: 200 });
```

### Pattern 2: Check if Key is New
```typescript
const result = await issueApiKeyForSubscription(subscription);

if (result.success && result.isNew && result.apiKey) {
  // Send key to user via email
  await sendApiKeyEmail(result.userId, result.apiKey);
}
```

### Pattern 3: Log Safely
```typescript
const result = await issueApiKeyForSubscription(subscription);
logApiKeyIssuance(result); // Logs with masked key
```

## Database Tables Used

- `subscriptions` - Subscription records (Paddle-specific for now)
- `plans` - Plan configuration
- `apiKeys` - Generated API keys
- `users` - User information

## Future TODOs

- [ ] Extract Paddle-specific fields from webhook event
- [ ] Support multiple providers (DoDo, Stripe, etc.)
- [ ] Implement key rotation policy
- [ ] Add audit logging to database
- [ ] Add metrics and monitoring

---

**Last Updated**: March 20, 2026
