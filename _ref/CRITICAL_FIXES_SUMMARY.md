# Critical Fixes Summary

## Issues Fixed

### A. External Links Health - Removed DB Dependency

**Error:**
```
[external-links/health] Error fetching health data: TypeError: Cannot read properties of undefined (reading 'findMany')
  at getAllLinkHealth (src/lib/external-link-health.ts:110)
```

**Root Cause:**
- `getAllLinkHealth()` was calling `prisma.externalLinkHealth.findMany()`
- Prisma client was undefined or database not initialized
- API crashed with 500 error

**Fix:**
Changed `getAllLinkHealth()` to perform in-memory health checks without database.

**File:** `src/lib/external-link-health.ts`

**BEFORE:**
```typescript
/**
 * Get health status for all links
 */
export async function getAllLinkHealth() {
  return await prisma.externalLinkHealth.findMany();  // ❌ Requires DB
}
```

**AFTER:**
```typescript
/**
 * Get health status for all links (in-memory, no database)
 */
export async function getAllLinkHealth() {
  const results = [];

  for (const link of externalLinks) {
    try {
      const result = await checkExternalLink(link);  // ✅ Direct HTTP check
      results.push({
        linkId: result.linkId,
        url: result.url,
        status: result.status,
        lastCheckedAt: result.timestamp,
        lastStatusCode: result.statusCode ?? null,
        lastError: result.error ?? null,
        consecutiveFailures: result.status === "unavailable" ? 1 : 0,
      });
    } catch (error) {
      // If check fails, mark as unavailable
      results.push({
        linkId: link.id,
        url: link.url,
        status: "unavailable",
        lastCheckedAt: new Date(),
        lastStatusCode: null,
        lastError: error instanceof Error ? error.message : "Unknown error",
        consecutiveFailures: 1,
      });
    }
  }

  return results;  // ✅ Returns in-memory results
}
```

**How It Works:**
1. Reads link configuration from `externalLinks` array (from config file)
2. For each link, performs HTTP HEAD/GET request via `checkExternalLink()`
3. Returns results as array of objects with status, timestamp, etc.
4. No database read or write operations
5. If any link check fails, marks it as unavailable and continues

**Benefits:**
- ✅ No database dependency
- ✅ Works immediately without migrations
- ✅ Real-time health checks
- ✅ Graceful error handling per link

---

### B. Anonymous Trial JWT - Fixed Expiration Format

**Error:**
```
[anonymous-trial/start] Error: TypeError: Invalid time period format
  at jose/dist/node/esm/lib/secs.js
  at SignJWT.setExpirationTime
  at signTrialState (src/lib/anonymous-trial.ts:44)
```

**Root Cause:**
- `setExpirationTime()` was being called with `new Date(...)` object
- The `jose` library expects a string format like `"1800s"` or a number of seconds
- Passing a Date object causes "Invalid time period format" error

**Fix:**
Changed `signTrialState()` to use proper time format for JWT expiration.

**File:** `src/lib/anonymous-trial.ts`

**BEFORE:**
```typescript
export async function signTrialState(state: AnonymousTrialState): Promise<string> {
  const token = await new SignJWT({ ...state })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(state.expiryTimestamp + 24 * 60 * 60 * 1000))  // ❌ Date object - invalid format
    .sign(SECRET_KEY);

  return token;
}
```

**AFTER:**
```typescript
export async function signTrialState(state: AnonymousTrialState): Promise<string> {
  // Calculate expiration time in seconds from now
  const now = Date.now();
  const expiresInMs = state.expiryTimestamp - now + (24 * 60 * 60 * 1000); // Add 24h buffer
  const expiresInSeconds = Math.floor(expiresInMs / 1000);

  const token = await new SignJWT({ ...state })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)  // ✅ Format: "1800s" for 30 minutes
    .sign(SECRET_KEY);

  return token;
}
```

**How It Works:**
1. Calculates time until expiration in milliseconds
2. Adds 24-hour buffer (so token remains valid after trial expires for cleanup)
3. Converts to seconds: `Math.floor(expiresInMs / 1000)`
4. Formats as string: `"1800s"` (for 30 minutes)
5. Passes to `setExpirationTime()` in correct format

**Benefits:**
- ✅ Uses correct JWT expiration format
- ✅ Compatible with `jose` library
- ✅ No "Invalid time period format" error
- ✅ Token expires 24 hours after trial ends (allows cleanup)

---

## Testing Instructions

### Test 1: External Links Health API

**Command:**
```bash
curl http://localhost:3000/api/external-links/health
```

**Expected Response:**
```json
{
  "grammar_master_app": {
    "status": "ok",
    "lastCheckedAt": "2024-01-15T10:30:00.000Z",
    "lastStatusCode": 200
  },
  "cast_master_trial": {
    "status": "unavailable",
    "lastCheckedAt": "2024-01-15T10:30:00.000Z",
    "lastStatusCode": 404,
    "lastError": "Not Found"
  }
}
```

**Success Criteria:**
- ✅ Returns 200 OK
- ✅ Returns JSON with link statuses
- ✅ No error in server log
- ✅ No "Cannot read properties of undefined (reading 'findMany')" error

---

### Test 2: Anonymous Trial Start API

**Command:**
```bash
curl -X POST http://localhost:3000/api/anonymous-trial/start \
  -H "Content-Type: application/json" \
  -d '{"product": "grammar-master"}' \
  -v
```

**Expected Response:**
```json
{
  "state": {
    "type": "anonymous_30min",
    "startTimestamp": 1705315800000,
    "expiryTimestamp": 1705317600000,
    "hasSeenExpiredModal": false,
    "actionsUsed": {}
  },
  "isNew": true,
  "message": "Anonymous trial started for 30 minutes"
}
```

**Response Headers:**
```
Set-Cookie: tutorbox_anon_trial=eyJhbGc...; Path=/; Max-Age=2592000; SameSite=lax
```

**Success Criteria:**
- ✅ Returns 200 OK
- ✅ Returns trial state with timestamps
- ✅ Sets cookie in response header
- ✅ No "Invalid time period format" error in server log

---

### Test 3: Grammar Access API (Integration Test)

**Command:**
```bash
curl http://localhost:3000/api/grammar/access -v
```

**Expected Response:**
```json
{
  "ok": true,
  "code": "ANONYMOUS_TRIAL_STARTED",
  "message": "Anonymous trial started. 30 minutes remaining.",
  "minutesRemaining": 30
}
```

**Response Headers:**
```
Set-Cookie: tutorbox_anon_trial=eyJhbGc...; Path=/; Max-Age=2592000; SameSite=lax
```

**Success Criteria:**
- ✅ Returns 200 OK
- ✅ Auto-starts anonymous trial
- ✅ Sets cookie in response
- ✅ No errors in server log

---

### Test 4: Browser Integration Test

**Steps:**
1. Open browser to `http://localhost:3000/products/grammar-master`
2. Open DevTools → Console (check for errors)
3. Open DevTools → Network tab
4. Click "开始使用语法大师（新试用系统）" button

**Expected Behavior:**
- ✅ No errors in console
- ✅ `GET /api/external-links/health` → 200 OK
- ✅ `GET /api/grammar/access` → 200 OK
- ✅ Cookie `tutorbox_anon_trial` is set
- ✅ Page redirects to `https://gm.tutorbox.cc`
- ✅ Blue banner shows "匿名试用：剩余 30 分钟"

---

## Summary of Changes

| Issue | File | Change | Impact |
|-------|------|--------|--------|
| DB dependency | `src/lib/external-link-health.ts` | Removed `prisma.findMany()`, added in-memory checks | No DB required for health checks |
| JWT format | `src/lib/anonymous-trial.ts` | Changed expiration format from Date to `"Xs"` string | JWT signing works correctly |

---

## What Was NOT Changed

- ✅ No new features added
- ✅ No changes to trial logic
- ✅ No changes to cookie handling
- ✅ No changes to API routes (except what they call)
- ✅ No changes to frontend components

Only fixed the two specific errors as requested.

---

## Verification Checklist

- [ ] `GET /api/external-links/health` returns 200 OK
- [ ] No "Cannot read properties of undefined" error in logs
- [ ] `POST /api/anonymous-trial/start` returns 200 OK with trial state
- [ ] No "Invalid time period format" error in logs
- [ ] Cookie `tutorbox_anon_trial` is set in response
- [ ] `GET /api/grammar/access` returns 200 OK
- [ ] Grammar Master page loads without errors
- [ ] Button click works and redirects to external app
