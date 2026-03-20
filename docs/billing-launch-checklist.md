# Paddle Billing – Launch Checklist & Debug Guide

**Last Updated**: March 20, 2026
**Status**: Production Ready

---

## Pre-Launch Checklist

### 1. Environment Variables

Before going live, verify all required Paddle environment variables are set in production:

```bash
# Required for webhook signature verification
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret

# Required for API calls (if needed)
PADDLE_API_KEY=your_paddle_api_key

# Required for frontend checkout
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_paddle_client_token
NEXT_PUBLIC_PADDLE_ENV=production  # NOT sandbox

# Required: At least one price ID per product
NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD=pri_xxxxx
NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY=pri_xxxxx
NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD=pri_xxxxx
NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY=pri_xxxxx
```

**Validation**:
- [ ] All `PADDLE_*` variables are set (not empty)
- [ ] `NEXT_PUBLIC_PADDLE_ENV=production` (not sandbox)
- [ ] At least one price ID is configured
- [ ] Database connection is working (`DATABASE_URL`)

### 2. Paddle Dashboard Configuration

In Paddle Dashboard:

- [ ] Webhook endpoint URL is set to: `https://your-domain.com/api/webhooks/paddle`
- [ ] Webhook events enabled: `subscription.activated`, `subscription.updated`, `subscription.canceled`, `transaction.completed`
- [ ] Webhook signature secret matches `PADDLE_WEBHOOK_SECRET` in your environment
- [ ] Price IDs in environment variables match Paddle Dashboard price IDs
- [ ] Test mode is OFF (production mode enabled)

### 3. Sandbox Testing

Before production, run these scenarios in Paddle Sandbox:

**Scenario 1: Successful Subscription**
- [ ] User purchases yearly subscription
- [ ] Webhook received and processed
- [ ] API key issued in `apiKeys` table
- [ ] Subscription record created in `subscriptions` table
- [ ] User can access product immediately

**Scenario 2: Subscription Update**
- [ ] User updates subscription (e.g., change plan)
- [ ] Webhook received and processed
- [ ] Subscription record updated
- [ ] User access continues without interruption

**Scenario 3: Subscription Cancellation**
- [ ] User cancels subscription
- [ ] Webhook received and processed
- [ ] `productGrants` status set to `inactive`
- [ ] User loses access after current period ends

**Scenario 4: One-Time Purchase**
- [ ] User purchases one-time product (e.g., Lease AI)
- [ ] Webhook received and processed
- [ ] API key issued
- [ ] User can access product

**Scenario 5: Invalid Price ID**
- [ ] Simulate webhook with unknown price ID
- [ ] Event stored in `webhook_dead_letters` table
- [ ] Error logged with `[billing:webhook:paddle]` prefix
- [ ] System continues running (no crash)

---

## Launch Day Monitoring

### What to Watch

**1. Webhook Processing**
```bash
# Filter logs for webhook activity
grep "\[billing:webhook:paddle\]" /var/log/app.log

# Look for these patterns:
# ✅ "Received event: subscription.activated"
# ✅ "Successfully extracted subscription descriptor"
# ✅ "handleSuccessfulSubscription result: {success: true}"
# ⚠️ "Failed to extract subscription descriptor"
# ⚠️ "CRITICAL: Unknown Paddle priceId"
```

**2. API Key Issuance**
```bash
# Filter logs for API key operations
grep "\[billing:apikey\]" /var/log/app.log

# Look for these patterns:
# ✅ "Issued new API key"
# ✅ "Reused existing API key"
# ⚠️ "Failed to issue API key"
```

**3. Database Operations**
```bash
# Check subscription table for new records
SELECT COUNT(*) FROM subscriptions;
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 10;

# Check API keys table
SELECT COUNT(*) FROM api_keys WHERE status = 'active';
SELECT * FROM api_keys ORDER BY created_at DESC LIMIT 10;

# Check dead-letter table for failures
SELECT COUNT(*) FROM webhook_dead_letters WHERE status = 'pending';
SELECT * FROM webhook_dead_letters ORDER BY created_at DESC LIMIT 10;
```

**4. Health Check Endpoint**
```bash
# Call the health check endpoint
curl https://your-domain.com/api/billing/health

# Expected response:
{
  "status": "healthy",
  "checks": {
    "database": "ok",
    "price_mappings": "ok",
    "webhook_secrets": "ok",
    "api_keys": "ok"
  }
}
```

### Red Flags

**🚨 CRITICAL – Stop and Investigate**

1. **Spike in "unknown priceId" errors**
   - Indicates price ID mismatch between Paddle and environment variables
   - Check: `grep "Unknown Paddle priceId" /var/log/app.log`
   - Action: Verify price IDs in Paddle Dashboard match environment variables

2. **Spike in "extraction_failed" errors**
   - Indicates webhook payload structure changed or is malformed
   - Check: `SELECT * FROM webhook_dead_letters WHERE failure_reason = 'extraction_failed'`
   - Action: Review raw payload in dead-letter table, compare with Paddle docs

3. **Spike in "subscription_handling_failed" errors**
   - Indicates database or API key issuance is failing
   - Check: `grep "Failed to handle subscription" /var/log/app.log`
   - Action: Check database connectivity, API key generation, disk space

4. **Webhook signature verification failures**
   - Indicates webhook secret mismatch or tampering
   - Check: `grep "Invalid webhook signature" /var/log/app.log`
   - Action: Verify `PADDLE_WEBHOOK_SECRET` matches Paddle Dashboard

5. **No webhooks received**
   - Indicates webhook URL not configured or unreachable
   - Check: Paddle Dashboard webhook logs
   - Action: Verify webhook URL is correct and publicly accessible

6. **Users report "no access" after payment**
   - Indicates API key not issued or subscription not created
   - Check: See "3am Debug" section below

---

## 3am Debug: User Paid But No Access

A user paid but can't access the product. Here's the step-by-step debug process:

### Step 1: Verify Payment in Paddle Dashboard

```
Paddle Dashboard → Transactions
Search for user email or transaction ID
```

**Expected**: Transaction shows `completed` status

**If not found**: Payment never reached Paddle (frontend issue, not our problem)

**If found but failed**: Check Paddle's failure reason

### Step 2: Check Webhook Logs in Paddle Dashboard

```
Paddle Dashboard → Webhooks → Event Log
Filter for user's transaction
```

**Expected**: Event shows `delivered` status

**If "pending"**: Webhook not yet delivered, wait a few minutes

**If "failed"**: Paddle couldn't reach our webhook endpoint
- Check: Is `https://your-domain.com/api/webhooks/paddle` accessible?
- Check: Is the server running?
- Action: Retry webhook from Paddle Dashboard

### Step 3: Check Our Application Logs

```bash
# Filter for this user's webhook processing
grep "userId=USER_ID" /var/log/app.log | grep "\[billing"

# Look for:
# ✅ "Received event: subscription.activated"
# ✅ "Successfully extracted subscription descriptor"
# ✅ "handleSuccessfulSubscription result: {success: true}"
# ✅ "Issued new API key"

# If you see errors, note the error message and continue to Step 4
```

### Step 4: Check Dead-Letter Table

```sql
-- Find failed webhook events for this user
SELECT * FROM webhook_dead_letters 
WHERE raw_payload LIKE '%USER_ID%' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check the failure_reason and failure_details columns
-- Common reasons:
-- - "extraction_failed": Webhook payload structure issue
-- - "unknown_price_id": Price ID not in mappings
-- - "database_error": Database operation failed
-- - "invalid_signature": Webhook signature verification failed
```

### Step 5: Check Subscription Table

```sql
-- Verify subscription record was created
SELECT * FROM subscriptions 
WHERE user_id = 'USER_ID';

-- Expected: One row with:
-- - paddleSubscriptionId: Paddle's subscription ID
-- - paddleCustomerId: Paddle's customer ID
-- - paddlePriceId: The price ID from the purchase
-- - currentPeriodEnd: Expiration date
```

**If no row**: Subscription record was never created
- Check Step 3 logs for "extraction_failed" or "subscription_handling_failed"
- Check Step 4 dead-letter table for details

### Step 6: Check API Keys Table

```sql
-- Verify API key was issued
SELECT ak.* FROM api_keys ak
JOIN users u ON ak.user_id = u.id
WHERE u.email = 'USER_EMAIL';

-- Expected: One or more rows with:
-- - status: 'active'
-- - plan_id: References the correct plan
-- - created_at: Recent timestamp
```

**If no row**: API key was never issued
- Check Step 3 logs for "Failed to issue API key"
- Check database permissions and disk space

### Step 7: Check Product Access

```sql
-- Verify user has access to the product
SELECT * FROM product_grants 
WHERE user_id = 'USER_ID' 
AND product_key = 'grammar-master'
AND status = 'active';

-- Expected: One row with status = 'active'
```

**If no row**: Product grant was never created
- This is a legacy table; new system uses `subscriptions` + `apiKeys`
- Check if subscription and API key exist (Steps 5-6)

### Step 8: Verify Frontend Can See Access

```bash
# Call the API with the user's API key
curl -H "Authorization: Bearer USER_API_KEY" \
  https://your-domain.com/api/check-access

# Expected: 200 OK with access details
```

**If 401 Unauthorized**: API key not recognized
- Check: Is the API key in the database?
- Check: Is the API key active (status = 'active')?
- Check: Is the API key expired?

### Summary: Common Causes & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| No webhook received | Webhook URL not configured | Set webhook URL in Paddle Dashboard |
| Webhook received but not processed | Invalid signature | Verify `PADDLE_WEBHOOK_SECRET` |
| Webhook processed but no subscription | Unknown price ID | Add price ID to `priceMaps.ts` |
| Subscription created but no API key | Database error | Check database logs, disk space |
| API key created but no access | Frontend not checking API key | Verify frontend code calls `/api/check-access` |

---

## Known Limitations & TODOs

### Current Implementation

✅ **Paddle Integration**: Fully implemented and production-ready
- Webhook handler with signature verification
- Event extraction for subscriptions and transactions
- API key issuance and management
- Dead-letter mechanism for failed events
- Structured logging with metrics

✅ **Observability**: Implemented
- Structured logging with `[billing:*]` prefixes
- Health check endpoint
- Dead-letter table for debugging
- Webhook error tracking

### Not Yet Implemented

❌ **DoDo Integration**: Scaffolding only
- Event extraction stubs (returns null)
- Signature verification not implemented
- Price ID mappings not configured
- See `integrations/paddle-dodo/README_IMPLEMENTATION_STATUS.md` for details

❌ **Refund Automation**: Manual process only
- Refunds must be processed in Paddle Dashboard
- No automatic subscription cancellation
- No automatic API key revocation
- TODO: Implement refund webhook handler

❌ **Subscription Management UI**: Not implemented
- Users cannot change plans in app
- Users cannot cancel subscriptions in app
- Users must use Paddle's customer portal
- TODO: Build subscription management dashboard

❌ **Usage Tracking**: Not implemented
- No real-time usage metrics
- No usage alerts
- No overage handling
- TODO: Implement usage tracking and alerts

❌ **Multi-Currency Pricing**: Partial
- USD and CNY supported
- Other currencies not configured
- TODO: Add more currencies as needed

---

## Useful Commands

### View Recent Webhook Events

```bash
# Last 20 webhook events
grep "\[billing:webhook:paddle\]" /var/log/app.log | tail -20

# Webhook errors only
grep "\[billing:webhook:paddle\]" /var/log/app.log | grep -i error

# Specific user
grep "userId=USER_ID" /var/log/app.log | grep "\[billing"
```

### Check Database Health

```sql
-- Count active subscriptions
SELECT COUNT(*) as active_subscriptions FROM subscriptions;

-- Count active API keys
SELECT COUNT(*) as active_api_keys FROM api_keys WHERE status = 'active';

-- Count pending dead-letter events
SELECT COUNT(*) as pending_dead_letters FROM webhook_dead_letters WHERE status = 'pending';

-- Recent errors
SELECT provider, failure_reason, COUNT(*) as count 
FROM webhook_dead_letters 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY provider, failure_reason;
```

### Replay Failed Webhook

```sql
-- Find the failed event
SELECT id, raw_payload FROM webhook_dead_letters 
WHERE id = DEAD_LETTER_ID;

-- Copy the raw_payload and POST it to the webhook endpoint
curl -X POST https://your-domain.com/api/webhooks/paddle \
  -H "Content-Type: application/json" \
  -H "Paddle-Signature: SIGNATURE_FROM_PADDLE" \
  -d 'RAW_PAYLOAD_HERE'
```

---

## Escalation Path

**If you can't resolve the issue**:

1. **Check dead-letter table** for the raw webhook payload
2. **Review application logs** for error messages
3. **Verify Paddle Dashboard** webhook logs
4. **Check environment variables** are correct
5. **Verify database connectivity** and disk space
6. **Contact Paddle support** if webhook delivery is failing

---

## References

- `docs/BILLING_FLOW.md` - Complete billing flow documentation
- `docs/billing-failure-modes.md` - Detailed failure mode analysis
- `integrations/paddle-dodo/README_IMPLEMENTATION_STATUS.md` - Integration status
- `src/lib/billing/logger.ts` - Logging implementation
- `src/lib/billing/health.ts` - Health check implementation
- `src/app/api/webhooks/paddle/route.ts` - Webhook handler

