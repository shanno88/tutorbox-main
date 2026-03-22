# Task 5: Quick Start Guide

## 30-Second Overview

✅ **What**: NextAuth users are now automatically synced to FastAPI via JWT upsert pattern
✅ **How**: Frontend calls `/auth/upsert-user` before trial endpoints
✅ **Result**: No more "User not found" errors

## Setup (5 minutes)

```bash
# 1. Delete old database
rm integrations/paddle-dodo/app.db

# 2. Terminal 1: Start Next.js
npm run dev

# 3. Terminal 2: Start FastAPI
cd integrations/paddle-dodo
python -m uvicorn app.main:app --reload --port 8000
```

## Test (2 minutes)

1. Go to http://localhost:3000/zh/grammar-master
2. Click "登录" → Enter email → Check email for magic link
3. Click "开始 7 天免费试用"
4. Open DevTools → Network tab
5. Should see:
   - ✅ POST /auth/upsert-user (200)
   - ✅ POST /trial/start (200)
6. Page shows "✓ 试用中，剩余 7 天"

## What Changed

### Backend (FastAPI)
- New endpoint: `POST /auth/upsert-user`
- New dependency: `get_current_user_or_upsert()`
- User model: Added `name` field
- All user_id: Changed to String type

### Frontend (Next.js)
- `/api/trial/start`: Calls upsert-user first
- `/api/trial/status/*`: Calls upsert-user first
- JWT payload: Added email and name

## API Endpoint

```bash
POST /auth/upsert-user
Authorization: Bearer {JWT_TOKEN}
```

**JWT Payload**:
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "exp": 1234567890
}
```

**Response**:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "created_at": "2024-01-15T..."
}
```

## Files Modified

**Backend** (4 files):
- `app/models.py` - Added name field
- `app/deps.py` - Added upsert dependency
- `app/routes/auth.py` - Added upsert endpoint
- `app/schemas.py` - Updated schemas

**Frontend** (2 files):
- `src/app/api/trial/start/route.ts`
- `src/app/api/trial/status/[productKey]/route.ts`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "User not found" | Check Network tab for POST /auth/upsert-user |
| 401 Unauthorized | Verify JWT_SECRET_KEY matches in both systems |
| Database error | Delete app.db and restart FastAPI |
| CORS error | Check FastAPI CORS config includes localhost:3000 |

## Documentation

- **Full Guide**: `docs/EXTERNAL_AUTH_INTEGRATION.md`
- **Implementation**: `TASK_5_UPSERT_USER_IMPLEMENTATION.md`
- **Testing**: `TASK_5_TESTING_CHECKLIST.md`
- **Summary**: `TASK_5_SUMMARY.md`

## Next Steps

1. ✅ Run quick test above
2. ✅ Check Network tab for correct API calls
3. ✅ Verify database has user data
4. ✅ Test with multiple users
5. ✅ Deploy to staging

---

**Status**: ✅ Ready to test
