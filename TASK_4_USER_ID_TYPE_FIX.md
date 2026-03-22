# Task 4: User ID Type Unification - String ID Fix

## Problem
- NextAuth provides user.id as a **string** (e.g., `"cmmko2rsk00019kk1h8ym5057"`)
- FastAPI User model had id as **Integer**
- JWT signing used NextAuth's string ID as `sub`
- `get_current_user` tried to convert string to int: `user_id = int(user_id_str)` → ValueError

## Solution
Changed FastAPI User model to use **String IDs** to match NextAuth/Prisma:

### Files Modified

#### 1. `integrations/paddle-dodo/app/models.py`
- User.id: `Integer` → `String`
- Subscription.user_id: `Integer` → `String` (foreign key)
- Trial.user_id: `Integer` → `String` (foreign key)

#### 2. `integrations/paddle-dodo/app/deps.py`
- Removed `int(user_id_str)` conversion
- Now uses string user_id directly: `user_id: str = payload.get("sub")`
- Query: `db.query(models.User).filter(models.User.id == user_id).first()`

## Database Migration

Since FastAPI uses SQLAlchemy with SQLite and no migration tool, we need to:

1. **Delete the old database file** (it has Integer user_id schema):
   ```bash
   rm integrations/paddle-dodo/app.db
   ```

2. **Restart FastAPI** - it will recreate tables with new String ID schema:
   ```bash
   cd integrations/paddle-dodo
   python -m uvicorn app.main:app --reload --port 8000
   ```

## JWT Flow (Now Unified)

```
Frontend (Next.js)
  ↓
User logs in via NextAuth
  ↓
session.user.id = "cmmko2rsk00019kk1h8ym5057" (string)
  ↓
API Route /api/trial/start
  ↓
Generate JWT: jwt.sign({ sub: String(user.id), exp: ... })
  ↓
POST to FastAPI with Bearer token
  ↓
FastAPI get_current_user
  ↓
Decode JWT: payload.get("sub") → "cmmko2rsk00019kk1h8ym5057"
  ↓
Query: User.id == "cmmko2rsk00019kk1h8ym5057" ✅
  ↓
Return user object
```

## Testing

After restart, test the flow:

1. **Grammar Master page** → Click "开始试用"
2. **Network tab** → POST /api/trial/start
3. **Expected**: 200 OK (not 401 or 500)
4. **FastAPI logs**: Should show successful JWT decode and user lookup

## Verification Checklist

- [ ] Deleted `integrations/paddle-dodo/app.db`
- [ ] Restarted FastAPI (`python -m uvicorn app.main:app --reload --port 8000`)
- [ ] POST /api/trial/start returns 200 (not 500)
- [ ] FastAPI logs show no ValueError on int() conversion
- [ ] Trial status query works (GET /api/trial/status/grammar-master)
- [ ] Can start trial and see remaining days

## Files Changed

1. `integrations/paddle-dodo/app/models.py` - User.id type changed to String
2. `integrations/paddle-dodo/app/deps.py` - Removed int() conversion
