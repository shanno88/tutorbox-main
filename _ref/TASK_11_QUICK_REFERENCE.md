# Task 11 – Observability Quick Reference

## Log Prefixes

```
[billing:webhook:paddle]  - Paddle webhook events
[billing:webhook:dodo]    - DoDo webhook events
[billing:webhook:payment] - Payment metrics
[billing:subscription]    - Subscription handling
[billing:apikey]          - API key operations
[billing:health]          - Health check operations
```

## Key Functions

### Logging
```typescript
import { logInfo, logWarn, logError, logDebug } from "@/lib/billing/logger";

logInfo("webhook:paddle", "Event received", { eventType: "subscription.activated" });
logWarn("webhook:paddle", "Missing field", { field: "userId" });
logError("webhook:paddle", "Extraction failed", error);
logDebug("webhook:paddle", "Debug info", { data });
```

### Metrics
```typescript
import { 
  recordSuccessfulPayment, 
  recordFailedPayment, 
  recordApiKeyOperation, 
  recordWebhookError 
} from "@/lib/billing/logger";

recordSuccessfulPayment("paddle", "grammar-master", "grammar-master-yearly-usd");
recordFailedPayment("paddle", "extraction_failed", { reason: "missing_price_id" });
recordApiKeyOperation(true, "user_123", "grammar-master-yearly-usd"); // issued
recordApiKeyOperation(false, "user_456", "lease-ai-onetime-usd");     // reused
recordWebhookError("paddle", "invalid_signature", "Signature verification failed");
```

### Health Check
```typescript
import { checkBillingHealth, formatHealthResult } from "@/lib/billing/health";

const health = await checkBillingHealth();
console.log(formatHealthResult(health));
```

## Health Endpoint

```bash
# Check system health
curl https://your-app.com/api/billing/health

# Response status codes:
# 200 - Healthy
# 503 - Degraded or Unhealthy
```

## Log Filtering

### All Billing
```
filter: "billing:"
```

### Paddle Webhooks
```
filter: "billing:webhook:paddle"
```

### Errors
```
filter: "billing:" AND level:error
```

### Successful Payments
```
filter: "billing:webhook:payment" AND "Successful payment"
```

### Failed Payments
```
filter: "billing:webhook:payment" AND "Failed payment"
```

### API Key Operations
```
filter: "billing:apikey"
```

## Debugging Checklist

- [ ] Check logs for `[billing:webhook:paddle] Received event`
- [ ] Check logs for `[billing:webhook:paddle] Successfully extracted`
- [ ] Check logs for `[billing:subscription] Processing successful`
- [ ] Check logs for `[billing:apikey] API key` (issued or reused)
- [ ] Call `/api/billing/health` to verify system status
- [ ] Check metrics: successful payments, failed payments, keys issued/reused
- [ ] Check database: subscriptions, apiKeys, plans tables

## Common Issues

### "Webhook not received"
```
grep "[billing:webhook:paddle] Received event" logs.txt
```

### "Extraction failed"
```
grep "[billing:webhook:paddle]" logs.txt | grep -i "missing\|unknown"
```

### "API key not issued"
```
grep "[billing:apikey]" logs.txt | grep -i "error\|failed"
```

### "System degraded"
```
curl https://your-app.com/api/billing/health
# Check each component status
```

## Files

| File | Purpose |
|------|---------|
| `src/lib/billing/logger.ts` | Logging and metrics |
| `src/lib/billing/health.ts` | Health check logic |
| `src/app/api/billing/health/route.ts` | Health endpoint |
| `docs/BILLING_FLOW.md` | Full documentation |

