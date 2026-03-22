# Billing Flow – Developer Guide

**For**: New engineers debugging or extending the Tutorbox billing system  
**Last Updated**: March 20, 2026

---

## Observability & Logging

### Structured Logging

All billing operations use structured logging with consistent prefixes:

```
[billing:webhook:paddle] - Paddle webhook events
[billing:webhook:dodo] - DoDo webhook events
[billing:subscription] - Subscription handling
[billing:apikey] - API key operations
[billing:health] - Health check operations
```

**Example logs**:
```
2026-03-20T10:30:45.123Z [billing:webhook:paddle] Received event: subscription.activated
2026-03-20T10:30:45.234Z [billing:subscription] Processing successful subscription: userId=user_123, productKey=grammar-master, planSlug=grammar-master-yearly-usd
2026-03-20T10:30:45.345Z [billing:apikey] API key newly created: keyId=42, key=tutorbox_a1b2c3d4...m3n4o5p6
```

### Filtering Logs

To filter billing logs in your logs aggregator:

```
# All billing operations
filter: "billing:"

# Paddle webhooks only
filter: "billing:webhook:paddle"

# Subscription handling
filter: "billing:subscription"

# API key operations
filter: "billing:apikey"

# Errors only
filter: "billing:" AND level:error
```

### Metrics Tracking

The system tracks these metrics (log-based for now):

- **Successful Payments**: `recordSuccessfulPayment(provider, productKey, planSlug)`
- **Failed Payments**: `recordFailedPayment(provider, reason, details)`
- **API Keys Issued**: `recordApiKeyOperation(true, userId, planSlug)`
- **API Keys Reused**: `recordApiKeyOperation(false, userId, planSlug)`
- **Webhook Errors**: `recordWebhookError(provider, errorType, message)`

**Example metrics logs**:
```
[billing:webhook:payment] Successful payment recorded: provider=paddle, productKey=grammar-master, planSlug=grammar-master-yearly-usd, totalSuccessful=42
[billing:webhook:payment] Failed payment recorded: provider=paddle, reason=extraction_failed, count=3
[billing:apikey] API key issued: userId=user_123, planSlug=grammar-master-yearly-usd, totalIssued=100
[billing:apikey] API key reused: userId=user_456, planSlug=lease-ai-onetime-usd, totalReused=25
```

### Health Check Endpoint

Call `/api/billing/health` to verify system status:

```bash
curl https://your-app.com/api/billing/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-20T10:30:45.123Z",
  "checks": {
    "database": {
      "status": "ok",
      "message": "Database connectivity OK"
    },
    "priceMappings": {
      "status": "ok",
      "message": "Price mappings configured",
      "productCount": 4,
      "planCount": 6
    },
    "webhookSecrets": {
      "status": "ok",
      "message": "Webhook secrets configured for: Paddle"
    },
    "apiKeys": {
      "status": "ok",
      "message": "API keys table accessible (42 active keys)",
      "count": 42
    }
  },
  "metrics": {
    "successfulPayments": 100,
    "failedPayments": 3,
    "apiKeysIssued": 100,
    "apiKeysReused": 25
  }
}
```

---

## Quick Overview

The Tutorbox billing system processes payments from Paddle (and soon DoDo) to issue API keys to users. Here's the complete flow:

```
User purchases on Paddle
  ↓
Paddle sends webhook event
  ↓
Webhook handler verifies signature & extracts SubscriptionDescriptor
  ↓
handleSuccessfulSubscription() upserts subscription & issues API key
  ↓
User receives API key; validation uses planSlug/productKey model
```

---

## Webhook Events We Rely On

### Paddle Events (Implemented)

**Subscription Events**:
- `subscription.activated` – New subscription created and activated
- `subscription.updated` – Subscription renewed or updated
- `subscription.canceled` – Subscription canceled (deactivate access)

**Transaction Events**:
- `transaction.completed` – One-time purchase completed

**Why These?**
- `activated` and `updated` indicate successful payment → issue API key
- `canceled` indicates subscription ended → revoke access
- `transaction.completed` handles one-time purchases (e.g., Lease AI)

### DoDo Events (Scaffolding)

Same events as Paddle (to be implemented):
- `subscription.activated`, `subscription.updated`, `subscription.canceled`
- `transaction.completed`

---

## The Complete Flow

### 1. Paddle Sends Webhook

```
POST /api/webhooks/paddle
{
  "event_type": "subscription.activated",
  "data": {
    "id": "sub_123",
    "status": "active",
    "items": [{ "price": { "id": "pri_01khwk19y0af40zae5fnysj5t3" } }],
    "custom_data": { "userId": "user_123" },
    "customer": { "email": "user@example.com" }
  }
}
```

### 2. Webhook Route Verifies & Parses

**File**: `src/app/api/webhooks/paddle/route.ts`

```typescript
// 1. Verify signature using PADDLE_WEBHOOK_SECRET
const isValid = await verifyPaddleWebhook(rawBody, signature);
if (!isValid) return 400; // Invalid signature

// 2. Parse event
const event = JSON.parse(rawBody);
const type = event.event_type;

// 3. Check if event is "activated/paid"
if (type === "subscription.activated" || type === "subscription.updated") {
  // Continue to extraction...
}
```

### 3. Extract SubscriptionDescriptor

**File**: `src/lib/billing/paddleWebhookHandler.ts`

```typescript
const descriptor = extractPaddleSubscriptionDescriptor(payload);
// Returns:
// {
//   provider: "paddle",
//   providerSubscriptionId: "sub_123",
//   userId: "user_123",
//   productKey: "grammar-master",
//   planSlug: "grammar-master-yearly-usd",
//   status: "active"
// }
```

**What happens inside**:
1. Extract price ID: `pri_01khwk19y0af40zae5fnysj5t3`
2. Map to product key: `getProductKeyFromPaddlePriceId()` → `"grammar-master"`
3. Map to plan slug: `getPlanSlugsForProduct()` → `"grammar-master-yearly-usd"`
4. Extract user: `user_123` (or email if no userId)
5. Map status: `"active"` → `"active"`

### 4. Handle Successful Subscription

**File**: `src/lib/billing/handleSuccessfulSubscription.ts`

```typescript
const result = await handleSuccessfulSubscription({
  subscription: descriptor,
  rawEvent: event
});
```

**What happens inside**:
1. **Upsert subscription record** in `subscriptions` table
   - Stores Paddle subscription ID for reconciliation
   - Updates if subscription already exists

2. **Issue or reuse API key** via `issueApiKeyForSubscription()`
   - Checks if active API key already exists for user+plan
   - If yes: reuse existing key (idempotent)
   - If no: generate new key, hash it, store in `apiKeys` table

3. **Log operation** for audit trail
   - Logs with masked key (e.g., `tutorbox_a1b2c3d4...m3n4o5p6`)
   - No sensitive data exposed

### 5. User Receives & Uses API Key

**API Key Format**: `tutorbox_[32 hex chars]`

**User receives key via**:
- Email (TODO: implement)
- Dashboard (TODO: implement)

**User uses key for API requests**:
```
GET /api/grammar-check
Authorization: Bearer tutorbox_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Validation uses same model**:
- Hash the provided key
- Look up in `apiKeys` table by hash
- Get `planId` from API key record
- Look up plan by ID to get `planSlug`
- Use `planSlug` to check rate limits/quotas

---

## Key Files & Their Roles

### Webhook Handler
- **`src/app/api/webhooks/paddle/route.ts`** – Entry point, signature verification, event routing

### Event Extraction
- **`src/lib/billing/paddleWebhookHandler.ts`** – Parse Paddle events, extract SubscriptionDescriptor
- **`src/lib/billing/dodoWebhookHandler.ts`** – (Scaffolding) Parse DoDo events

### Business Logic
- **`src/lib/billing/handleSuccessfulSubscription.ts`** – Upsert subscription, issue API key
- **`src/lib/billing/issueApiKeyForSubscription.ts`** – Generate/reuse API keys (idempotent)

### Mappings & Types
- **`src/lib/billing/priceMaps.ts`** – Price ID → Product Key → Plan Slug mappings
- **`src/lib/billing/model.ts`** – Canonical billing types (SubscriptionDescriptor, etc.)
- **`src/lib/billing/apiKeyGenerator.ts`** – Generate, hash, verify API keys

### Database
- **`src/db/schema.ts`** – Tables: `subscriptions`, `apiKeys`, `plans`, `users`

---

## Debugging: Where to Look When Things Break

### Issue: "User not receiving API key"

**Check these files in order**:

1. **Webhook received?**
   - Look at logs: `[billing:webhook:paddle] Received event: subscription.activated`
   - Check Paddle dashboard: webhook delivery status

2. **Signature verification failed?**
   - Logs: `[billing:webhook:paddle] Invalid webhook signature`
   - Check: `PADDLE_WEBHOOK_SECRET` env var is set correctly

3. **Extraction failed?**
   - Logs: `[billing:webhook:paddle] Missing price ID`
   - Check: Price ID is in `src/lib/billing/priceMaps.ts` mappings
   - Check: `getProductKeyFromPaddlePriceId()` returns a value

4. **API key not issued?**
   - Logs: `[billing:apikey] Plan not found: grammar-master-yearly-usd`
   - Check: Plan exists in `plans` table with correct slug
   - Check: `src/lib/billing/priceMaps.ts` has correct plan slug mapping

5. **API key issued but user can't use it?**
   - Check: API key is in `apiKeys` table
   - Check: Key hash matches (use `verifyApiKey()` function)
   - Check: Plan has correct rate limits/quotas in `plans` table

### Issue: "Duplicate API keys created"

**This shouldn't happen** – `issueApiKeyForSubscription()` is idempotent:
- Checks for existing active key before creating new one
- If webhook is retried, reuses existing key

**If it happens anyway**:
- Check logs: `[issueApiKeyForSubscription] Found existing active API key`
- If not logged, check: `apiKeys` table for user+plan combination
- Verify: `status = 'active'` in database

### Issue: "Webhook returns 500 error"

**Check logs for**:
- `[webhooks/paddle] Unexpected error:` – Unhandled exception
- `[handleSuccessfulSubscription] Unexpected error:` – Business logic error
- `[issueApiKeyForSubscription] Error issuing API key:` – Database error

**Common causes**:
- Database connection failed
- Plan not found in database
- User not found in database
- Environment variables not set

### Issue: "Price ID not recognized"

**Check**:
1. Logs: `[extractPaddleSubscriptionDescriptor] Unknown Paddle price ID: pri_xxx`
2. File: `src/lib/billing/priceMaps.ts`
3. Add missing price ID to `paddlePriceIdToProductKey` mapping
4. Restart webhook handler

---

## Log Locations & What to Look For

### Application Logs
- **Webhook handler**: `[billing:webhook:paddle]` prefix
- **Event extraction**: `[billing:webhook:paddle]` prefix (detailed extraction logs)
- **Subscription handling**: `[billing:subscription]` prefix
- **API key issuance**: `[billing:apikey]` prefix
- **Health checks**: `[billing:health]` prefix

### Key Log Lines to Monitor

**Success indicators**:
```
[billing:webhook:paddle] Received event: subscription.activated
[billing:webhook:paddle] Successfully extracted subscription descriptor
[billing:subscription] Processing successful subscription
[billing:apikey] API key newly created: keyId=42
[billing:webhook:payment] Successful payment recorded
```

**Error indicators**:
```
[billing:webhook:paddle] Invalid webhook signature
[billing:webhook:paddle] Unknown Paddle price ID
[billing:subscription] Failed to handle subscription
[billing:apikey] Plan not found
[billing:webhook:payment] Failed payment recorded
```

### Database Logs
- Check `subscriptions` table: subscription records
- Check `apiKeys` table: issued API keys
- Check `plans` table: plan configuration
- Check `users` table: user records

### Paddle Dashboard
- Webhook delivery status
- Event details
- Retry history

---

## Common Scenarios

### Scenario 1: New Product Added

**Steps**:
1. Add product to `src/config/apps.ts`
2. Add price ID mapping to `src/lib/billing/priceMaps.ts`
3. Add plan to database `plans` table
4. Add plan slug mapping to `priceMaps.ts`
5. Test with Paddle webhook testing tool

### Scenario 2: Price ID Changed

**Steps**:
1. Update `src/lib/billing/priceMaps.ts`
2. Restart webhook handler
3. Test with new price ID

### Scenario 3: User Can't Use API Key

**Steps**:
1. Verify API key exists in `apiKeys` table
2. Verify key hash is correct
3. Verify plan exists in `plans` table
4. Verify plan has correct rate limits/quotas
5. Check API validation logic in `src/lib/limits.ts`

### Scenario 4: Webhook Processing Slow

**Steps**:
1. Check database performance
2. Monitor logs for slow operations
3. Check `[billing:subscription]` and `[billing:apikey]` logs
4. Verify database indexes on `apiKeys` and `subscriptions` tables

### Scenario 5: System Health Check

**Steps**:
1. Call `/api/billing/health` endpoint
2. Check each component status
3. Review metrics for anomalies
4. Monitor logs for `[billing:health]` messages

---

## Environment Variables

**Required for Paddle**:
- `PADDLE_WEBHOOK_SECRET` – Verify webhook signatures
- `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD` – Price ID for Grammar Master
- (Other price IDs as needed)

**Check**:
- `.env` file has all required variables
- Values match Paddle dashboard
- Restart app after changing env vars
- Call `/api/billing/health` to verify secrets are present

---

## Testing the Flow

### Manual Testing

1. **Use Paddle's webhook testing tool**:
   - Go to Paddle dashboard → Webhooks
   - Send test event to `/api/webhooks/paddle`
   - Check logs for success

2. **Monitor logs**:
   ```
   [webhooks/paddle] Received event: subscription.activated
   [extractPaddleSubscriptionDescriptor] Successfully extracted subscription descriptor
   [handleSuccessfulSubscription] Processing successful subscription
   [issueApiKeyForSubscription] Successfully issued new API key: keyId=42
   ```

4. **Check health endpoint**:
   ```bash
   curl https://your-app.com/api/billing/health
   ```

### Automated Testing

- Unit tests: `src/lib/billing/__tests__/`
- Integration tests: Test webhook handler with mock events
- End-to-end tests: Test full flow from webhook to API key usage

---

## Quick Reference

| Component | File | Purpose |
|-----------|------|---------|
| Logging | `src/lib/billing/logger.ts` | Structured logging with prefixes |
| Health Check | `src/lib/billing/health.ts` | System health verification |
| Health Endpoint | `src/app/api/billing/health/route.ts` | HTTP endpoint for health checks |
| Webhook Handler | `src/app/api/webhooks/paddle/route.ts` | Entry point, signature verification |
| Event Extraction | `src/lib/billing/paddleWebhookHandler.ts` | Parse events, extract descriptor |
| Subscription Handler | `src/lib/billing/handleSuccessfulSubscription.ts` | Upsert subscription, issue key |
| API Key Issuance | `src/lib/billing/issueApiKeyForSubscription.ts` | Generate/reuse keys (idempotent) |
| Price Mappings | `src/lib/billing/priceMaps.ts` | Price ID → Product Key → Plan Slug |
| Types | `src/lib/billing/model.ts` | Canonical billing types |
| Database | `src/db/schema.ts` | Tables: subscriptions, apiKeys, plans |

---

## Next Steps

- **For Paddle**: Monitor production webhooks, add metrics
- **For DoDo**: Implement extraction functions, add price mappings
- **For Both**: Add email notifications, subscription management UI

---

**Questions?** Check the detailed docs:
- `TASK_8_PADDLE_WEBHOOK_HANDLER.md` – Paddle webhook handler details
- `TASK_9_HANDLE_SUCCESSFUL_SUBSCRIPTION.md` – Subscription handler details
- `integrations/paddle-dodo/ENVIRONMENT.md` – Environment variables
- `integrations/paddle-dodo/notes.md` – Known issues and TODOs
