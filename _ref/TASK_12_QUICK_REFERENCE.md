# Task 12 – Hardening Quick Reference

## Webhook Best Practices

### 1. Always Reply with 2xx ✅
```typescript
// Even if processing fails internally
return new Response("OK", { status: 200 });
```

### 2. Signature Verification First ✅
```typescript
// Verify BEFORE any business logic
const isValid = await verifyPaddleWebhook(rawBody, signature);
if (!isValid) {
  await storeDeadLetter(...);
  return new Response("OK", { status: 200 });
}
```

### 3. Input Validation ✅
```typescript
// Validate required fields
if (!type || typeof type !== "string") {
  await storeDeadLetter(...);
  return new Response("OK", { status: 200 });
}
```

## Dead-Letter Mechanism

### Store a Dead-Letter
```typescript
import { storeDeadLetter } from "@/lib/billing/dead-letter";

await storeDeadLetter(
  "paddle",                    // provider
  "subscription.activated",    // eventType
  rawPayload,                  // rawPayload (JSON string)
  "extraction_failed",         // reason
  "Missing price ID",          // details (optional)
  event.id                     // eventId (optional)
);
```

### Get Pending Dead-Letters
```typescript
import { getPendingDeadLetters } from "@/lib/billing/dead-letter";

const pending = await getPendingDeadLetters("paddle", 100);
```

### Resolve a Dead-Letter
```typescript
import { resolveDeadLetter } from "@/lib/billing/dead-letter";

await resolveDeadLetter(
  deadLetterId,
  "admin@example.com",
  "Fixed price mapping"
);
```

### Get Statistics
```typescript
import { getDeadLetterStats } from "@/lib/billing/dead-letter";

const stats = await getDeadLetterStats();
// { total, pending, resolved, ignored, byProvider, byReason }
```

## Failure Modes

| Mode | Handling | Status |
|------|----------|--------|
| Invalid Signature | Log, dead-letter, 200 OK | ✅ |
| Missing Secret | Log, dead-letter, 200 OK | ✅ |
| Invalid JSON | Log, dead-letter, 200 OK | ✅ |
| Missing Event Type | Log, dead-letter, 200 OK | ✅ |
| Extraction Failed | Log, dead-letter, 200 OK | ✅ |
| Unknown Price ID | Log, dead-letter, 200 OK | ✅ |
| Plan Not Found | Log, dead-letter, 200 OK | ✅ |
| Database Error | Log, dead-letter, 200 OK | ⚠️ |
| Cancellation Unknown Price | Log, dead-letter, 200 OK | ⚠️ |
| Legacy Table Error | Log, don't fail, 200 OK | ✅ |

## Monitoring

### Key Metrics
- Dead-letter count (alert if > 10 pending)
- Failure rate (alert if > 5%)
- Database errors (alert immediately)
- Signature failures (alert if > 5 in 5 min)

### Log Filtering
```
# All dead-letters
filter: "billing:dead-letter"

# Webhook errors
filter: "billing:webhook:paddle" AND level:error

# Specific reason
filter: "billing:dead-letter" AND "unknown_price_id"
```

## Database Query

### Get Pending Dead-Letters
```sql
SELECT * FROM webhook_dead_letters 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 100;
```

### Get Statistics
```sql
SELECT 
  failure_reason,
  COUNT(*) as count,
  status
FROM webhook_dead_letters
GROUP BY failure_reason, status
ORDER BY count DESC;
```

### Resolve a Dead-Letter
```sql
UPDATE webhook_dead_letters
SET status = 'resolved',
    resolved_at = NOW(),
    resolved_by = 'admin@example.com',
    resolution_notes = 'Fixed price mapping'
WHERE id = 123;
```

## Files

| File | Purpose |
|------|---------|
| `src/lib/billing/dead-letter.ts` | Dead-letter utilities |
| `src/app/api/webhooks/paddle/route.ts` | Hardened webhook handler |
| `src/db/schema.ts` | Dead-letter table schema |
| `docs/billing-failure-modes.md` | Full documentation |

## Next Steps

1. Set up dead-letter monitoring dashboard
2. Create admin UI to review/resolve dead-letters
3. Add alerts for high-severity dead-letters
4. Set up rate limiting at API Gateway
5. Implement retry queue for transient errors

