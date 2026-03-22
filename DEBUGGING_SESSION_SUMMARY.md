# Debugging Session Summary - Trial Auth 401

## Problem Statement
- `/trial/start` 和 `/trial/status/grammar-master` 返回 401 Unauthorized
- Request headers 里没有 Authorization header
- 需要排查为什么前端没有发送 Authorization header

## Root Cause Analysis

### Possible Causes (Priority Order)
1. **`session.user.id` is undefined** - Session not loaded or missing id field
2. **Frontend not sending header** - Code issue in useTrial hook
3. **CORS issue** - Browser blocking Authorization header
4. **FastAPI CORS config** - Not allowing Authorization header

## What We Did

### 1. Added Debug Logging to Frontend
**File**: `src/hooks/use-trial.ts`

Added console logs to track:
- Session state and user.id value
- Token being sent
- Request URL
- Response status

```javascript
console.log("[useTrial] Fetching trial status", {
  productKey,
  token,
  url: `${fastApiUrl}/trial/status/${productKey}`,
});
```

### 2. Added Debug Logging to Backend
**File**: `integrations/paddle-dodo/app/deps.py`

Added print statements to track:
- Authorization header received
- Token extraction
- JWT decode attempts
- User ID parsing
- User lookup
- Final authentication result

```python
print(f"DEBUG get_current_user: authorization={repr(authorization)}")
print(f"DEBUG: Extracted token={repr(token)}")
print(f"DEBUG: User authenticated: {user.email}")
```

### 3. Created Debug Guides
- `DEBUG_TRIAL_AUTH_401.md` - Comprehensive debugging guide
- `QUICK_DEBUG_CHECKLIST.md` - Quick 5-minute checklist

## How to Use Debug Logging

### Step 1: Start Servers with Debug Output
```bash
# Terminal 1: FastAPI (will show DEBUG messages)
cd integrations/paddle-dodo
uvicorn app.main:app --reload

# Terminal 2: Next.js
npm run dev
```

### Step 2: Open Browser DevTools
```
F12 → Console tab
```

### Step 3: Navigate to Grammar Master
```
http://localhost:3000/zh/grammar-master
```

### Step 4: Click "开始试用"
Watch for logs in:
- **Browser Console**: `[useTrial]` messages
- **FastAPI Terminal**: `DEBUG` messages

### Step 5: Check Network Tab
```
F12 → Network tab → Look for /trial/start request
Click on it → Headers section → Look for Authorization header
```

## Expected Debug Output

### ✅ Success Case

**Browser Console**:
```
[useTrial] Session not loaded or user.id missing { session: null }
[useTrial] Fetching trial status { productKey: 'grammar-master', token: 123, url: 'http://localhost:8000/trial/status/grammar-master' }
[useTrial] Response status: 200
```

**FastAPI Terminal**:
```
DEBUG get_current_user: authorization='Bearer 123'
DEBUG: Extracted token='123'
DEBUG: JWT decode failed (InvalidTokenError), trying as user ID
DEBUG: Parsed as user ID: 123
DEBUG: User authenticated: test@example.com
```

**Network Tab**:
```
Authorization: Bearer 123
```

### ❌ Failure Case 1: No Token

**Browser Console**:
```
[useTrial] Session not loaded or user.id missing { session: null }
```

**FastAPI Terminal**:
```
DEBUG get_current_user: authorization=None
DEBUG: Missing authorization header
```

**Network Tab**:
```
(no Authorization header)
```

### ❌ Failure Case 2: Undefined Token

**Browser Console**:
```
[useTrial] Fetching trial status { productKey: 'grammar-master', token: undefined, url: '...' }
[useTrial] Response status: 401
```

**FastAPI Terminal**:
```
DEBUG get_current_user: authorization='Bearer undefined'
DEBUG: Extracted token='undefined'
DEBUG: Failed to parse token as user ID: 'undefined'
```

## Troubleshooting Guide

### Issue: `token: undefined` in console

**Cause**: `session.user.id` is undefined

**Solution**:
1. Check if user is logged in
2. Verify session has id field:
   ```javascript
   fetch('/api/auth/session').then(r => r.json()).then(d => console.log(d.user))
   ```
3. Should show: `{ id: '123', email: '...', ... }`

### Issue: `authorization=None` in FastAPI logs

**Cause**: Frontend not sending Authorization header

**Solution**:
1. Check browser console for `token: undefined`
2. If token is undefined, fix session issue above
3. If token is defined, check CORS configuration

### Issue: `User not found for user_id=123` in FastAPI logs

**Cause**: User doesn't exist in FastAPI database

**Solution**:
1. Register user in FastAPI:
   ```bash
   cd integrations/paddle-dodo
   python test_grammar_master_trial.py
   ```
2. Or manually check database:
   ```bash
   sqlite3 integrations/paddle-dodo/app.db "SELECT id, email FROM users;"
   ```

## Files Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/hooks/use-trial.ts` | Added console.log statements | Track frontend execution |
| `integrations/paddle-dodo/app/deps.py` | Added print statements | Track backend execution |

## Debug Logging Removal

**Important**: These debug logs are for local development only.

**When to remove**:
- After issue is resolved
- Before production deployment

**How to remove**:
1. Remove all `console.log()` and `console.warn()` from `src/hooks/use-trial.ts`
2. Remove all `print()` statements from `integrations/paddle-dodo/app/deps.py`
3. Or use a flag to disable debug mode:
   ```python
   DEBUG = os.getenv("DEBUG", "false").lower() == "true"
   if DEBUG:
       print(f"DEBUG: ...")
   ```

## Next Steps

1. **Run the debug checklist**:
   - Follow `QUICK_DEBUG_CHECKLIST.md`
   - Collect all debug output

2. **Identify the issue**:
   - Match your output to expected cases
   - Use `DEBUG_TRIAL_AUTH_401.md` for detailed analysis

3. **Apply the fix**:
   - Follow solution for your specific issue
   - Restart servers if needed

4. **Verify the fix**:
   - Confirm all debug outputs are correct
   - Verify response status is 200
   - Confirm trial status displays

5. **Remove debug logging**:
   - After issue is resolved
   - Before committing to git

## Documentation

- `DEBUG_TRIAL_AUTH_401.md` - Comprehensive debugging guide
- `QUICK_DEBUG_CHECKLIST.md` - Quick 5-minute checklist
- `DEBUGGING_SESSION_SUMMARY.md` - This file

## Timeline

**Short-term** (Now):
- Use debug logging to identify issue
- Fix the root cause
- Verify trial flow works

**Medium-term** (After working):
- Remove debug logging
- Clean up code
- Commit changes

**Long-term** (Future):
- Implement standard JWT authentication
- Remove user ID fallback
- Prepare for production

---

**Status**: Debug logging active
**Created**: Today
**Next**: Run QUICK_DEBUG_CHECKLIST.md
