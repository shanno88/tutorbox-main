# Trial API Fixes - Final Implementation

## Root Cause Analysis

The 500 errors were caused by the `cookies()` API from Next.js `next/headers` not working properly in API route handlers when trying to SET cookies. The `cookies()` API is designed for reading cookies in Server Components and Route Handlers, but setting cookies requires using `NextResponse` headers instead.

### Specific Issues:
1. **`setAnonymousTrialState()`** was calling `cookies().set()` which fails in API routes
2. **`startAnonymousTrial()`** was calling `setAnonymousTrialState()` internally
3. All three APIs were trying to use this broken cookie-setting approach

## Solution

Created new cookie-handling functions that work with `NextResponse`:
- `startAnonymousTrialWithCookie()` - Returns both state and cookie string
- `createTrialCookie()` - Creates properly formatted Set-Cookie header value
- Updated all API routes to use `NextResponse` headers for setting cookies

---

## Files Modified

### 1. `src/lib/anonymous-trial.ts`

**Changes:**
- Added `createTrialCookie()` - Creates Set-Cookie header string
- Added `startAnonymousTrialWithCookie()` - Returns state + cookie for API routes
- Added `getAnonymousTrialStateFromRequest()` - Parse cookies from request header
- Kept legacy functions for backward compatibility
- Added try-catch to all cookie operations

**New Functions:**
```typescript
// Create cookie string for Set-Cookie header
export async function createTrialCookie(state: AnonymousTrialState): Promise<string>

// Start trial and return cookie string (for API routes)
export async function startAnonymousTrialWithCookie(): Promise<{
  state: AnonymousTrialState;
  cookie: string;
}>

// Get trial state from request cookie header
export async function getAnonymousTrialStateFromRequest(cookieHeader: string | null): Promise<AnonymousTrialState | null>
```

---

### 2. `/api/grammar/access/route.ts`

**File:** `src/app/api/grammar/access/route.ts`

**BEFORE:**
```typescript
// If anonymous trial not started, auto-start trial
if (!isAuthenticated && anonymousAccess.reason === "not_started") {
  const { startAnonymousTrial } = await import("@/lib/anonymous-trial");
  const newTrialState = await startAnonymousTrial();  // ❌ Tries to set cookie via cookies() API
  
  return NextResponse.json({
    ok: true,
    code: "ANONYMOUS_TRIAL_STARTED",
    // ...
  }, { status: 200 });  // ❌ Cookie not set in response
}
```

**AFTER:**
```typescript
// If anonymous trial not started, auto-start trial
if (!isAuthenticated && anonymousAccess.reason === "not_started") {
  const { state, cookie } = await startAnonymousTrialWithCookie();  // ✅ Get cookie string
  
  const minutesRemaining = Math.floor(
    (state.expiryTimestamp - Date.now()) / (1000 * 60)
  );

  return NextResponse.json(
    {
      ok: true,
      code: "ANONYMOUS_TRIAL_STARTED",
      message: `Anonymous trial started. ${minutesRemaining} minutes remaining.`,
      minutesRemaining,
    },
    { 
      status: 200,
      headers: {
        'Set-Cookie': cookie,  // ✅ Set cookie via response header
      },
    }
  );
}
```

**Example Success Response:**
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

---

### 3. `/api/anonymous-trial/start/route.ts`

**File:** `src/app/api/anonymous-trial/start/route.ts`

**BEFORE:**
```typescript
// Create new trial
const state = await startAnonymousTrial();  // ❌ Tries to set cookie via cookies() API

return NextResponse.json({
  state,
  isNew: true,
  message: `Anonymous trial started for ${ANONYMOUS_TRIAL_CONFIG.durationMinutes} minutes`,
});  // ❌ Cookie not set in response
```

**AFTER:**
```typescript
// Create new trial
const { state, cookie } = await startAnonymousTrialWithCookie();  // ✅ Get cookie string

return NextResponse.json(
  {
    state,
    isNew: true,
    message: `Anonymous trial started for ${ANONYMOUS_TRIAL_CONFIG.durationMinutes} minutes`,
  },
  {
    status: 200,
    headers: {
      'Set-Cookie': cookie,  // ✅ Set cookie via response header
    },
  }
);
```

**Example Success Response:**
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

---

### 4. `/api/external-links/health/route.ts`

**File:** `src/app/api/external-links/health/route.ts`

**No changes to logic** - Already had proper error handling that returns empty object on failure.

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

**Example Fallback Response (DB empty):**
```json
{}
```

---

## Testing Instructions

### Test 1: External Links Health API

**Command:**
```bash
curl http://localhost:3000/api/external-links/health
```

**Expected Response:**
- Status: 200 OK
- Body: JSON object (empty `{}` if DB not initialized, or health data if available)
- No 500 error

**Success Criteria:**
- ✅ Returns 200 even if database is empty
- ✅ Returns valid JSON
- ✅ Frontend doesn't crash

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
- Status: 200 OK
- Body: JSON with `state`, `isNew`, `message`
- Headers: `Set-Cookie: tutorbox_anon_trial=...`

**Example:**
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

**Success Criteria:**
- ✅ Returns 200 OK
- ✅ Returns trial state
- ✅ Sets cookie in response header
- ✅ No 500 error

---

### Test 3: Grammar Access API (Anonymous User)

**Command:**
```bash
curl http://localhost:3000/api/grammar/access -v
```

**Expected Response (First Call - Trial Starts):**
- Status: 200 OK
- Body: JSON with `ok: true`, `code: "ANONYMOUS_TRIAL_STARTED"`
- Headers: `Set-Cookie: tutorbox_anon_trial=...`

**Example:**
```json
{
  "ok": true,
  "code": "ANONYMOUS_TRIAL_STARTED",
  "message": "Anonymous trial started. 30 minutes remaining.",
  "minutesRemaining": 30
}
```

**Expected Response (Subsequent Calls - Trial Active):**
- Status: 200 OK
- Body: JSON with `ok: true`, `code: "ANONYMOUS_TRIAL"`

**Example:**
```json
{
  "ok": true,
  "code": "ANONYMOUS_TRIAL",
  "message": "Anonymous trial active. 28 minutes remaining.",
  "minutesRemaining": 28
}
```

**Success Criteria:**
- ✅ First call returns 200 and starts trial
- ✅ Cookie is set in response
- ✅ Subsequent calls return 200 with remaining time
- ✅ No 500 error

---

### Test 4: Grammar Access API (With Cookie)

**Command:**
```bash
# First, get the cookie from Test 3
# Then use it in subsequent requests

curl http://localhost:3000/api/grammar/access \
  -H "Cookie: tutorbox_anon_trial=eyJhbGc..." \
  -v
```

**Expected Response:**
- Status: 200 OK
- Body: JSON with `ok: true`, `code: "ANONYMOUS_TRIAL"`
- Minutes remaining should decrease over time

**Success Criteria:**
- ✅ Returns 200 OK
- ✅ Recognizes existing trial from cookie
- ✅ Returns correct remaining time
- ✅ No 500 error

---

### Test 5: Integration Test (Browser)

**Steps:**
1. Open browser to `http://localhost:3000/products/grammar-master`
2. Open DevTools → Network tab
3. Click "开始使用语法大师（新试用系统）" button
4. Check Network tab for API calls

**Expected Behavior:**
- ✅ `GET /api/grammar/access` → 200 OK
- ✅ Response: `{"ok": true, "code": "ANONYMOUS_TRIAL_STARTED", ...}`
- ✅ Cookie `tutorbox_anon_trial` is set in Application → Cookies
- ✅ Page redirects to `https://gm.tutorbox.cc`
- ✅ No 500 errors in console
- ✅ Blue banner shows "匿名试用：剩余 30 分钟"

---

## Verification Checklist

### API Routes
- [ ] `/api/external-links/health` returns 200 (not 500)
- [ ] `/api/anonymous-trial/start` returns 200 with cookie
- [ ] `/api/grammar/access` returns 200 with cookie (first call)
- [ ] `/api/grammar/access` returns 200 without setting cookie (subsequent calls)

### Cookie Handling
- [ ] Cookie `tutorbox_anon_trial` is set after first API call
- [ ] Cookie contains valid JWT token
- [ ] Cookie has correct attributes (Path, Max-Age, SameSite)
- [ ] Cookie persists across page refreshes

### Frontend Integration
- [ ] Grammar Master page loads without errors
- [ ] Button click triggers `/api/grammar/access`
- [ ] No 500 errors in browser console
- [ ] Countdown banner appears for anonymous users
- [ ] Redirect to external app works

### Error Handling
- [ ] All APIs have try-catch wrappers
- [ ] Errors are logged with details
- [ ] 500 responses include error details
- [ ] No unhandled promise rejections

---

## Key Changes Summary

| Issue | Before | After |
|-------|--------|-------|
| Cookie Setting | Used `cookies().set()` (fails in API routes) | Use `NextResponse` headers with `Set-Cookie` |
| Trial Start | `startAnonymousTrial()` → crashes | `startAnonymousTrialWithCookie()` → returns cookie string |
| Error Handling | Some APIs missing try-catch | All APIs wrapped in try-catch |
| External Links | Returned 500 on DB error | Returns empty object `{}` (graceful degradation) |

---

## Why This Fix Works

### Problem with `cookies()` API:
- The `cookies()` function from `next/headers` is designed for Server Components
- In API routes, it can READ cookies but SETTING cookies via `cookies().set()` doesn't work reliably
- The cookie changes don't propagate to the response

### Solution with `NextResponse`:
- Create cookie string manually using proper format
- Set cookie via `NextResponse` headers: `{ headers: { 'Set-Cookie': cookieString } }`
- This is the standard way to set cookies in Next.js API routes
- Cookies are guaranteed to be sent in the response

### Cookie Format:
```
tutorbox_anon_trial=<JWT_TOKEN>; Path=/; Max-Age=2592000; SameSite=lax
```

This format is compatible with all browsers and follows HTTP cookie standards.

---

## Next Steps

1. **Run the dev server:** `npm run dev`
2. **Test each API manually** using the curl commands above
3. **Test in browser** by visiting `/products/grammar-master`
4. **Check server logs** for any remaining errors
5. **Verify cookie is set** in browser DevTools → Application → Cookies

If you still see 500 errors after these changes, please:
1. Copy the FULL error stack trace from the terminal
2. Check if `NEXTAUTH_SECRET` env var is set
3. Verify Prisma is connected (run `npx prisma db push` if needed)
