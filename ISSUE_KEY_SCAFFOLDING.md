# Issue API Key Scaffolding - Task 5 Complete

## Overview

Created a comprehensive scaffolding module for handling successful payments and issuing API keys. The module is safe, well-documented, and ready for real business logic to be plugged in.

## Files Created/Modified

### 1. New Module: `src/lib/billing/issueKeyFromWebhook.ts`

**Purpose**: Centralized handler for payment success events from webhooks

**Key Components**:

#### Type Definitions

```typescript
type ProviderWebhookContext = {
  provider: "paddle" | "dodo";
  rawEvent: unknown;
  priceId: string;
  productKey: string;
  userIdentifier: string;  // email or external user ID
  subscriptionId?: string;
  transactionId?: string;
};

type PaymentHandlingResult = {
  success: boolean;
  userId?: string;
  planSlug?: string;
  apiKeyId?: number;
  error?: string;
  reason?: string;
};
```

#### Main Functions

1. **`handleSuccessfulPayment(ctx)`** - Main entry point
   - Looks up userId from userIdentifier (email)
   - Maps productKey → planSlug
   - Issues API key for the plan
   - Logs the operation
   - Returns result with success/error

2. **`handleSubscriptionCancellation(ctx)`** - TODO
   - Revoke API keys
   - Update subscription status
   - Send notification

3. **`handleRefund(ctx)`** - TODO
   - Revoke API keys
   - Update subscription status
   - Send notification

4. **`handlePlanChange(ctx, newProductKey)`** - TODO
   - Update API key limits
   - Send notification

5. **`handleFreeTrial(ctx, trialDays)`** - TODO
   - Create trial API key with limited quota
   - Set expiration date

#### Helper Functions (Stubbed)

- `lookupUserIdFromIdentifier(userIdentifier)` - TODO: Query users table
- `mapProductKeyToPlanSlug(productKey)` - TODO: Implement mapping logic
- `issueApiKeyForPlan(userId, planId)` - TODO: Generate and store API key
- `logPaymentSuccess(info)` - Audit logging (safe, no secrets)

### 2. Updated: `src/app/api/webhooks/paddle/route.ts`

**Changes**:
- Imported `handleSuccessfulPayment` from scaffolding module
- Updated subscription.activated/updated handler to call scaffolding
- Updated transaction.completed handler to call scaffolding
- Extracts userEmail as fallback for userIdentifier
- Constructs ProviderWebhookContext object
- Calls handleSuccessfulPayment (currently logs TODO)
- Maintains legacy productGrants updates (for backward compatibility)

**Flow**:
```
Webhook Event
    ↓
Verify Signature
    ↓
Map priceId → productKey
    ↓
Extract userIdentifier (userId or email)
    ↓
Construct ProviderWebhookContext
    ↓
Call handleSuccessfulPayment(ctx)
    ↓
Log result
    ↓
Update productGrants (legacy)
    ↓
Return 200 OK
```

## Scaffolding Design

### Safe Defaults

1. **No Secrets Logged**: Logging function explicitly avoids logging API keys
2. **Fail-Safe**: Missing data → return error, don't proceed
3. **Audit Trail**: All operations logged for compliance
4. **Type-Safe**: Full TypeScript types for all functions

### Clear TODOs

Every function that needs implementation has:
- Clear TODO comment
- Explanation of what needs to be done
- Placeholder code (commented out)
- Example of expected behavior

### Extensible Structure

```
handleSuccessfulPayment(ctx)
├── lookupUserIdFromIdentifier(userIdentifier)
├── mapProductKeyToPlanSlug(productKey)
├── issueApiKeyForPlan(userId, planId)
└── logPaymentSuccess(info)
```

Each step can be implemented independently.

## Implementation Roadmap

### Phase 1: User Lookup (Priority: HIGH)
```typescript
// TODO: Implement in lookupUserIdFromIdentifier()
const user = await db.query.users.findFirst({
  where: eq(users.email, userIdentifier),
});
return user?.id;
```

### Phase 2: ProductKey → PlanSlug Mapping (Priority: HIGH)
```typescript
// TODO: Implement in mapProductKeyToPlanSlug()
// Consider:
// - Which plan to issue for this product
// - Currency (USD vs CNY)
// - Billing period (yearly vs monthly)
// - Free trials vs paid plans

const mapping: Record<string, string> = {
  "grammar-master": "grammar-master-yearly-usd",
  "lease-ai": "lease-ai-onetime-usd",
  "ai-prompter": "ai-prompter-yearly-cny",
};
```

### Phase 3: API Key Generation (Priority: HIGH)
```typescript
// TODO: Implement in issueApiKeyForPlan()
// - Generate random API key
// - Hash it for storage
// - Store in database
// - Return unhashed key to send to user
// - Set expiration if needed

const apiKey = generateApiKey();
const keyHash = hashApiKey(apiKey);
const result = await db.insert(apiKeys).values({
  userId,
  planId,
  keyHash,
  status: "active",
});
```

### Phase 4: Audit Logging (Priority: MEDIUM)
```typescript
// TODO: Implement in logPaymentSuccess()
// Store in audit log table:
// - provider, userId, productKey, planSlug
// - timestamp, status
// - Do NOT log: API keys, secrets
```

### Phase 5: Cancellation Handling (Priority: MEDIUM)
```typescript
// TODO: Implement handleSubscriptionCancellation()
// - Lookup userId
// - Revoke API keys
// - Update subscription status
// - Send notification
```

### Phase 6: Refund Handling (Priority: MEDIUM)
```typescript
// TODO: Implement handleRefund()
// - Similar to cancellation
// - May need different notification
```

### Phase 7: Plan Changes (Priority: LOW)
```typescript
// TODO: Implement handlePlanChange()
// - Update API key limits
// - Send notification
```

### Phase 8: Free Trials (Priority: LOW)
```typescript
// TODO: Implement handleFreeTrial()
// - Create trial API key with limited quota
// - Set expiration date
```

## Current State

### What Works
- ✅ Webhook receives payment event
- ✅ Signature verification
- ✅ Price ID → Product Key mapping
- ✅ User identifier extraction
- ✅ Context object construction
- ✅ Scaffolding function calls
- ✅ Logging and error handling
- ✅ Legacy productGrants updates

### What's Stubbed (TODO)
- ❌ User lookup from email
- ❌ ProductKey → PlanSlug mapping
- ❌ API key generation and storage
- ❌ Audit logging to database
- ❌ Subscription cancellation
- ❌ Refund handling
- ❌ Plan upgrades/downgrades
- ❌ Free trial handling

## Testing Checklist

### Unit Tests (TODO)
- [ ] `lookupUserIdFromIdentifier()` with valid email
- [ ] `lookupUserIdFromIdentifier()` with invalid email
- [ ] `mapProductKeyToPlanSlug()` with valid product
- [ ] `mapProductKeyToPlanSlug()` with invalid product
- [ ] `issueApiKeyForPlan()` success case
- [ ] `issueApiKeyForPlan()` error case

### Integration Tests (TODO)
- [ ] Paddle webhook → handleSuccessfulPayment → API key created
- [ ] DoDo webhook → handleSuccessfulPayment → API key created
- [ ] Missing userId → error logged, no key created
- [ ] Unknown productKey → error logged, no key created
- [ ] Subscription cancellation → API key revoked
- [ ] Refund → API key revoked

### Manual Testing (TODO)
- [ ] Test with Paddle sandbox
- [ ] Test with DoDo sandbox
- [ ] Verify logs are clear and actionable
- [ ] Verify no secrets are logged
- [ ] Verify audit trail is complete

## Security Considerations

1. **No Secrets in Logs**: API keys never logged
2. **Fail-Safe**: Conservative approach prevents accidental grants
3. **Audit Trail**: All operations logged for compliance
4. **Type-Safe**: TypeScript prevents type errors
5. **Error Handling**: Clear error messages without exposing internals

## Performance Considerations

1. **Database Queries**: Optimize user lookup (index on email)
2. **Caching**: Consider caching plan mappings
3. **Async**: All operations are async-ready
4. **Logging**: Structured logging for easy parsing

## Monitoring & Debugging

### Logs to Watch
```
[handleSuccessfulPayment] Processing payment: productKey=..., userIdentifier=...
[handleSuccessfulPayment] Found userId: ...
[handleSuccessfulPayment] Mapped productKey → planSlug: ...
[handleSuccessfulPayment] Found plan: ...
[handleSuccessfulPayment] Successfully issued API key: keyId=...
[Payment Success] { provider, userId, productKey, planSlug, ... }
```

### Error Logs to Watch
```
[handleSuccessfulPayment] User not found for identifier: ...
[handleSuccessfulPayment] Cannot map productKey to planSlug: ...
[handleSuccessfulPayment] Plan not found: ...
[handleSuccessfulPayment] Failed to issue API key: ...
[handleSuccessfulPayment] Unexpected error: ...
```

## Related Files

- **Billing Maps**: `src/lib/billing/priceMaps.ts` - Price ID mappings
- **Paddle Webhook**: `src/app/api/webhooks/paddle/route.ts` - Webhook handler
- **DoDo Webhook**: `src/app/api/webhooks/dodo/route.ts` - DoDo template
- **Database Schema**: `src/db/schema.ts` - Tables (users, apiKeys, plans)
- **App Registry**: `src/config/apps.ts` - Product configuration

## Summary

The scaffolding module provides:
- ✅ Safe, well-documented structure
- ✅ Clear separation of concerns
- ✅ Type-safe interfaces
- ✅ Comprehensive TODOs
- ✅ Ready for real business logic
- ✅ Backward compatible with legacy code
- ✅ Audit logging capability
- ✅ Error handling and logging

The webhook handlers now:
- ✅ Call the scaffolding function
- ✅ Pass complete context
- ✅ Log results
- ✅ Maintain backward compatibility
- ✅ Ready for API key issuance

Next step: Implement the TODO functions with real business logic.
