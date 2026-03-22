# Task 3: Live Testing Execution Plan

**Status**: Ready to test
**Date**: March 22, 2026

---

## Test Execution Plan

### Services to Start

**Terminal 1: Next.js**
```bash
npm run dev
```
Expected: Running on http://localhost:3000

**Terminal 2: FastAPI**
```bash
cd integrations/paddle-dodo
python -m uvicorn app.main:app --reload --port 8000
```
Expected: Running on http://127.0.0.1:8000

---

## Test Cases (From TASK_3_TESTING_GUIDE.md)

### Test 1: Start Trial (Happy Path) ✓
**Objective**: Verify trial can be started and content becomes accessible

**Steps**:
1. Open browser to `http://localhost:3000/zh/grammar-master`
2. Log in if needed
3. Open DevTools → Network tab
4. Click "Start Trial" button
5. **Verify**:
   - [ ] POST `/api/trial/start` shows status 200 (NOT `http://localhost:8000/trial/start`)
   - [ ] Response body: `{ "product_key": "grammar-master", "status": "active", ... }`
   - [ ] Grammar Master content appears

**Expected Network Requests**:
```
POST /api/trial/start
  ├─ Status: 200
  ├─ Request Headers: (no Authorization header needed)
  └─ Response: { product_key, status, started_at, ... }
```

---

### Test 2: Check Trial Status ✓
**Objective**: Verify trial status can be checked after page refresh

**Steps**:
1. Refresh page
2. Open DevTools → Network tab
3. **Verify**:
   - [ ] GET `/api/trial/status/grammar-master` shows status 200 (NOT `http://localhost:8000/trial/status/...`)
   - [ ] Response body: `{ "product_key": "grammar-master", "status": "active", "days_remaining": 7, ... }`
   - [ ] Grammar Master content is visible

**Expected Network Requests**:
```
GET /api/trial/status/grammar-master
  ├─ Status: 200
  ├─ Request Headers: (no Authorization header needed)
  └─ Response: { product_key, status, started_at, days_remaining, ... }
```

---

### Test 3: Unauthorized (Not Logged In) ✓
**Objective**: Verify unauthorized users cannot access trial

**Steps**:
1. Log out
2. Navigate to `http://localhost:3000/zh/grammar-master`
3. Open DevTools → Network tab
4. **Verify**:
   - [ ] GET `/api/trial/status/grammar-master` shows status 401 (NOT `http://localhost:8000/trial/status/...`)
   - [ ] Response body: `{ "detail": "Unauthorized" }`
   - [ ] Grammar Master content is NOT visible
   - [ ] Error message shown to user

**Expected Network Requests**:
```
GET /api/trial/status/grammar-master
  ├─ Status: 401
  ├─ Request Headers: (no Authorization header)
  └─ Response: { detail: "Unauthorized" }
```

---

## Key Verification Points

### Network Tab Inspection

**CRITICAL**: Verify requests are to `/api/trial/*` NOT `http://localhost:8000/trial/*`

✅ **Correct** (API Route proxy):
```
POST /api/trial/start
GET /api/trial/status/grammar-master
```

❌ **Wrong** (Direct FastAPI):
```
POST http://localhost:8000/trial/start
GET http://localhost:8000/trial/status/grammar-master
```

### Request Headers

**Frontend requests to `/api/trial/*`**:
- Should NOT have Authorization header (API Route handles it)
- Should have Content-Type: application/json

**API Route to FastAPI**:
- Should have Authorization: Bearer <JWT>
- Should have Content-Type: application/json

### Response Format

All responses should be JSON:
```json
{
  "product_key": "grammar-master",
  "status": "active",
  "started_at": "2024-03-22T10:30:00",
  "ended_at": null,
  "days_remaining": 7
}
```

Or error:
```json
{
  "detail": "Unauthorized"
}
```

---

## Troubleshooting

### If Test 1 Fails (401 on `/api/trial/start`)

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

### If Test 2 Fails (404 on `/api/trial/status/grammar-master`)

**Check**:
1. Did Test 1 succeed? (Trial must be created first)
2. Is FastAPI running? (Check `http://localhost:8000/docs`)
3. Check FastAPI logs for JWT validation errors

### If Test 3 Fails (200 instead of 401)

**Check**:
1. Are you actually logged out? (Check cookies)
2. Is session validation working in API Route?
3. Check API Route logs for session validation

---

## Success Criteria

✅ **Test 1 Passes**:
- POST `/api/trial/start` returns 200
- Trial is created in database
- Grammar Master content becomes accessible

✅ **Test 2 Passes**:
- GET `/api/trial/status/grammar-master` returns 200
- Trial status shows active with days_remaining
- Grammar Master content is still accessible

✅ **Test 3 Passes**:
- GET `/api/trial/status/grammar-master` returns 401
- Grammar Master content is not accessible
- Error message displayed to user

---

## Expected Behavior

### Happy Path (Logged In)
```
1. Navigate to /zh/grammar-master
   ↓
2. GET /api/trial/status/grammar-master → 404 (no trial yet)
   ↓
3. Click "Start Trial"
   ↓
4. POST /api/trial/start → 200 (trial created)
   ↓
5. Grammar Master content appears
   ↓
6. Refresh page
   ↓
7. GET /api/trial/status/grammar-master → 200 (trial active)
   ↓
8. Grammar Master content still visible
```

### Unauthorized Path (Not Logged In)
```
1. Navigate to /zh/grammar-master
   ↓
2. GET /api/trial/status/grammar-master → 401 (not logged in)
   ↓
3. Grammar Master content not visible
   ↓
4. Error message displayed
```

---

## Next Steps After Testing

If all tests pass:
- ✅ JWT refactor is complete
- ✅ API Route proxy pattern is working
- ✅ Grammar Master trial flow is functional
- ⏳ Proceed to Phase 2: Integration documentation

If any test fails:
- Check API Route logs for JWT generation issues
- Check FastAPI logs for JWT validation errors
- Verify environment variables are set correctly
- Review TASK_3_TESTING_GUIDE.md for debugging steps

---

## Test Execution Log

### Test 1: Start Trial
- [ ] Logged in: Yes/No
- [ ] POST `/api/trial/start` status: ___
- [ ] Response received: Yes/No
- [ ] Grammar Master content visible: Yes/No
- [ ] Notes: ___

### Test 2: Check Trial Status
- [ ] GET `/api/trial/status/grammar-master` status: ___
- [ ] Response received: Yes/No
- [ ] days_remaining shown: Yes/No
- [ ] Grammar Master content visible: Yes/No
- [ ] Notes: ___

### Test 3: Unauthorized
- [ ] Logged out: Yes/No
- [ ] GET `/api/trial/status/grammar-master` status: ___
- [ ] Response received: Yes/No
- [ ] Grammar Master content visible: No (expected)
- [ ] Error message shown: Yes/No
- [ ] Notes: ___

---

## Summary

Ready to execute Tests 1-3 from TASK_3_TESTING_GUIDE.md:
1. ✅ Services configured
2. ✅ Test cases defined
3. ✅ Success criteria clear
4. ✅ Troubleshooting guide ready

**Next**: Start services and run tests
