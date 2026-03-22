# Action Plan: Fix Trial Auth 401 Issue

## Current Status
- `/trial/start` and `/trial/status/grammar-master` return 401
- Authorization header not being sent
- Debug logging added to identify root cause

## Immediate Actions (Next 30 minutes)

### 1. Restart Servers with Debug Output
```bash
# Terminal 1: FastAPI
cd integrations/paddle-dodo
uvicorn app.main:app --reload

# Terminal 2: Next.js
npm run dev
```

### 2. Run Quick Debug Checklist
Follow: `QUICK_DEBUG_CHECKLIST.md`

**Time**: ~5 minutes

**Collect**:
- Frontend console output
- Network tab headers
- FastAPI server logs

### 3. Identify Root Cause
Match your debug output to one of these:

**Case A**: `token: undefined` in console
- → Session not loaded
- → Fix: Wait for session to load or refresh page

**Case B**: `authorization=None` in FastAPI logs
- → Frontend not sending header
- → Fix: Check CORS or session issue

**Case C**: `User not found for user_id=123` in FastAPI logs
- → User doesn't exist in FastAPI DB
- → Fix: Register user in FastAPI

**Case D**: `authorization='Bearer 123'` but still 401
- → Other issue
- → Fix: Check FastAPI logs for specific error

### 4. Apply Fix
Based on identified root cause:

**If Case A** (Session not loaded):
```javascript
// In browser console
location.reload()  // Refresh page
```

**If Case B** (Frontend not sending header):
- Check `src/hooks/use-trial.ts` code
- Verify Authorization header is in fetch options
- Check CORS configuration

**If Case C** (User not in FastAPI DB):
```bash
# Register user
cd integrations/paddle-dodo
python test_grammar_master_trial.py
```

**If Case D** (Other issue):
- Check FastAPI logs for specific error message
- Follow `DEBUG_TRIAL_AUTH_401.md` for detailed analysis

### 5. Verify Fix
- [ ] Frontend console shows `token: <number>` (not undefined)
- [ ] Network tab shows `Authorization: Bearer <number>`
- [ ] FastAPI logs show `User authenticated: ...`
- [ ] Response status is 200
- [ ] Page displays "✓ 试用中，剩余 7 天"

## If Issue Not Resolved (Next 30 minutes)

### 1. Deep Dive Analysis
- Review `DEBUG_TRIAL_AUTH_401.md` carefully
- Check all debug output again
- Look for any error messages

### 2. Check Database
```bash
# Verify user exists in FastAPI
sqlite3 integrations/paddle-dodo/app.db "SELECT id, email FROM users;"

# Verify user exists in Next.js
sqlite3 prisma/dev.db "SELECT id, email FROM User;"
```

### 3. Check Configuration
```bash
# Verify CORS config in FastAPI
cat integrations/paddle-dodo/app/main.py | grep -A 5 "CORSMiddleware"

# Verify FastAPI URL in Next.js
echo $NEXT_PUBLIC_FASTAPI_URL
```

### 4. Check Session
```javascript
// In browser console
fetch('/api/auth/session').then(r => r.json()).then(d => {
  console.log('Full session:', d);
  console.log('User:', d.user);
  console.log('User ID:', d.user?.id);
})
```

## Success Criteria

✅ All of these must be true:
- [ ] `/trial/start` returns 200
- [ ] `/trial/status/grammar-master` returns 200
- [ ] Authorization header is sent
- [ ] Page displays trial status
- [ ] "开始试用" button works
- [ ] Trial countdown displays

## Cleanup (After Fix)

### 1. Remove Debug Logging
```bash
# Remove console.log from frontend
# Remove print() from backend
```

### 2. Verify No Debug Output
- Frontend console clean
- FastAPI logs clean

### 3. Test One More Time
- Verify everything still works
- No debug messages

### 4. Commit Changes
```bash
git add .
git commit -m "Fix: Trial auth 401 issue - add Authorization header"
```

## Timeline

| Step | Time | Status |
|------|------|--------|
| Restart servers | 2 min | ⏳ |
| Run debug checklist | 5 min | ⏳ |
| Identify root cause | 5 min | ⏳ |
| Apply fix | 5-10 min | ⏳ |
| Verify fix | 5 min | ⏳ |
| **Total** | **~30 min** | ⏳ |

## Fallback Plan

If issue not resolved in 30 minutes:

1. **Take a break** (5 minutes)
2. **Review debug output again** (10 minutes)
3. **Check documentation** (10 minutes)
4. **Ask for help** if still stuck

## Documentation References

- `QUICK_DEBUG_CHECKLIST.md` - Quick 5-minute checklist
- `DEBUG_TRIAL_AUTH_401.md` - Comprehensive debugging guide
- `DEBUGGING_SESSION_SUMMARY.md` - Debug logging summary

## Key Files

**Frontend**:
- `src/hooks/use-trial.ts` - Trial hook with debug logging

**Backend**:
- `integrations/paddle-dodo/app/deps.py` - Auth with debug logging
- `integrations/paddle-dodo/app/main.py` - CORS configuration

## Success Message

When everything works, you should see:

**Browser**:
```
✓ 试用中，剩余 7 天
```

**Console**:
```
[useTrial] Response status: 200
```

**FastAPI**:
```
DEBUG: User authenticated: test@example.com
```

---

**Start Time**: Now
**Target Completion**: 30 minutes
**Status**: Ready to debug

**Next**: Follow QUICK_DEBUG_CHECKLIST.md
