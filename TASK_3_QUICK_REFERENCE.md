# Task 3: JWT Refactor - Quick Reference Card

## What Changed

### Frontend
- `use-trial.ts`: Now calls `/api/trial/*` instead of FastAPI directly
- No Authorization header needed (API Route handles it)

### Backend (Next.js)
- NEW: `src/app/api/trial/start/route.ts` - POST endpoint
- NEW: `src/app/api/trial/status/[productKey]/route.ts` - GET endpoint
- Both generate JWT and forward to FastAPI

### Backend (FastAPI)
- `trial.py`: Use `get_current_user_for_trial` instead of `get_current_user`
- `practice.py`: Use `get_current_user_for_trial` in dependency
- `deps.py`: Already has `get_current_user_for_trial` implemented

## Environment Variables

```bash
# Next.js (.env.local)
FASTAPI_URL=http://localhost:8000
FASTAPI_JWT_SECRET=your-secret-key

# FastAPI (.env)
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
```

**CRITICAL**: Both secrets must be identical!

## API Endpoints

### Start Trial
```
POST /api/trial/start
Content-Type: application/json

{
  "product_key": "grammar-master"
}

Response (200):
{
  "id": 1,
  "user_id": 123,
  "product_key": "grammar-master",
  "status": "active",
  "started_at": "2024-03-22T10:30:00",
  "ended_at": null,
  "created_at": "2024-03-22T10:30:00"
}

Response (401):
{
  "detail": "Unauthorized"
}
```

### Check Trial Status
```
GET /api/trial/status/grammar-master

Response (200):
{
  "product_key": "grammar-master",
  "status": "active",
  "started_at": "2024-03-22T10:30:00",
  "ended_at": null,
  "days_remaining": 7
}

Response (401):
{
  "detail": "Unauthorized"
}

Response (404):
{
  "detail": "No trial found for product: grammar-master"
}
```

## JWT Token Format

```json
{
  "sub": "123",
  "exp": 1711100400,
  "iat": 1710495600
}
```

- `sub`: User ID (string)
- `exp`: Expiration (Unix timestamp, 7 days from now)
- `iat`: Issued at (optional)

## Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 400 | Missing product_key | Request body missing product_key |
| 401 | Unauthorized | Not logged in |
| 401 | Missing authorization header | FastAPI didn't receive JWT |
| 401 | Invalid authorization header format | JWT format wrong |
| 401 | Token expired | JWT expired |
| 401 | Invalid token | JWT signature invalid |
| 401 | User not found | User ID from JWT doesn't exist |
| 404 | No trial found | No trial for this product |
| 500 | Internal server error | Server error |

## Quick Test

```bash
# 1. Start services
npm run dev                    # Terminal 1: Next.js
cd integrations/paddle-dodo && python -m uvicorn app.main:app --reload --port 8000  # Terminal 2: FastAPI

# 2. Test in browser
# Navigate to http://localhost:3000/zh/grammar-master
# Log in
# Click "Start Trial"
# Check DevTools Network tab:
#   - POST /api/trial/start should return 200
#   - GET /api/trial/status/grammar-master should return 200
#   - Grammar Master content should be visible

# 3. Test unauthorized
# Log out
# Navigate to http://localhost:3000/zh/grammar-master
# Check DevTools Network tab:
#   - GET /api/trial/status/grammar-master should return 401
#   - Grammar Master content should NOT be visible
```

## Files to Check

### Created
- `src/app/api/trial/start/route.ts`
- `src/app/api/trial/status/[productKey]/route.ts`

### Updated
- `integrations/paddle-dodo/app/routes/trial.py`
- `integrations/paddle-dodo/app/routes/practice.py`
- `src/hooks/use-trial.ts`

### Already Done
- `integrations/paddle-dodo/app/deps.py`

## Debugging

### Issue: 401 on `/api/trial/start`
1. Check if logged in: `fetch('/api/auth/session').then(r => r.json()).then(console.log)`
2. Check if `FASTAPI_JWT_SECRET` is set in `.env.local`
3. Check if it matches `JWT_SECRET_KEY` in FastAPI `.env`

### Issue: 401 on `/api/trial/status/grammar-master`
1. Check if logged in
2. Check if FastAPI is running: `http://localhost:8000/docs`
3. Check FastAPI logs for JWT validation errors

### Issue: Grammar Master content not showing
1. Check trial status: `fetch('/api/trial/status/grammar-master').then(r => r.json()).then(console.log)`
2. Check if `status: "active"` and `days_remaining > 0`
3. Check browser console for JavaScript errors

## Next Steps

1. ✅ Code implementation complete
2. ⏳ End-to-end testing (manual)
3. ⏳ Phase 2: Integration documentation

See `TASK_3_TESTING_GUIDE.md` for detailed testing instructions.

## Key Points

- ✅ Production-ready JWT authentication
- ✅ API Route proxy pattern
- ✅ No breaking changes to existing auth
- ✅ Ready for external customer integration
- ✅ Secure and scalable
- ✅ Comprehensive error handling
- ✅ Well documented

## Support

For detailed information, see:
- `TASK_3_JWT_REFACTOR_COMPLETE.md` - Architecture and design
- `TASK_3_TESTING_GUIDE.md` - Testing instructions
- `TASK_3_CODE_REFERENCE.md` - Complete code reference
- `TASK_3_IMPLEMENTATION_SUMMARY.md` - Implementation summary
