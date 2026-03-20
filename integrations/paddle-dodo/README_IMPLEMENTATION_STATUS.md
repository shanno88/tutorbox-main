# Paddle/DoDo Integration – Implementation Status

**Last Updated**: March 20, 2026

## Overview

This document describes the current implementation status of Paddle and DoDo payment integrations in the Tutorbox billing system.

---

## Implementation Status Summary

### ✅ Paddle – FULLY IMPLEMENTED

**Status**: Production Ready

**What's Implemented**:
- ✅ Webhook handler: `src/app/api/webhooks/paddle/route.ts`
- ✅ Event extraction: `src/lib/billing/paddleWebhookHandler.ts`
- ✅ Subscription descriptor extraction
- ✅ Price ID → Product Key mapping
- ✅ API key issuance: `src/lib/billing/issueApiKeyForSubscription.ts`
- ✅ Generic subscription handler: `src/lib/billing/handleSuccessfulSubscription.ts`
- ✅ Signature verification
- ✅ Error handling and logging

**Events Handled**:
- `subscription.activated` → Issue API key
- `subscription.updated` → Update subscription
- `subscription.canceled` → Deactivate access
- `transaction.completed` → Issue API key (one-time purchases)

**Flow**:
```
Paddle Webhook
  ↓
Extract SubscriptionDescriptor
  ↓
Call handleSuccessfulSubscription()
  ↓
Upsert subscription record + Issue API key
  ↓
Return 200 OK
```

### 🟡 DoDo – SCAFFOLDING ONLY

**Status**: Structure Ready, Implementation TODO

**What's Scaffolded**:
- ✅ Webhook handler: `src/app/api/webhooks/dodo/route.ts`
- ✅ Event extraction: `src/lib/billing/dodoWebhookHandler.ts`
- ✅ Type definitions for DoDo payloads
- ✅ Helper functions (stubs)
- ✅ Event type checking (stubs)
- ✅ Error handling structure

**What's NOT Implemented**:
- ❌ `extractDodoSubscriptionDescriptor()` - Returns null with TODO
- ❌ `isDodoSubscriptionActivated()` - Returns false with TODO
- ❌ `isDodoTransactionCompleted()` - Returns false with TODO
- ❌ DoDo price ID mappings
- ❌ Signature verification
- ❌ Status mapping

**Events to Handle** (TODO):
- `subscription.activated` → Issue API key
- `subscription.updated` → Update subscription
- `subscription.canceled` → Deactivate access
- `transaction.completed` → Issue API key (one-time purchases)

**Next Steps**:
1. Determine DoDo webhook event types and structure
2. Implement signature verification
3. Implement `extractDodoSubscriptionDescriptor()`
4. Add DoDo price ID mappings to `src/lib/billing/priceMaps.ts`
5. Test with real DoDo webhook events

---

## Production Billing Modules

### Core Modules
- **`src/lib/billing/model.ts`** - Canonical billing types ✅
- **`src/lib/billing/priceMaps.ts`** - Price ID mappings (Paddle ✅, DoDo 🟡)
- **`src/lib/billing/paddleWebhookHandler.ts`** - Paddle event extraction ✅
- **`src/lib/billing/dodoWebhookHandler.ts`** - DoDo event extraction 🟡
- **`src/lib/billing/handleSuccessfulSubscription.ts`** - Generic subscription handler ✅
- **`src/lib/billing/issueApiKeyForSubscription.ts`** - API key issuance ✅
- **`src/lib/billing/apiKeyGenerator.ts`** - API key generation ✅

### Webhook Handlers
- **`src/app/api/webhooks/paddle/route.ts`** - Paddle webhook handler ✅
- **`src/app/api/webhooks/dodo/route.ts`** - DoDo webhook handler 🟡

---

## Paddle Implementation Details

### Webhook Handler Flow
```
1. Verify webhook signature (PADDLE_WEBHOOK_SECRET)
2. Parse event as PaddleWebhookPayload
3. Check if event represents successful payment
   - isPaddleSubscriptionActivated() for subscriptions
   - isPaddleTransactionCompleted() for transactions
4. Extract SubscriptionDescriptor
   - Extract price ID
   - Map price ID → product key
   - Map product key → plan slug
   - Extract user identifier
   - Map subscription status
5. Call handleSuccessfulSubscription()
   - Upsert subscription record
   - Issue or reuse API key
   - Log operation
6. Return 200 OK to Paddle
```

### Key Features
- **Idempotent**: Reuses existing API keys instead of creating duplicates
- **Safe**: No sensitive data logged (keys masked)
- **Conservative**: Fails safely if any critical field is missing
- **Logged**: All operations logged for audit trail

---

## DoDo Hello World Verification

### What It Is
A dev-only test endpoint (`src/app/api/test/dodo-webhook/route.ts`) that verifies the DoDo webhook scaffolding compiles and runs without errors. This endpoint accepts a fake DoDo webhook payload and runs it through the entire handler chain to confirm all TODO stubs are hit and error handling works.

### Why It Matters
Before implementing real DoDo integration, we need to verify that:
1. The scaffolding code compiles without TypeScript errors
2. All TODO stubs are actually being called (not silently ignored)
3. The error handling structure works
4. The generic handlers (`handleSuccessfulSubscription`, `issueApiKeyForSubscription`) are ready to use

### How to Use It

**GET endpoint** (shows instructions):
```bash
curl http://localhost:3000/api/test/dodo-webhook
```

**POST endpoint** (runs test with hardcoded payload):
```bash
curl -X POST http://localhost:3000/api/test/dodo-webhook \
  -H "Content-Type: application/json"
```

**POST endpoint** (runs test with custom payload):
```bash
curl -X POST http://localhost:3000/api/test/dodo-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "subscription.activated",
    "data": {
      "id": "dodo_sub_123",
      "status": "active",
      "items": [{"price": {"id": "dodo_price_grammar_yearly"}}],
      "custom_data": {"userId": "user_123"},
      "customer": {"email": "user@example.com", "id": "dodo_cust_123"}
    }
  }'
```

### What It Proves

✅ **Code Compiles**: All DoDo handler code compiles without TypeScript errors
✅ **TODO Stubs Hit**: All TODO stubs are called and logged (not silently ignored)
✅ **Error Handling Works**: Try/catch blocks work, errors are logged properly
✅ **Generic Handlers Ready**: `handleSuccessfulSubscription()` and `issueApiKeyForSubscription()` are ready to use
✅ **Logging Works**: Structured logging with `[billing:*]` prefixes works correctly

### Expected Response

```json
{
  "status": "ok",
  "message": "DoDo webhook test completed",
  "steps": {
    "step1_isActivated": false,
    "step2_descriptor": null,
    "step3_result": null
  },
  "notes": [
    "✅ Code compiles and runs without errors",
    "✅ All TODO stubs are hit and logged",
    "⚠️ isDodoSubscriptionActivated() returns false (not implemented)",
    "⚠️ extractDodoSubscriptionDescriptor() returns null (not implemented)",
    "ℹ️ handleSuccessfulSubscription() would process if descriptor was valid"
  ]
}
```

### What Still Needs Real DoDo API Knowledge

❌ **Signature Verification**: Need DoDo webhook secret and signature algorithm
❌ **Event Type Checking**: Need to know real DoDo event types and structure
❌ **Descriptor Extraction**: Need to know DoDo field names and structure
❌ **Price Mappings**: Need to map DoDo price IDs to product keys
❌ **Status Mapping**: Need to map DoDo subscription statuses to internal statuses
❌ **User Identifier**: Need to know how DoDo identifies users (email, ID, custom field, etc.)

### How to Proceed with Real DoDo Implementation

1. **Get DoDo API Documentation**
   - Review DoDo webhook event structure
   - Determine event types (subscription.activated, etc.)
   - Get webhook secret for signature verification

2. **Update Type Definitions**
   - Update `DodoEventType` enum with real event types
   - Update `DodoSubscription` and `DodoTransaction` interfaces with real fields
   - Update `DodoWebhookPayload` with real structure

3. **Implement Signature Verification**
   - Get `DODO_WEBHOOK_SECRET` from environment
   - Implement `verifyDodoWebhook()` function
   - Add to webhook handler before business logic

4. **Implement Event Type Checking**
   - Implement `isDodoSubscriptionActivated()` with real logic
   - Implement `isDodoTransactionCompleted()` with real logic
   - Update `mapDodoStatusToInternal()` with real status mapping

5. **Implement Descriptor Extraction**
   - Implement `extractDodoSubscriptionDescriptor()` with real field extraction
   - Extract price ID, user identifier, subscription ID
   - Map to internal `SubscriptionDescriptor` type

6. **Add Price Mappings**
   - Add DoDo price IDs to `src/lib/billing/priceMaps.ts`
   - Update `dodoPriceIdToProductKey` mapping
   - Test with real DoDo price IDs

7. **Test with Real DoDo**
   - Use DoDo's webhook testing tool
   - Monitor logs for extraction success/failure
   - Verify API keys are issued correctly
   - Test subscription updates and cancellations

### Files Involved

- **Test Endpoint**: `src/app/api/test/dodo-webhook/route.ts`
- **DoDo Handler**: `src/lib/billing/dodoWebhookHandler.ts` (stubs to implement)
- **Webhook Route**: `src/app/api/webhooks/dodo/route.ts` (structure ready)
- **Generic Handlers**: `src/lib/billing/handleSuccessfulSubscription.ts` (ready to use)
- **Price Mappings**: `src/lib/billing/priceMaps.ts` (DoDo section TODO)

---

## DoDo Scaffolding Details

### Webhook Handler Structure
```
1. TODO: Verify webhook signature (DODO_WEBHOOK_SECRET)
2. Parse event as DodoWebhookPayload
3. TODO: Check if event represents successful payment
   - isDodoSubscriptionActivated() for subscriptions (stub)
   - isDodoTransactionCompleted() for transactions (stub)
4. TODO: Extract SubscriptionDescriptor
   - Extract price ID (stub)
   - Map price ID → product key (TODO)
   - Map product key → plan slug (ready)
   - Extract user identifier (stub)
   - Map subscription status (stub)
5. Call handleSuccessfulSubscription() (ready)
   - Upsert subscription record (ready)
   - Issue or reuse API key (ready)
   - Log operation (ready)
6. Return 200 OK to DoDo
```

### Ready for Implementation
- ✅ Generic subscription handler
- ✅ API key issuance
- ✅ Error handling structure
- ✅ Logging structure
- ✅ Database operations

### Needs Implementation
- ❌ DoDo signature verification
- ❌ DoDo event type checking
- ❌ DoDo subscription descriptor extraction
- ❌ DoDo price ID mappings
- ❌ DoDo status mapping

---

## Comparison: Paddle vs DoDo

| Aspect | Paddle | DoDo |
|--------|--------|------|
| **Status** | ✅ Production Ready | 🟡 Scaffolding |
| **Webhook Handler** | Implemented | Implemented (structure) |
| **Event Extraction** | Implemented | Stub (returns null) |
| **Signature Verification** | Implemented | TODO |
| **Price Mappings** | Implemented | TODO |
| **API Key Issuance** | Implemented | Ready (generic) |
| **Error Handling** | Implemented | Ready (generic) |
| **Logging** | Implemented | Ready (generic) |
| **Testing** | Ready for production | Ready for implementation |

---

## How to Implement DoDo

### Step 1: Determine DoDo Webhook Structure
- Review DoDo API documentation
- Determine event types and field names
- Update `DodoEventType` and `DodoSubscription`/`DodoTransaction` interfaces

### Step 2: Implement Signature Verification
- Get DoDo webhook secret from environment
- Implement `verifyDodoWebhook()` function
- Add to webhook handler

### Step 3: Implement Event Type Checking
- Implement `isDodoSubscriptionActivated()`
- Implement `isDodoTransactionCompleted()`
- Update status mapping in `mapDodoStatusToInternal()`

### Step 4: Implement Subscription Descriptor Extraction
- Implement `extractDodoSubscriptionDescriptor()`
- Extract price ID, user identifier, subscription ID
- Map to internal types

### Step 5: Add Price ID Mappings
- Add DoDo price IDs to `src/lib/billing/priceMaps.ts`
- Update `dodoPriceIdToProductKey` mapping
- Update `productKeyToPlanSlugs` if needed

### Step 6: Test
- Use DoDo's webhook testing tool
- Monitor logs for extraction success/failure
- Verify API keys are issued correctly

---

## Files to Review

### Paddle Implementation (Reference)
- `src/lib/billing/paddleWebhookHandler.ts` - Event extraction
- `src/app/api/webhooks/paddle/route.ts` - Webhook handler
- `src/lib/billing/priceMaps.ts` - Price mappings

### DoDo Scaffolding (To Implement)
- `src/lib/billing/dodoWebhookHandler.ts` - Event extraction (stubs)
- `src/app/api/webhooks/dodo/route.ts` - Webhook handler (structure)
- `src/lib/billing/priceMaps.ts` - Price mappings (TODO)

### Generic Handlers (Ready to Use)
- `src/lib/billing/handleSuccessfulSubscription.ts` - Subscription handler
- `src/lib/billing/issueApiKeyForSubscription.ts` - API key issuance

---

## Documentation

### Comprehensive Guides
- `TASK_8_PADDLE_WEBHOOK_HANDLER.md` - Paddle webhook handler details
- `TASK_9_HANDLE_SUCCESSFUL_SUBSCRIPTION.md` - Generic subscription handler
- `TASK_10_DODO_SCAFFOLDING.md` - DoDo scaffolding details (this task)

### Quick References
- `PADDLE_WEBHOOK_HANDLER_QUICK_REFERENCE.md` - Paddle quick reference
- `TASK_9_QUICK_REFERENCE.md` - Subscription handler quick reference

### Integration Flows
- `PADDLE_WEBHOOK_INTEGRATION_FLOW.md` - Complete Paddle flow diagram

---

## Summary

**Paddle**: ✅ Production-ready end-to-end implementation
- Webhook handler fully implemented
- Event extraction fully implemented
- API key issuance fully implemented
- Ready for production deployment

**DoDo**: 🟡 Scaffolding ready for implementation
- Webhook handler structure in place
- Event extraction stubs ready
- Generic handlers ready to use
- Needs DoDo-specific implementation

**Next Phase**: Implement DoDo integration following the Paddle pattern

---

**Status**: Task 10 Complete
**Quality**: Scaffolding Ready
**Next**: DoDo Implementation
