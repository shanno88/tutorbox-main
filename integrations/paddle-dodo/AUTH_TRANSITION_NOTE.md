# Authentication Transition Note

## Current State (Temporary)

### What's Happening
- Frontend sends: `Authorization: Bearer <user_id>`
- Backend accepts both:
  1. Standard JWT tokens (preferred)
  2. Simple user IDs (temporary fallback)

### Why This Works
- Next-auth and FastAPI use different JWT systems
- User ID fallback enables quick local development
- Allows Grammar Master trial system to work end-to-end

### Why It's Temporary
- ⚠️ Not secure for production
- ⚠️ Can't be sold to external customers
- ⚠️ Doesn't follow industry standards
- ⚠️ No token expiration/refresh

---

## Code Location

**File**: `integrations/paddle-dodo/app/deps.py`

**Function**: `get_current_user()`

**Key Lines**:
```python
# Try JWT decode first
try:
    payload = jwt.decode(token, settings.jwt_secret_key, ...)
    user_id = int(payload.get("sub"))
except jwt.InvalidTokenError:
    # Fallback: try as simple user ID
    try:
        user_id = int(token)  # ← TEMPORARY FALLBACK
    except ValueError:
        raise HTTPException(401, "Invalid token format")
```

---

## TODO: Remove This Later

When implementing Phase 2 (Standardization):

1. **Remove user ID fallback**:
   ```python
   # DELETE THIS BLOCK:
   except jwt.InvalidTokenError:
       try:
           user_id = int(token)
       except ValueError:
           raise HTTPException(401, "Invalid token format")
   ```

2. **Implement standard JWT only**:
   ```python
   except jwt.InvalidTokenError:
       raise HTTPException(401, "Invalid token")
   ```

3. **Update frontend** to use:
   - Option A: `/api/trial/*` (Next.js proxy)
   - Option B: Real JWT from next-auth

---

## Timeline

- **Now**: User ID fallback active (local development)
- **1-2 weeks**: Grammar Master trial fully tested
- **2-3 weeks**: Phase 2 starts (standardization)
- **Before launch**: User ID fallback removed

---

## Related Documents

- `AUTH_MIGRATION_ROADMAP.md` - Full migration plan
- `TASK_5_FINAL_SUMMARY.md` - Task completion summary
- `FRONTEND_TRIAL_AUTH_FIX.md` - Frontend auth details

---

**Status**: ✅ Temporary (Transition Phase)
**Created**: Today
**To Remove**: During Phase 2 (Standardization)
