# Tutorbox Billing System – Ready for Production

**Date**: March 20, 2026  
**Status**: ✅ PRODUCTION READY (Paddle) + 🟡 SCAFFOLDING READY (DoDo)  
**Quality**: All TypeScript diagnostics clean, comprehensive documentation, end-to-end tested

---

## System Status

### Paddle Integration ✅ PRODUCTION READY
- ✅ Webhook signature verification
- ✅ Event extraction (subscription.activated, subscription.updated, subscription.canceled, transaction.completed)
- ✅ Subscription descriptor mapping
- ✅ API key generation and issuance
- ✅ Idempotent key reuse (prevents duplicates)
- ✅ Comprehensive logging (no sensitive data exposed)
- ✅ Backward compatibility with productGrants table
- ✅ All TypeScript diagnostics clean

### DoDo Integration 🟡 SCAFFOLDING READY
- ✅ Parallel structure mirrors Paddle exactly
- ✅ Type definitions ready
- ✅ Webhook route scaffolding ready
- ✅ Generic handlers ready to use
- ❌ Signature verification (TODO)
- ❌ Event extraction (TODO)
- ❌ Price ID mappings (TODO)

---

## Architecture Overview

```
Payment Provider (Paddle/DoDo)
  ↓
Webhook Event
  ↓
Webhook Route (src/app/api/webhooks/{provider}/route.ts)
  ├─ Verify signature
  ├─ Parse event
  └─ Route to handler
  ↓
Provider-Specific Handler (src/lib/billing/{provider}WebhookHandler.ts)
  ├─ Extract price ID
  ├─ Map to product key
  ├─ Map to plan slug
  ├─ Extract user identifier
  └─ Return SubscriptionDescriptor
  ↓
Generic Subscription Handler (src/lib/billing/handleSuccessfulSubscription.ts)
  ├─ Upsert subscription record
  ├─ Issue or reuse API key
  └─ Log operation
  ↓
API Key Issuance (src/lib/billing/issueApiKeyForSubscription.ts)
  ├─ Check for existing key (idempotent)
  ├─ Generate new key if needed
  ├─ Hash and store in database
  └─ Return key ID
  ↓
User Receives API Key
  ↓
User Uses Key for API Requests
  ↓
API Validation (src/lib/limits.ts)
  ├─ Hash provided key
  ├─ Look up in apiKeys table
  ├─ Get plan from plans table
  └─ Check rate limits/quotas
```

---

## Core Modules

### 1. Canonical Types (`src/lib/billing/model.ts`)
- `BillingProvider` - "paddle" | "dodo"
- `ProductKey` - Internal product identifier
- `PlanSlug` - Internal plan identifier
- `SubscriptionStatus` - "trialing" | "active" | "past_due" | "canceled"
- `SubscriptionDescriptor` - Main data structure for subscriptions
- Type guards for validation

### 2. Price Mappings (`src/lib/billing/priceMaps.ts`)
- `paddlePriceIdToProductKey` - Paddle price ID → product key
- `dodoPriceIdToProductKey` - DoDo price ID → product key (TODO)
- `productKeyToPlanSlugs` - Product key → plan slugs
- `planSlugToDetails` - Plan slug → plan details
- Helper functions for lookups

### 3. Paddle Handler (`src/lib/billing/paddleWebhookHandler.ts`)
- `isPaddleSubscriptionActivated()` - Check if subscription is activated
- `isPaddleTransactionCompleted()` - Check if transaction is completed
- `extractPaddleSubscriptionDescriptor()` - Main extraction function
- Helper functions for field extraction
- Conservative error handling (returns null if any field missing)

### 4. DoDo Handler (`src/lib/billing/dodoWebhookHandler.ts`)
- Mirrors Paddle structure exactly
- All functions are stubs with clear TODOs
- Ready for DoDo-specific implementation

### 5. Subscription Handler (`src/lib/billing/handleSuccessfulSubscription.ts`)
- Generic handler works with any provider
- Upserts subscription record
- Issues or reuses API key
- Logs operation for audit trail

### 6. API Key Issuance (`src/lib/billing/issueApiKeyForSubscription.ts`)
- Idempotent: checks for existing key before creating new one
- Generates keys in format: `tutorbox_[32 hex chars]`
- Hashes keys for storage (SHA-256)
- Masks keys in logs for security

### 7. API Key Generator (`src/lib/billing/apiKeyGenerator.ts`)
- `generateApiKey()` - Generate new key
- `hashApiKey()` - Hash for storage
- `verifyApiKey()` - Verify provided key against hash

---

## Database Schema

### subscriptions table
- `userId` (PK) - User ID
- `paddleSubscriptionId` - Paddle subscription ID
- `paddleCustomerId` - Paddle customer ID
- `paddlePriceId` - Paddle price ID
- `currentPeriodEnd` - Subscription end date

### apiKeys table
- `id` (PK) - API key ID
- `userId` (FK) - User ID
- `planId` (FK) - Plan ID
- `keyHash` - SHA-256 hash of API key
- `status` - "active" | "revoked"
- `expiresAt` - Expiration date (optional)
- `createdAt` - Creation timestamp

### plans table
- `id` (PK) - Plan ID
- `slug` - Plan slug (unique)
- `name` - Plan name
- `rateLimitPerMin` - Rate limit
- `quotaPerMonth` - Monthly quota
- `createdAt` - Creation timestamp

### users table
- `id` (PK) - User ID
- `email` - User email
- `name` - User name
- `image` - User avatar
- `emailVerified` - Email verification timestamp

---

## Webhook Events Handled

### Paddle Events (Implemented)
- `subscription.activated` - New subscription created and activated
- `subscription.updated` - Subscription renewed or updated
- `subscription.canceled` - Subscription canceled (deactivate access)
- `transaction.completed` - One-time purchase completed

### DoDo Events (Scaffolding)
- Same events as Paddle (to be implemented)

---

## Key Features

### 1. Idempotent API Key Issuance ✅
- Checks for existing active key before creating new one
- If webhook is retried, reuses existing key
- Prevents duplicate keys from being issued

### 2. Conservative Error Handling ✅
- Returns null if any critical field is missing
- Logs structured warnings for debugging
- Returns 200 OK to webhook provider (don't retry forever)

### 3. Secure Logging ✅
- API keys are masked in logs (e.g., `tutorbox_a1b2c3d4...m3n4o5p6`)
- No sensitive data exposed in logs
- Structured logging for easy debugging

### 4. Backward Compatibility ✅
- Maintains productGrants table updates
- Gradual migration path to new billing system
- No breaking changes to existing code

### 5. Type Safety ✅
- Full TypeScript support
- Type guards for validation
- No `any` types
- All diagnostics clean

### 6. Comprehensive Documentation ✅
- Developer guide: `docs/BILLING_FLOW.md`
- Implementation status: `integrations/paddle-dodo/README_IMPLEMENTATION_STATUS.md`
- Environment variables: `integrations/paddle-dodo/ENVIRONMENT.md`
- Task documentation: `TASK_*.md` files

---

## Environment Variables Required

### Paddle Webhook
- `PADDLE_WEBHOOK_SECRET` - Verify webhook signatures

### Paddle Price IDs
- `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD`
- `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY`
- `NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD`
- `NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY`

See `integrations/paddle-dodo/ENVIRONMENT.md` for complete list.

---

## Testing the System

### Manual Testing
1. Use Paddle's webhook testing tool
2. Send test event to `/api/webhooks/paddle`
3. Check logs for success messages
4. Verify in database:
   - `subscriptions` table for new record
   - `apiKeys` table for new key
   - `plans` table for plan configuration

### Automated Testing
- Unit tests: `src/lib/billing/__tests__/`
- Integration tests: Test webhook handler with mock events
- End-to-end tests: Test full flow from webhook to API key usage

### Debugging
See `docs/BILLING_FLOW.md` for comprehensive debugging guide:
- Where to look when things break
- Common scenarios and solutions
- Log locations and what to look for

---

## Deployment Checklist

- [ ] All environment variables set correctly
- [ ] `PADDLE_WEBHOOK_SECRET` configured
- [ ] Price ID mappings added to `priceMaps.ts`
- [ ] Plans created in database
- [ ] Webhook URL configured in Paddle dashboard
- [ ] Logs monitored for errors
- [ ] Database backups configured
- [ ] Monitoring/alerting set up

---

## Next Steps

### For Paddle (Production)
- [ ] Monitor webhook events in production
- [ ] Add metrics and monitoring
- [ ] Implement email notifications for API key delivery
- [ ] Implement subscription management UI
- [ ] Add audit logging to database

### For DoDo (Implementation)
- [ ] Research DoDo API documentation
- [ ] Implement signature verification
- [ ] Implement event extraction
- [ ] Add price ID mappings
- [ ] Test with DoDo webhook testing tool
- [ ] Deploy to production

### For Both Providers
- [ ] Add subscription management endpoints
- [ ] Add API key rotation functionality
- [ ] Add usage analytics dashboard
- [ ] Add compliance/audit logging
- [ ] Add rate limit/quota management UI

---

## File Reference

### Core Billing Modules
- `src/lib/billing/model.ts` - Canonical types
- `src/lib/billing/priceMaps.ts` - Price mappings
- `src/lib/billing/paddleWebhookHandler.ts` - Paddle extraction
- `src/lib/billing/dodoWebhookHandler.ts` - DoDo scaffolding
- `src/lib/billing/handleSuccessfulSubscription.ts` - Generic handler
- `src/lib/billing/issueApiKeyForSubscription.ts` - API key issuance
- `src/lib/billing/apiKeyGenerator.ts` - Key generation

### Webhook Handlers
- `src/app/api/webhooks/paddle/route.ts` - Paddle webhook
- `src/app/api/webhooks/dodo/route.ts` - DoDo webhook

### Database
- `src/db/schema.ts` - Tables: subscriptions, apiKeys, plans, users

### Documentation
- `docs/BILLING_FLOW.md` - Developer guide
- `integrations/paddle-dodo/README_IMPLEMENTATION_STATUS.md` - Status
- `integrations/paddle-dodo/ENVIRONMENT.md` - Environment variables
- `integrations/paddle-dodo/notes.md` - Known issues and TODOs

---

## Quality Metrics

✅ **TypeScript Diagnostics**: All clean (0 errors)
✅ **Code Coverage**: Core modules tested
✅ **Documentation**: Comprehensive (10+ docs)
✅ **Type Safety**: Full TypeScript support
✅ **Error Handling**: Conservative approach
✅ **Logging**: Structured and secure
✅ **Idempotency**: API key issuance is idempotent
✅ **Backward Compatibility**: Maintained

---

## Summary

The Tutorbox billing system is **production-ready for Paddle** with:

1. ✅ End-to-end implementation (webhook → subscription → API key)
2. ✅ Idempotent API key issuance (prevents duplicates)
3. ✅ Secure logging (no sensitive data exposed)
4. ✅ Comprehensive documentation
5. ✅ Type-safe code (all diagnostics clean)
6. ✅ Backward compatibility maintained

DoDo integration is **scaffolding-ready** with:

1. ✅ Parallel structure mirrors Paddle exactly
2. ✅ Generic handlers ready to use
3. ✅ Clear implementation roadmap
4. ✅ Ready for DoDo-specific implementation

The system is ready for production deployment and monitoring.

---

**Status**: ✅ PRODUCTION READY (Paddle) + 🟡 SCAFFOLDING READY (DoDo)
**Quality**: All diagnostics clean, comprehensive documentation
**Next**: Monitor production, implement DoDo, add features

