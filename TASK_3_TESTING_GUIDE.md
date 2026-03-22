# Task 3: JWT Refactor - Quick Testing Guide

## Setup

### 1. Verify Environment Variables

**Next.js (.env.local)**
```bash
FASTAPI_URL=http://localhost:8000
FASTAPI_JWT_SECRET=your-secret-key-change-in-production
```

**FastAPI (.env)**
```bash
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
```

Make sure both secrets are **identical**.

### 2. Start Services

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: FastAPI
cd integrations/paddle-dodo
python -m uvicorn app.main:app --reload --port 8000
```

## Quick Test (5 minutes)

### Test 1: Start Trial (Happy Path)
1. Open browser to `http://localhost:3000/zh/grammar-master`
2. Log in if needed
3. Open DevTools → Network tab
4. Click "Start Trial" button
5. **Verify**:
   - [ ] POST `/api/trial/start` shows status 200
   - [ ] Response body: `{ "product_key": "grammar-master", "status": "active", ... }`
   - [ ] Grammar Master content appears

### Test 2: Check Trial Status
1. Refresh page
2. Open DevTools → Network tab
3. **Verify**:
   - [ ] GET `/api/trial/status/grammar-master` shows status 200
   - [ ] Response body: `{ "product_key": "grammar-master", "status": "active", "days_remaining": 7, ... }`
   - [ ] Grammar Master content is visible

### Test 3: Unauthorized (Not Logged In)
1. Log out
2. Navigate to `http://localhost:3000/zh/grammar-master`
3. Open DevTools → Network tab
4. **Verify**:
   - [ ] GET `/api/trial/status/grammar-master` shows status 401
   - [ ] Response body: `{ "detail": "Unauthorized" }`
   - [ ] Grammar Master content is NOT visible
   - [ ] Error message shown to user

## Detailed Testing

### Test 4: No Trial Yet (New User)
1. Create a new test account or use a different user
2. Navigate to `http://localhost:3000/zh/grammar-master`
3. Open DevTools → Network tab
4. **Verify**:
   - [ ] GET `/api/trial/status/grammar-master` shows status 401 (no session) or 404 (no trial)
   - [ ] "Start Trial" button is visible
   - [ ] Grammar Master content is NOT accessible

### Test 5: Trial Expired
1. Open database: `integrations/paddle-dodo/app.db`
2. Run SQL:
   ```sql
   UPDATE trials 
   SET started_at = datetime('now', '-8 days') 
   WHERE product_key = 'grammar-master' AND user_id = <your_user_id>;
   ```
3. Refresh page
4. Open DevTools → Network tab
5. **Verify**:
   - [ ] GET `/api/trial/status/grammar-master` shows status 200
   - [ ] Response body: `{ "status": "expired", "days_remaining": null, ... }`
   - [ ] Grammar Master content is NOT accessible
   - [ ] "Start Trial" button is visible again

### Test 6: JWT Token Validation
1. Open DevTools → Console
2. Run:
   ```javascript
   // Fetch with invalid token
   fetch('/api/trial/status/grammar-master', {
     headers: { 'Authorization': 'Bearer invalid-token' }
   }).then(r => r.json()).then(console.log)
   ```
3. **Verify**:
   - [ ] Response: `{ "detail": "Invalid token" }`
   - [ ] Status: 401

## Debugging

### Issue: 401 Unauthorized on `/api/trial/start`

**Check**:
1. Are you logged in? (Check session in DevTools → Application → Cookies)
2. Is `FASTAPI_JWT_SECRET` set in `.env.local`?
3. Does it match `JWT_SECRET_KEY` in FastAPI `.env`?

**Debug**:
```javascript
// In browser console
const session = await fetch('/api/auth/session').then(r => r.json());
console.log('Session:', session);
```

### Issue: 401 on `/api/trial/status/grammar-master`

**Check**:
1. Are you logged in?
2. Is FastAPI running? (Check `http://localhost:8000/docs`)
3. Check FastAPI logs for JWT validation errors

**Debug**:
```bash
# In FastAPI terminal, add debug logging to deps.py
print(f"DEBUG: Authorization header: {authorization}")
print(f"DEBUG: Token: {token}")
print(f"DEBUG: Payload: {payload}")
```

### Issue: Grammar Master Content Not Showing

**Check**:
1. Is trial status 200 with `status: "active"`?
2. Is `days_remaining > 0`?
3. Check browser console for JavaScript errors

**Debug**:
```javascript
// In browser console
const status = await fetch('/api/trial/status/grammar-master').then(r => r.json());
console.log('Trial status:', status);
```

## Expected Responses

### Success: Start Trial
```json
{
  "id": 1,
  "user_id": 123,
  "product_key": "grammar-master",
  "status": "active",
  "started_at": "2024-03-22T10:30:00",
  "ended_at": null,
  "created_at": "2024-03-22T10:30:00"
}
```

### Success: Check Status
```json
{
  "product_key": "grammar-master",
  "status": "active",
  "started_at": "2024-03-22T10:30:00",
  "ended_at": null,
  "days_remaining": 7
}
```

### Error: Not Logged In
```json
{
  "detail": "Unauthorized"
}
```
Status: 401

### Error: No Trial
```json
{
  "detail": "No trial found for product: grammar-master"
}
```
Status: 404

### Error: Trial Expired
```json
{
  "product_key": "grammar-master",
  "status": "expired",
  "started_at": "2024-03-14T10:30:00",
  "ended_at": null,
  "days_remaining": null
}
```
Status: 200

## Verification Checklist

- [ ] Environment variables configured correctly
- [ ] Both services running
- [ ] Can start trial (200 response)
- [ ] Can check trial status (200 response)
- [ ] Unauthorized users get 401
- [ ] Grammar Master content accessible with active trial
- [ ] Grammar Master content blocked without trial
- [ ] Expired trials are handled correctly
- [ ] Error messages are descriptive

## Next: Integration Documentation

Once all tests pass, proceed to Phase 2:
- Create `docs/TRIAL_INTEGRATION_GUIDE.md`
- Document JWT payload format
- Provide example code for external customers
- Document error codes and troubleshooting
