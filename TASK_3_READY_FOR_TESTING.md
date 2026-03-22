# Task 3: Ready for Testing ✅

**Status**: All systems ready

**Services Running**:
- ✅ Next.js: http://localhost:3000
- ✅ FastAPI: http://127.0.0.1:8000

---

## What to Test

按照 TASK_3_TESTING_GUIDE.md 的 Test 1-3 进行测试：

### Test 1: Start Trial (Happy Path)
```
1. Navigate to http://localhost:3000/zh/grammar-master
2. Log in
3. Open DevTools → Network tab
4. Click "Start Trial"
5. Verify:
   - POST /api/trial/start → 200 (NOT http://localhost:8000/trial/start)
   - Response: { product_key, status, started_at, ... }
   - Grammar Master content appears
```

### Test 2: Check Trial Status
```
1. Refresh page
2. Open DevTools → Network tab
3. Verify:
   - GET /api/trial/status/grammar-master → 200
   - Response: { product_key, status, days_remaining, ... }
   - Grammar Master content visible
```

### Test 3: Unauthorized
```
1. Log out
2. Navigate to http://localhost:3000/zh/grammar-master
3. Open DevTools → Network tab
4. Verify:
   - GET /api/trial/status/grammar-master → 401
   - Grammar Master content NOT visible
   - Error message shown
```

---

## Key Points

✅ **Requests should be to `/api/trial/*`** (API Route proxy)
✅ **NOT to `http://localhost:8000/trial/*`** (direct FastAPI)
✅ **Frontend has no Authorization header** (API Route handles it)
✅ **API Route generates JWT and forwards to FastAPI**
✅ **FastAPI validates JWT via `get_current_user`**

---

## Files Modified

### Code Changes
- `integrations/paddle-dodo/app/deps.py` - JWT validation
- `integrations/paddle-dodo/app/routes/trial.py` - Use `get_current_user`
- `integrations/paddle-dodo/app/routes/practice.py` - Use `get_current_user`
- `src/hooks/use-trial.ts` - Call `/api/trial/*`
- `src/app/api/trial/start/route.ts` - NEW API Route
- `src/app/api/trial/status/[productKey]/route.ts` - NEW API Route

### Python 3.14 Compatibility
- `integrations/paddle-dodo/app/config.py` - Changed `str | None` to `Optional[str]`

---

## Environment Variables

**Next.js (.env.local)**
```
FASTAPI_URL=http://localhost:8000
FASTAPI_JWT_SECRET=your-secret-key-change-in-production
```

**FastAPI (.env)**
```
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
```

---

## Success Criteria

✅ Test 1: POST `/api/trial/start` returns 200, trial created, content accessible
✅ Test 2: GET `/api/trial/status/grammar-master` returns 200, status shown, content accessible
✅ Test 3: GET `/api/trial/status/grammar-master` returns 401, content not accessible, error shown

---

## If Issues Occur

### 401 on `/api/trial/start`
- Check if logged in
- Verify `FASTAPI_JWT_SECRET` is set and matches `JWT_SECRET_KEY`
- Check API Route logs for JWT generation errors

### 404 on `/api/trial/status/grammar-master`
- Verify Test 1 succeeded first
- Check FastAPI logs for JWT validation errors

### 200 instead of 401 (Test 3)
- Verify you're actually logged out
- Check session validation in API Route

---

## Next Steps

1. ✅ Services running
2. ⏳ Execute Tests 1-3
3. ⏳ Verify Network tab shows `/api/trial/*` requests
4. ⏳ If all pass → Phase 2 (Integration documentation)

---

## Summary

All systems ready for testing:
- ✅ FastAPI running with JWT validation
- ✅ Next.js running with API Routes
- ✅ Frontend hook updated
- ✅ Environment variables configured
- ✅ Ready for end-to-end testing

**Execute Tests 1-3 from TASK_3_TESTING_GUIDE.md now!**
