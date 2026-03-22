# Quick Debug Checklist - Trial Auth 401

## Before You Start
- [ ] FastAPI server running: `uvicorn app.main:app --reload`
- [ ] Next.js dev server running: `npm run dev`
- [ ] Browser DevTools open (F12)
- [ ] Logged in to Grammar Master page

## Step 1: Check Frontend (2 min)

### Console Tab
```javascript
// Run in browser console
fetch('/api/auth/session').then(r => r.json()).then(d => {
  console.log('Session:', d);
  console.log('User ID:', d.user?.id);
})
```

**Expected Output**:
```
Session: { user: { id: '123', email: '...', ... } }
User ID: 123
```

**If User ID is undefined**:
- ❌ Session not loaded
- ❌ User not logged in
- ❌ Check `src/lib/auth.ts` JWT callback

### Network Tab
1. Click "开始试用" button
2. Look for `/trial/start` request
3. Click on it
4. Go to "Headers" section
5. Look for "Authorization" header

**Expected**:
```
Authorization: Bearer 123
```

**If missing**:
- ❌ Frontend not sending header
- ❌ Check console for `token: undefined`

## Step 2: Check FastAPI Logs (1 min)

Look at FastAPI terminal output:

**Expected**:
```
DEBUG get_current_user: authorization='Bearer 123'
DEBUG: Extracted token='123'
DEBUG: JWT decode failed (InvalidTokenError), trying as user ID
DEBUG: Parsed as user ID: 123
DEBUG: User authenticated: test@example.com
```

**If you see**:
- `authorization=None` → Frontend not sending header
- `authorization='Bearer undefined'` → session.user.id is undefined
- `User not found for user_id=123` → User doesn't exist in FastAPI DB

## Step 3: Check Response Status (1 min)

In Network tab, check response status:

**Expected**: 200 OK

**If 401**: 
- Check FastAPI logs for error message
- Follow "Common Issues" section in DEBUG_TRIAL_AUTH_401.md

## Step 4: Verify Trial Status Displays (1 min)

After successful request:
- [ ] Page shows "✓ 试用中，剩余 7 天"
- [ ] No error messages
- [ ] Button becomes disabled

## Common Quick Fixes

### Fix 1: Session Not Loaded
```javascript
// In browser console
// Refresh page and wait for session to load
location.reload()
```

### Fix 2: User Not in FastAPI DB
```bash
# Register user in FastAPI
cd integrations/paddle-dodo
python test_grammar_master_trial.py
```

### Fix 3: CORS Issue
Check `integrations/paddle-dodo/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # ← Must have this
)
```

### Fix 4: Restart Servers
```bash
# Terminal 1: Restart FastAPI
cd integrations/paddle-dodo
uvicorn app.main:app --reload

# Terminal 2: Restart Next.js
npm run dev
```

## Success Indicators

✅ All of these should be true:
- [ ] Frontend console shows `token: <number>`
- [ ] Network tab shows `Authorization: Bearer <number>`
- [ ] FastAPI logs show `User authenticated: ...`
- [ ] Response status is 200
- [ ] Page displays "✓ 试用中，剩余 7 天"

## If Still Not Working

1. **Collect all debug info**:
   - Frontend console output
   - Network tab headers
   - FastAPI server logs
   - Error messages

2. **Check DEBUG_TRIAL_AUTH_401.md**:
   - Match your symptoms to common issues
   - Follow the solution

3. **Check database**:
   ```bash
   # Verify user exists
   sqlite3 integrations/paddle-dodo/app.db "SELECT id, email FROM users;"
   ```

## Time Estimate
- Total: ~5 minutes
- Step 1: 2 min
- Step 2: 1 min
- Step 3: 1 min
- Step 4: 1 min

---

**Status**: Debug logging active
**Next**: Remove debug logs after issue resolved
