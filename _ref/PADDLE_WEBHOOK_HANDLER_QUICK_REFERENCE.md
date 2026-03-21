# Paddle Webhook Handler - Quick Reference

## Module Location
`src/lib/billing/paddleWebhookHandler.ts`

## Main Function

### `extractPaddleSubscriptionDescriptor(payload)`
Extracts a complete subscription descriptor from a Paddle webhook event.

**Input**: `PaddleWebhookPayload`
**Output**: `SubscriptionDescriptor | null`

**Returns null if**:
- Price ID is missing
- Price ID is unknown (not in mappings)
- User identifier (email or userId) is missing
- Plan slug cannot be determined
- Subscription status is unknown

**Example**:
```typescript
import { extractPaddleSubscriptionDescriptor } from '@/lib/billing/paddleWebhookHandler';

const payload = {
  event_type: 'subscription.activated',
  data: event.data
};

const descriptor = extractPaddleSubscriptionDescriptor(payload);
if (descriptor) {
  // Use descriptor to issue API key
  await handleSuccessfulPayment({
    provider: 'paddle',
    rawEvent: event,
    priceId: extractPaddlePriceId(payload),
    productKey: descriptor.productKey,
    userIdentifier: descriptor.userId,
    subscriptionId: descriptor.providerSubscriptionId,
  });
}
```

## Event Type Checking

### `isPaddleSubscriptionActivated(payload)`
Check if event represents an activated subscription (successful payment).

**Returns true if**:
- Event type is `subscription.activated`, `subscription.updated`, or `subscription.trialing`
- Status is `active` or `trialing`

**Example**:
```typescript
if (isPaddleSubscriptionActivated(payload)) {
  const descriptor = extractPaddleSubscriptionDescriptor(payload);
  // Process successful payment
}
```

### `isPaddleTransactionCompleted(payload)`
Check if event represents a completed transaction (one-time purchase).

**Returns true if**:
- Event type is `transaction.completed`
- Status is `completed`

**Example**:
```typescript
if (isPaddleTransactionCompleted(payload)) {
  const descriptor = extractPaddleSubscriptionDescriptor(payload);
  // Process successful payment
}
```

## Helper Functions

### `extractPaddlePriceId(payload)`
Get the price ID from a Paddle webhook payload.

```typescript
const priceId = extractPaddlePriceId(payload);
// Returns: "pri_01khwk19y0af40zae5fnysj5t3" or undefined
```

### `extractPaddleUserIdentifier(payload)`
Get the user identifier (userId or email) from a Paddle webhook payload.

```typescript
const userIdentifier = extractPaddleUserIdentifier(payload);
// Returns: "user_123" or "user@example.com" or undefined
```

### `extractPaddleSubscriptionId(payload)`
Get the subscription/transaction ID from a Paddle webhook payload.

```typescript
const subscriptionId = extractPaddleSubscriptionId(payload);
// Returns: "sub_123" or "txn_456" or undefined
```

## Type Definitions

### `PaddleWebhookPayload`
```typescript
interface PaddleWebhookPayload {
  event_type: PaddleEventType;
  data: PaddleSubscription | PaddleTransaction;
}
```

### `PaddleEventType`
```typescript
type PaddleEventType =
  | 'subscription.created'
  | 'subscription.activated'
  | 'subscription.trialing'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'subscription.past_due'
  | 'transaction.completed'
  | 'transaction.updated'
  | 'transaction.canceled'
  | string; // fallback
```

## Integration with Webhook Route

The webhook route (`src/app/api/webhooks/paddle/route.ts`) uses the handler like this:

```typescript
import {
  isPaddleSubscriptionActivated,
  isPaddleTransactionCompleted,
  extractPaddleSubscriptionDescriptor,
  type PaddleWebhookPayload,
} from '@/lib/billing/paddleWebhookHandler';

export async function POST(req: Request) {
  // ... verify signature ...

  const event = JSON.parse(rawBody);
  const type = event.event_type;

  // Handle subscription events
  if (type === 'subscription.activated' || type === 'subscription.updated') {
    const payload: PaddleWebhookPayload = {
      event_type: type as any,
      data: event.data,
    };

    if (!isPaddleSubscriptionActivated(payload)) {
      return new Response('OK', { status: 200 });
    }

    const descriptor = extractPaddleSubscriptionDescriptor(payload);
    if (!descriptor) {
      return new Response('OK', { status: 200 });
    }

    // Process successful payment
    await handleSuccessfulPayment({
      provider: 'paddle',
      rawEvent: event,
      priceId: event.data.items?.[0]?.price?.id || '',
      productKey: descriptor.productKey,
      userIdentifier: descriptor.userId,
      subscriptionId: descriptor.providerSubscriptionId,
    });
  }

  // Handle transaction events
  if (type === 'transaction.completed') {
    const payload: PaddleWebhookPayload = {
      event_type: type as any,
      data: event.data,
    };

    if (!isPaddleTransactionCompleted(payload)) {
      return new Response('OK', { status: 200 });
    }

    const descriptor = extractPaddleSubscriptionDescriptor(payload);
    if (!descriptor) {
      return new Response('OK', { status: 200 });
    }

    // Process successful payment
    await handleSuccessfulPayment({
      provider: 'paddle',
      rawEvent: event,
      priceId: event.data.items?.[0]?.price?.id || '',
      productKey: descriptor.productKey,
      userIdentifier: descriptor.userId,
      transactionId: descriptor.providerSubscriptionId,
    });
  }

  return new Response('OK', { status: 200 });
}
```

## Common Patterns

### Pattern 1: Check and Extract
```typescript
const payload: PaddleWebhookPayload = { event_type: type as any, data: event.data };

if (isPaddleSubscriptionActivated(payload)) {
  const descriptor = extractPaddleSubscriptionDescriptor(payload);
  if (descriptor) {
    // Process payment
  }
}
```

### Pattern 2: Extract with Fallback
```typescript
const descriptor = extractPaddleSubscriptionDescriptor(payload);
if (!descriptor) {
  console.warn('Failed to extract descriptor');
  return new Response('OK', { status: 200 }); // Don't retry
}

// Use descriptor
```

### Pattern 3: Get Individual Fields
```typescript
const priceId = extractPaddlePriceId(payload);
const userIdentifier = extractPaddleUserIdentifier(payload);
const subscriptionId = extractPaddleSubscriptionId(payload);

if (priceId && userIdentifier && subscriptionId) {
  // All required fields present
}
```

## Debugging

### Enable Detailed Logging
The module logs to console with `[extractPaddleSubscriptionDescriptor]` prefix.

**Successful extraction**:
```
[extractPaddleSubscriptionDescriptor] Extracted price ID: pri_01khwk19y0af40zae5fnysj5t3
[extractPaddleSubscriptionDescriptor] Mapped price ID → product key: grammar-master
[extractPaddleSubscriptionDescriptor] Mapped product key → plan slug: grammar-master-yearly-usd
[extractPaddleSubscriptionDescriptor] Extracted user identifier: user@example.com
[extractPaddleSubscriptionDescriptor] Extracted subscription ID: sub_123
[extractPaddleSubscriptionDescriptor] Mapped Paddle status → internal status: active
[extractPaddleSubscriptionDescriptor] Successfully extracted subscription descriptor: {...}
```

**Failed extraction**:
```
[extractPaddleSubscriptionDescriptor] Missing price ID in Paddle event: subscription.activated
```

### Check Mappings
If price ID is unknown:
```
[extractPaddleSubscriptionDescriptor] Unknown Paddle price ID: pri_unknown
Please add this price ID to src/lib/billing/priceMaps.ts
```

Add the price ID to `src/lib/billing/priceMaps.ts`:
```typescript
export const paddlePriceIdToProductKey: Record<string, ProductKey> = {
  "pri_unknown": "grammar-master",
};
```

## Error Handling

The module is conservative: if anything is missing or unknown, it returns `null`.

**The webhook route should**:
1. Check if extraction succeeded
2. If null, log warning and return 200 OK
3. If successful, call `handleSuccessfulPayment()`

**Never throw errors** - always return 200 OK to Paddle to prevent retries.

## Testing

### Test Successful Extraction
```typescript
const payload: PaddleWebhookPayload = {
  event_type: 'subscription.activated',
  data: {
    id: 'sub_123',
    status: 'active',
    items: [{ price: { id: 'pri_01khwk19y0af40zae5fnysj5t3' } }],
    custom_data: { userId: 'user_123' },
    customer: { email: 'user@example.com' }
  }
};

const descriptor = extractPaddleSubscriptionDescriptor(payload);
expect(descriptor).not.toBeNull();
expect(descriptor?.productKey).toBe('grammar-master');
expect(descriptor?.userId).toBe('user_123');
```

### Test Missing Field
```typescript
const payload: PaddleWebhookPayload = {
  event_type: 'subscription.activated',
  data: {
    id: 'sub_123',
    status: 'active',
    items: [{ price: { id: 'pri_unknown' } }], // Unknown price ID
    custom_data: {},
    customer: {}
  }
};

const descriptor = extractPaddleSubscriptionDescriptor(payload);
expect(descriptor).toBeNull();
```

---

**Last Updated**: March 20, 2026
