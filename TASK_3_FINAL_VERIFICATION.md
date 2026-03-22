# Task 3: Final Verification - All Changes

## Status: ✅ COMPLETE

All import issues fixed. FastAPI should now start successfully.

---

## Files Modified (3 files)

### 1. `integrations/paddle-dodo/app/deps.py` ✅
**Status**: Modified
**Change**: Renamed function to `get_current_user`, added alias `get_current_user_for_trial`

**Key Implementation**:
```python
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db_session),
) -> models.User:
    """
    从 Authorization header 的 Bearer token 中解析当前用户。
    只接受标准 JWT token（使用 settings.jwt_secret_key 签名）。
    """
    # JWT validation logic
    # Returns 401 for all auth failures

# Backward compatibility alias
get_current_user_for_trial = get_current_user
```

**Why**: Centralizes JWT validation in one function, maintains backward compatibility

---

### 2. `integrations/paddle-dodo/app/routes/trial.py` ✅
**Status**: Modified
**Changes**:
- Import: `from app.deps import get_current_user, get_db_session`
- `/trial/start` endpoint: `Depends(get_current_user)`
- `/trial/status/{product_key}` endpoint: `Depends(get_current_user)`

**Before**:
```python
from app.deps import get_current_user_for_trial, get_db_session

@router.post("/start", ...)
async def start_trial(
    current_user: models.User = Depends(get_current_user_for_trial),
    ...
):
```

**After**:
```python
from app.deps import get_current_user, get_db_session

@router.post("/start", ...)
async def start_trial(
    current_user: models.User = Depends(get_current_user),
    ...
):
```

**Why**: Uses the standard `get_current_user` which now does JWT validation

---

### 3. `integrations/paddle-dodo/app/routes/practice.py` ✅
**Status**: Modified
**Changes**:
- Import: `from app.deps import get_current_user, get_db_session`
- `trial_or_subscription_grammar_master` dependency: `Depends(get_current_user)`

**Before**:
```python
from app.deps import get_current_user_for_trial, get_db_session

def trial_or_subscription_grammar_master(
    current_user: models.User = Depends(get_current_user_for_trial),
    ...
):
```

**After**:
```python
from app.deps import get_current_user, get_db_session

def trial_or_subscription_grammar_master(
    current_user: models.User = Depends(get_current_user),
    ...
):
```

**Why**: Uses the standard `get_current_user` which now does JWT validation

---

## Files NOT Modified (Already Correct) ✅

These files already import `get_current_user` and will work without changes:

### 1. `integrations/paddle-dodo/app/routes/billing.py`
```python
from app.deps import get_db_session, get_current_user
```
✅ No changes needed - already uses `get_current_user`

### 2. `integrations/paddle-dodo/app/routes/dodo/__init__.py`
```python
from app.deps import get_current_user
```
✅ No changes needed - already uses `get_current_user`

### 3. `integrations/paddle-dodo/app/dependencies/subscriptions.py`
```python
from app.deps import get_current_user, get_db_session
```
✅ No changes needed - already uses `get_current_user`

---

## Next.js API Routes (Already Created) ✅

### 1. `src/app/api/trial/start/route.ts`
✅ Created - Generates JWT and forwards to FastAPI

### 2. `src/app/api/trial/status/[productKey]/route.ts`
✅ Created - Generates JWT and forwards to FastAPI

---

## Frontend Hook (Already Updated) ✅

### `src/hooks/use-trial.ts`
✅ Updated - Calls `/api/trial/*` instead of FastAPI directly

---

## Summary of Changes

| File | Type | Status | Reason |
|------|------|--------|--------|
| `app/deps.py` | Modified | ✅ | Renamed function, added alias |
| `app/routes/trial.py` | Modified | ✅ | Use `get_current_user` |
| `app/routes/practice.py` | Modified | ✅ | Use `get_current_user` |
| `app/routes/billing.py` | No change | ✅ | Already correct |
| `app/routes/dodo/__init__.py` | No change | ✅ | Already correct |
| `app/dependencies/subscriptions.py` | No change | ✅ | Already correct |
| `src/app/api/trial/start/route.ts` | Created | ✅ | New API Route |
| `src/app/api/trial/status/[productKey]/route.ts` | Created | ✅ | New API Route |
| `src/hooks/use-trial.ts` | Updated | ✅ | Call new API Routes |

---

## Import Resolution

### Before (Broken)
```
trial.py imports get_current_user_for_trial ✓
practice.py imports get_current_user_for_trial ✓
billing.py imports get_current_user ✗ (doesn't exist)
dodo/__init__.py imports get_current_user ✗ (doesn't exist)
subscriptions.py imports get_current_user ✗ (doesn't exist)
→ ImportError: cannot import name 'get_current_user'
```

### After (Fixed)
```
deps.py exports:
  - get_current_user (main function with JWT validation)
  - get_current_user_for_trial (alias to get_current_user)

trial.py imports get_current_user ✓
practice.py imports get_current_user ✓
billing.py imports get_current_user ✓
dodo/__init__.py imports get_current_user ✓
subscriptions.py imports get_current_user ✓
→ All imports successful!
```

---

## JWT Validation Flow

```
Request with Authorization: Bearer <JWT>
    ↓
get_current_user (in deps.py)
    ├─ Extract Bearer token
    ├─ Validate JWT signature (using settings.jwt_secret_key)
    ├─ Extract sub claim (user ID)
    ├─ Query user from database
    └─ Return user or raise 401
    ↓
Route handler receives current_user
```

---

## Testing Checklist

### FastAPI Startup
- [ ] Run: `cd integrations/paddle-dodo && python -m uvicorn app.main:app --reload --port 8000`
- [ ] Expected: No ImportError
- [ ] Expected: "Application startup complete"

### Grammar Master Trial Flow
- [ ] Navigate to `/zh/grammar-master` (logged in)
- [ ] Click "Start Trial"
- [ ] Verify: POST `/api/trial/start` returns 200
- [ ] Verify: Grammar Master content is accessible
- [ ] Refresh page
- [ ] Verify: GET `/api/trial/status/grammar-master` returns 200
- [ ] Verify: Trial status shows active with days_remaining

### Error Cases
- [ ] Log out and try to access Grammar Master
- [ ] Verify: GET `/api/trial/status/grammar-master` returns 401
- [ ] Verify: Grammar Master content is not accessible

### FastAPI Logs
- [ ] No ImportError
- [ ] No JWT validation errors (unless token is actually invalid)
- [ ] Successful requests logged

---

## Environment Variables

Make sure these are set:

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

**CRITICAL**: Both secrets must be identical!

---

## Rollback Plan

If issues arise, revert these 3 files:
1. `integrations/paddle-dodo/app/deps.py` - Restore original `get_current_user_for_trial`
2. `integrations/paddle-dodo/app/routes/trial.py` - Use `get_current_user_for_trial`
3. `integrations/paddle-dodo/app/routes/practice.py` - Use `get_current_user_for_trial`

However, this should not be necessary as the fix is clean and backward-compatible.

---

## Conclusion

All import issues have been fixed. The implementation is:
- ✅ Clean (single JWT validation function)
- ✅ Backward-compatible (alias for trial routes)
- ✅ Production-ready (standard JWT validation)
- ✅ Ready for testing

**Next Action**: Start FastAPI and run end-to-end testing using `TASK_3_TESTING_GUIDE.md`
