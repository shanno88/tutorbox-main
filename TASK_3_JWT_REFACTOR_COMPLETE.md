# Task 3: Production-Ready JWT Authentication - COMPLETE

## Overview
Successfully refactored the trial authentication system from temporary user_id fallback to production-ready JWT authentication using the API Route proxy pattern.

## Architecture

### Flow Diagram
```
Frontend (use-trial.ts)
    ↓
Next.js API Routes (/api/trial/*)
    ├─ Validate session via next-auth
    ├─ Generate JWT (HS256, sub + exp)
    └─ Forward to FastAPI with Bearer token
    ↓
FastAPI (/trial/*)
    ├─ Validate JWT via get_current_user_for_trial
    └─ Return response
    ↓
Next.js API Routes (return response)
    ↓
Frontend (handle response)
```

## Implementation Details

### 1. Next.js API Routes (NEW)

#### `src/app/api/trial/start/route.ts`
- **Method**: POST
- **Purpose**: Start a trial for a product
- **Flow**:
  1. Get session via `getServerSession(authConfig)`
  2. Return 401 if no session
  3. Generate JWT: `{ sub: String(user_id), exp: now + 7 days }`
  4. Forward to `FastAPI_URL/trial/start` with Bearer token
  5. Return FastAPI response transparently

#### `src/app/api/trial/status/[productKey]/route.ts`
- **Method**: GET
- **Purpose**: Check trial status for a product
- **Flow**:
  1. Get session via `getServerSession(authConfig)`
  2. Return 401 if no session
  3. Generate JWT: `{ sub: String(user_id), exp: now + 7 days }`
  4. Forward to `FastAPI_URL/trial/status/{productKey}` with Bearer token
  5. Return FastAPI response transparently

### 2. FastAPI Updates

#### `integrations/paddle-dodo/app/deps.py` (ALREADY DONE)
- Implemented `get_current_user_for_trial()`
- Only accepts standard JWT (Bearer + HS256)
- Validates JWT signature using `settings.jwt_secret_key`
- Extracts `sub` claim and validates user exists
- Returns stable error messages (401 for all auth failures)

#### `integrations/paddle-dodo/app/routes/trial.py`
- Updated `/trial/start` to use `get_current_user_for_trial`
- Updated `/trial/status/{product_key}` to use `get_current_user_for_trial`

#### `integrations/paddle-dodo/app/routes/practice.py`
- Updated `trial_or_subscription_grammar_master` dependency to use `get_current_user_for_trial`
- This ensures `/practice/grammar-master/content` validates JWT

### 3. Frontend Updates

#### `src/hooks/use-trial.ts`
- Removed direct FastAPI calls
- Changed `fetchTrialStatus()` to call `/api/trial/status/${productKey}` (GET)
- Changed `startTrial()` to call `/api/trial/start` (POST)
- Removed Authorization header logic (API Route handles it)
- Kept error handling for `{ detail }` responses

## Environment Variables Required

### Next.js (.env.local or .env)
```
FASTAPI_URL=http://localhost:8000
FASTAPI_JWT_SECRET=your-secret-key-change-in-production
```

### FastAPI (.env)
```
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
```

**IMPORTANT**: `FASTAPI_JWT_SECRET` (Next.js) and `JWT_SECRET_KEY` (FastAPI) must be identical.

## JWT Specification

### Algorithm
- **Type**: HS256 (HMAC with SHA-256)
- **Secret**: Shared between Next.js and FastAPI

### Payload
```json
{
  "sub": "123",           // User ID as string
  "exp": 1234567890,      // Unix timestamp (7 days from now)
  "iat": 1234567890       // Issued at (optional)
}
```

### Error Responses
All authentication failures return 401 with stable error messages:
- `"Missing authorization header"` - No Authorization header
- `"Invalid authorization header format"` - Not "Bearer <token>"
- `"Token expired"` - JWT exp claim is in the past
- `"Invalid token"` - JWT signature invalid or malformed
- `"User not found"` - User ID from JWT doesn't exist in DB

## Testing Checklist

### Prerequisites
- [ ] Both Next.js and FastAPI servers running
- [ ] Environment variables configured (FASTAPI_URL, FASTAPI_JWT_SECRET)
- [ ] User logged in via next-auth

### Test Cases

#### 1. Start Trial Flow
- [ ] Navigate to `/zh/grammar-master` (logged in)
- [ ] Click "Start Trial" button
- [ ] Verify in browser DevTools:
  - [ ] POST `/api/trial/start` returns 200
  - [ ] Response contains trial data (product_key, status, started_at, etc.)
  - [ ] Grammar Master content becomes accessible

#### 2. Check Trial Status
- [ ] Refresh the page
- [ ] Verify in browser DevTools:
  - [ ] GET `/api/trial/status/grammar-master` returns 200
  - [ ] Response shows active trial with days_remaining
  - [ ] Grammar Master content is still accessible

#### 3. Unauthorized Access
- [ ] Log out
- [ ] Try to access `/zh/grammar-master`
- [ ] Verify:
  - [ ] `/api/trial/status/grammar-master` returns 401
  - [ ] Grammar Master content is not accessible
  - [ ] Error message displayed to user

#### 4. No Trial Yet
- [ ] Log in as new user (no trial started)
- [ ] Navigate to `/zh/grammar-master`
- [ ] Verify:
  - [ ] `/api/trial/status/grammar-master` returns 404
  - [ ] "Start Trial" button is visible
  - [ ] Grammar Master content is not accessible

#### 5. Trial Expired
- [ ] Manually update trial in database: `UPDATE trials SET started_at = datetime('now', '-8 days') WHERE product_key = 'grammar-master'`
- [ ] Refresh page
- [ ] Verify:
  - [ ] `/api/trial/status/grammar-master` returns 200 with status="expired"
  - [ ] Grammar Master content is not accessible
  - [ ] "Start Trial" button is visible again

### Network Inspection
For each test, verify in DevTools Network tab:
- [ ] Request to `/api/trial/*` has no Authorization header (frontend doesn't need it)
- [ ] Response status is correct (200, 401, 404, etc.)
- [ ] Response body has correct format: `{ product_key, status, ... }` or `{ detail: "..." }`

## Files Modified

### Created
- `src/app/api/trial/start/route.ts` (NEW)
- `src/app/api/trial/status/[productKey]/route.ts` (NEW)

### Updated
- `integrations/paddle-dodo/app/routes/trial.py` - Use `get_current_user_for_trial`
- `integrations/paddle-dodo/app/routes/practice.py` - Use `get_current_user_for_trial`
- `src/hooks/use-trial.ts` - Call `/api/trial/*` instead of FastAPI directly

### Already Done
- `integrations/paddle-dodo/app/deps.py` - `get_current_user_for_trial` implemented

## Key Design Decisions

1. **API Route Proxy Pattern**: Frontend calls Next.js API Routes, which handle JWT generation and forward to FastAPI. This keeps JWT logic server-side and allows for future flexibility.

2. **Shared JWT Secret**: Both Next.js and FastAPI use the same secret for signing/verifying JWTs. This is simpler than OAuth and suitable for internal services.

3. **7-Day Expiration**: JWT tokens expire after 7 days, matching the trial duration. This prevents token reuse after trial ends.

4. **Stable Error Messages**: All auth failures return 401 with descriptive messages. This helps with debugging and provides consistent error handling.

5. **No Breaking Changes**: Existing auth system (next-auth, user/session models, payment logic) remains untouched. Only trial-specific auth was refactored.

## Next Steps (Phase 2)

After verifying this implementation works end-to-end:

1. Create integration documentation for external customers
2. Document JWT payload format and signing algorithm
3. Provide example code for customers to implement in their own backend
4. Document error codes and troubleshooting

## Rollback Plan

If issues arise, the old temporary user_id solution is still available in git history. To revert:
1. Restore `get_current_user` to accept bare user_id
2. Revert `use-trial.ts` to call FastAPI directly with `Authorization: Bearer ${session.user.id}`
3. Revert FastAPI routes to use `get_current_user` instead of `get_current_user_for_trial`

However, this should not be necessary as the new implementation is more robust and production-ready.
