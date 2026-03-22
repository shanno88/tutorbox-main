# Debug Guide: Trial Auth 401 Issue

## Problem
- `/trial/start` 和 `/trial/status/grammar-master` 返回 401
- Request headers 里没有 Authorization header

## Root Cause Analysis

### Possible Causes
1. **`session.user.id` is undefined** - Session not loaded or missing id field
2. **CORS issue** - Browser blocking Authorization header
3. **FastAPI CORS config** - Not allowing Authorization header
4. **Frontend not sending header** - Code issue in useTrial hook

## Debugging Steps

### Step 1: Check Frontend Console Logs

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for logs from `[useTrial]`:
   ```
   [useTrial] Fetching trial status { productKey: 'grammar-master', token: <number>, url: '...' }
   [useTrial] Response status: 401
   ```

**What to look for**:
- Is `token` a number (e.g., `123`) or `undefined`?
- If `undefined`, session is not loaded
- If number, token is being sent

### Step 2: Check Network Tab

1. Open DevTools Network tab
2. Look for requests to `/trial/status/grammar-master` or `/trial/start`
3. Click on the request
4. Go to "Headers" section
5. Look for "Authorization" header

**Expected**:
```
Authorization: Bearer 123
```

**If missing**:
- Frontend is not sending it
- Check console logs for `token: undefined`

**If present but still 401**:
- FastAPI is rejecting it
- Check FastAPI logs for DEBUG messages

### Step 3: Check FastAPI Logs

1. Look at FastAPI terminal where you ran `uvicorn app.main:app --reload`
2. Look for DEBUG messages:
   ```
   DEBUG get_current_user: authorization='Bearer 123'
   DEBUG: Extracted token='123'
   DEBUG: JWT decode failed (InvalidTokenError), trying as user ID
   DEBUG: Parsed as user ID: 123
   DEBUG: User authenticated: user@example.com
   ```

**If you see**:
- `authorization=None` → Frontend not sending header
- `authorization='Bearer undefined'` → session.user.id is undefined
- `authorization='Bearer 123'` → Header sent correctly
- `User not found for user_id=123` → User ID doesn't exist in database

## Common Issues & Solutions

### Issue 1: `authorization=None`

**Symptom**: FastAPI logs show `DEBUG get_current_user: authorization=None`

**Cause**: Frontend not sending Authorization header

**Solution**:
1. Check console logs for `token: undefined`
2. If token is undefined, session not loaded
3. Verify session is loaded:
   ```javascript
   // In browser console
   fetch('/api/auth/session').then(r => r.json()).then(console.log)
   ```
4. Should show user object with `id` field

### Issue 2: `authorization='Bearer undefined'`

**Symptom**: FastAPI logs show `DEBUG get_current_user: authorization='Bearer undefined'`

**Cause**: `session.user.id` is undefined

**Solution**:
1. Check if user is logged in
2. Verify session has `id` field:
   ```javascript
   // In browser console
   fetch('/api/auth/session').then(r => r.json()).then(d => console.log(d.user))
   ```
3. Should show: `{ id: '123', email: '...', name: '...', image: '...' }`
4. If `id` is missing, check `src/lib/auth.ts` JWT callback

### Issue 3: `User not found for user_id=123`

**Symptom**: FastAPI logs show `DEBUG: User not found for user_id=123`

**Cause**: User ID doesn't exist in FastAPI database

**Solution**:
1. Check if user exists in FastAPI database:
   ```bash
   sqlite3 integrations/paddle-dodo/app.db "SELECT id, email FROM users WHERE id = 123;"
   ```
2. If no result, user doesn't exist
3. Register user in FastAPI first:
   ```bash
   # Use test_grammar_master_trial.py to register
   python integrations/paddle-dodo/test_grammar_master_trial.py
   ```

### Issue 4: CORS Error

**Symptom**: Browser console shows CORS error, no Authorization header sent

**Cause**: CORS not allowing Authorization header

**Solution**:
1. Check FastAPI CORS config in `app/main.py`
2. Should have:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],  # ← This allows Authorization
   )
   ```
3. If not, update it
4. Restart FastAPI server

## Quick Checklist

- [ ] Frontend console shows `token: <number>` (not undefined)
- [ ] Network tab shows `Authorization: Bearer <number>` header
- [ ] FastAPI logs show `DEBUG get_current_user: authorization='Bearer <number>'`
- [ ] FastAPI logs show `DEBUG: User authenticated: ...`
- [ ] Response status is 200 (not 401)

## Debug Output Examples

### ✅ Success Case

**Frontend Console**:
```
[useTrial] Fetching trial status { productKey: 'grammar-master', token: 123, url: 'http://localhost:8000/trial/status/grammar-master' }
[useTrial] Response status: 200
```

**Network Tab**:
```
Authorization: Bearer 123
```

**FastAPI Logs**:
```
DEBUG get_current_user: authorization='Bearer 123'
DEBUG: Extracted token='123'
DEBUG: JWT decode failed (InvalidTokenError), trying as user ID
DEBUG: Parsed as user ID: 123
DEBUG: User authenticated: test@example.com
```

### ❌ Failure Case 1: No Token

**Frontend Console**:
```
[useTrial] Session not loaded or user.id missing { session: null }
```

**Network Tab**:
```
(no Authorization header)
```

**FastAPI Logs**:
```
DEBUG get_current_user: authorization=None
DEBUG: Missing authorization header
```

### ❌ Failure Case 2: Undefined Token

**Frontend Console**:
```
[useTrial] Fetching trial status { productKey: 'grammar-master', token: undefined, url: '...' }
[useTrial] Response status: 401
```

**Network Tab**:
```
Authorization: Bearer undefined
```

**FastAPI Logs**:
```
DEBUG get_current_user: authorization='Bearer undefined'
DEBUG: Extracted token='undefined'
DEBUG: JWT decode failed (InvalidTokenError), trying as user ID
DEBUG: Failed to parse token as user ID: 'undefined'
```

## Next Steps

1. **Collect Debug Info**:
   - Frontend console logs
   - Network tab headers
   - FastAPI server logs

2. **Identify Issue**:
   - Use checklist above
   - Match to common issues

3. **Apply Solution**:
   - Follow solution for your issue
   - Restart servers if needed
   - Test again

4. **Verify Fix**:
   - Check all debug outputs
   - Confirm 200 response
   - Verify trial status displays

## Files with Debug Logging

- `src/hooks/use-trial.ts` - Frontend logging
- `integrations/paddle-dodo/app/deps.py` - Backend logging

**Note**: These debug logs will be removed in production. They're only for local development.

---

**Last Updated**: Today
**Status**: Debug logging active
**Next**: Remove debug logs after issue is resolved
