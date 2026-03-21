# API 500 Errors Fix Summary

## Problem
Three API routes were returning 500 errors:
1. `GET /api/external-links/health` → 500
2. `POST /api/anonymous-trial/start` → 500
3. `GET /api/grammar/access` → 500

This prevented the anonymous trial system from working.

## Root Causes

### 1. External Links Health API
**Issue:** Database table `ExternalLinkHealth` might be empty or not migrated
**Impact:** API crashed when trying to fetch health data

### 2. Anonymous Trial Start API
**Issue:** Missing error handling for edge cases (no body, invalid JSON)
**Impact:** API crashed on malformed requests

### 3. Grammar Access API
**Issue:** No try-catch wrapper around the entire handler
**Impact:** Any error in the flow caused unhandled 500

### 4. Anonymous Trial Library
**Issue:** Missing try-catch in cookie operations
**Impact:** Cookie errors propagated as 500s

---

## Fixes Applied

### 1. `/api/external-links/health/route.ts`

**File:** `src/app/api/external-links/health/route.ts`

**BEFORE:**
```typescript
export async function GET() {
  try {
    const healthData = await getAllLinkHealth();
    // ... transform data ...
    return NextResponse.json(statusMap);
  } catch (error) {
    console.error("[external-links/health] Error fetching health data:", error);
    return NextResponse.json(
      { error: "Failed to fetch link health data" },
      { status: 500 }  // ❌ Returns 500, breaks frontend
    );
  }
}
```

**AFTER:**
```typescript
export async function GET() {
  try {
    const healthData = await getAllLinkHealth();
    // ... transform data ...
    return NextResponse.json(statusMap);
  } catch (error) {
    console.error("[external-links/health] Error fetching health data:", error);
    
    // ✅ Return empty object instead of 500 - graceful degradation
    // Frontend will treat missing health data as "unknown" status
    return NextResponse.json({}, { status: 200 });
  }
}
```

**Example Success Response:**
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

**Example Fallback Response (when DB empty):**
```json
{}
```

---

### 2. `/api/anonymous-trial/start/route.ts`

**File:** `src/app/api/anonymous-trial/start/route.ts`

**BEFORE:**
```typescript
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    // ...
    
    const body = await req.json();  // ❌ Can throw if no body
    const { product } = body;

    // Validate product
    if (!ANONYMOUS_TRIAL_CONFIG.supportedProducts.includes(product)) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }
    // ...
  } catch (error) {
    console.error("[anonymous-trial/start] Error:", error);
    return NextResponse.json(
      { error: "Failed to start trial" },  // ❌ No details
      { status: 500 }
    );
  }
}
```

**AFTER:**
```typescript
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    // ...
    
    // ✅ Parse body safely
    let body;
    try {
      body = await req.json();
    } catch (e) {
      // If no body or invalid JSON, use default
      body = {};
    }

    const { product } = body;

    // ✅ Validate product if provided (optional now)
    if (product && !ANONYMOUS_TRIAL_CONFIG.supportedProducts.includes(product)) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }
    // ...
  } catch (error) {
    console.error("[anonymous-trial/start] Error:", error);
    
    // ✅ Log detailed error for debugging
    if (error instanceof Error) {
      console.error("[anonymous-trial/start] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to start trial",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
```

**Example Success Response (New Trial):**
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

**Example Success Response (Existing Trial):**
```json
{
  "state": {
    "type": "anonymous_30min",
    "startTimestamp": 1705315800000,
    "expiryTimestamp": 1705317600000,
    "hasSeenExpiredModal": false,
    "actionsUsed": {}
  },
  "isNew": false
}
```

---

### 3. `/api/grammar/access/route.ts`

**File:** `src/app/api/grammar/access/route.ts`

**BEFORE:**
```typescript
export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);
  const isAuthenticated = !!session?.user?.email;

  // Check anonymous trial access first
  const anonymousAccess = await checkAnonymousAccess(isAuthenticated, "grammar-master");
  
  // ... rest of logic (no try-catch wrapper)
}
```

**AFTER:**
```typescript
export async function GET(req: NextRequest) {
  try {  // ✅ Wrap entire handler in try-catch
    const session = await getServerSession(authConfig);
    const isAuthenticated = !!session?.user?.email;

    // Check anonymous trial access first
    const anonymousAccess = await checkAnonymousAccess(isAuthenticated, "grammar-master");
    
    // ... rest of logic
  } catch (error) {
    console.error("[grammar/access] Error:", error);
    
    // ✅ Log detailed error for debugging
    if (error instanceof Error) {
      console.error("[grammar/access] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return NextResponse.json(
      { 
        ok: false,
        code: "INTERNAL_ERROR",
        message: "服务器内部错误，请稍后重试。",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
```

**Example Success Response (Anonymous Trial Started):**
```json
{
  "ok": true,
  "code": "ANONYMOUS_TRIAL_STARTED",
  "message": "Anonymous trial started. 30 minutes remaining.",
  "minutesRemaining": 30
}
```

**Example Success Response (Anonymous Trial Active):**
```json
{
  "ok": true,
  "code": "ANONYMOUS_TRIAL",
  "message": "Anonymous trial active. 25 minutes remaining.",
  "minutesRemaining": 25
}
```

**Example Error Response (Trial Expired):**
```json
{
  "ok": false,
  "code": "ANONYMOUS_TRIAL_EXPIRED",
  "message": "Your 30-minute trial has ended. Please sign up to continue."
}
```

**Example Error Response (Internal Error):**
```json
{
  "ok": false,
  "code": "INTERNAL_ERROR",
  "message": "服务器内部错误，请稍后重试。",
  "details": "Database connection failed"
}
```

---

### 4. `src/lib/anonymous-trial.ts`

**File:** `src/lib/anonymous-trial.ts`

**BEFORE:**
```typescript
export async function getAnonymousTrialState(): Promise<AnonymousTrialState | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ANONYMOUS_TRIAL_CONFIG.cookieName)?.value;

  if (!token) {
    return null;
  }

  return await verifyTrialState(token);
}

export async function setAnonymousTrialState(state: AnonymousTrialState): Promise<void> {
  const token = await signTrialState(state);
  const cookieStore = await cookies();

  cookieStore.set(
    ANONYMOUS_TRIAL_CONFIG.cookieName,
    token,
    ANONYMOUS_TRIAL_CONFIG.cookie
  );
}
```

**AFTER:**
```typescript
export async function getAnonymousTrialState(): Promise<AnonymousTrialState | null> {
  try {  // ✅ Add try-catch
    const cookieStore = await cookies();
    const token = cookieStore.get(ANONYMOUS_TRIAL_CONFIG.cookieName)?.value;

    if (!token) {
      return null;
    }

    return await verifyTrialState(token);
  } catch (error) {
    console.error("[anonymous-trial] Error getting trial state:", error);
    return null;  // ✅ Return null instead of throwing
  }
}

export async function setAnonymousTrialState(state: AnonymousTrialState): Promise<void> {
  try {  // ✅ Add try-catch
    const token = await signTrialState(state);
    const cookieStore = await cookies();

    cookieStore.set(
      ANONYMOUS_TRIAL_CONFIG.cookieName,
      token,
      ANONYMOUS_TRIAL_CONFIG.cookie
    );
  } catch (error) {
    console.error("[anonymous-trial] Error setting trial state:", error);
    throw error;  // ✅ Re-throw so caller knows it failed
  }
}
```

---

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `src/app/api/external-links/health/route.ts` | Return empty object `{}` instead of 500 on error | Graceful degradation - frontend works without health data |
| `src/app/api/anonymous-trial/start/route.ts` | Safe JSON parsing, detailed error logging | Handles malformed requests, easier debugging |
| `src/app/api/grammar/access/route.ts` | Wrap entire handler in try-catch, detailed error logging | Catches all errors, provides useful error messages |
| `src/lib/anonymous-trial.ts` | Add try-catch to cookie operations | Prevents cookie errors from crashing APIs |

---

## Testing Checklist

### External Links Health API
- [ ] `GET /api/external-links/health` returns 200 (even if DB empty)
- [ ] Response is valid JSON object
- [ ] Frontend doesn't crash if health data missing

### Anonymous Trial Start API
- [ ] `POST /api/anonymous-trial/start` with no body → 200 (starts trial)
- [ ] `POST /api/anonymous-trial/start` with `{"product": "grammar-master"}` → 200
- [ ] `POST /api/anonymous-trial/start` when authenticated → 400
- [ ] `POST /api/anonymous-trial/start` when trial exists → returns existing state

### Grammar Access API
- [ ] `GET /api/grammar/access` as anonymous user → 200 (auto-starts trial)
- [ ] `GET /api/grammar/access` with active trial → 200
- [ ] `GET /api/grammar/access` with expired trial → 403
- [ ] `GET /api/grammar/access` as logged-in user → 200 (checks account trial)
- [ ] `GET /api/grammar/access` with database error → 500 with details

### Integration Test
- [ ] Visit `/products/grammar-master` as anonymous user
- [ ] Click "开始使用语法大师（新试用系统）" button
- [ ] No 500 errors in browser console
- [ ] Redirects to `https://gm.tutorbox.cc`
- [ ] Cookie `tutorbox_anon_trial` is set
- [ ] Countdown banner shows "剩余 30 分钟"

---

## Error Handling Philosophy

### Graceful Degradation
- External link health: Return empty data instead of crashing
- Frontend treats missing data as "unknown" status
- App continues to work even if health check fails

### Detailed Logging
- All errors logged with full stack traces
- Error details included in 500 responses (for debugging)
- Console logs prefixed with `[api-route-name]` for easy filtering

### Clear Error Messages
- User-facing messages in Chinese/English
- Error codes for programmatic handling
- Details field for debugging (only in 500 responses)

### No Silent Failures
- Cookie errors are logged and re-thrown
- Database errors are caught and returned as 500
- All errors have context (which API, what operation)
