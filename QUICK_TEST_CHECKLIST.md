# Quick Test Checklist - Frontend Trial Auth Fix

## Pre-Test Setup

- [ ] FastAPI server running: `cd integrations/paddle-dodo && uvicorn app.main:app --reload`
- [ ] Next.js dev server running: `npm run dev`
- [ ] Both servers accessible (FastAPI on 8000, Next.js on 3000)
- [ ] Test account created and ready to login

## Test Steps

### 1. Login & Navigate
- [ ] Open `http://localhost:3000/zh/grammar-master` (or `/en/grammar-master`)
- [ ] Click login
- [ ] Enter test account credentials
- [ ] Successfully logged in

### 2. Check Network Requests
- [ ] Open DevTools (F12)
- [ ] Go to Network tab
- [ ] Look for requests to `/trial/status/grammar-master`
- [ ] Look for requests to `/trial/start`

### 3. Verify Authorization Headers
For each trial request:
- [ ] Click on request in Network tab
- [ ] Go to "Headers" section
- [ ] Find "Authorization" header
- [ ] Should show: `Authorization: Bearer <number>` (not `Bearer null`)
- [ ] Should NOT show 401 error

### 4. Test Trial Start Flow
- [ ] Click "开始试用" button
- [ ] Button shows "处理中..." while loading
- [ ] `/trial/start` request returns 200
- [ ] Page updates to show "✓ 试用中，剩余 7 天"
- [ ] Button becomes disabled

### 5. Verify Access Control
- [ ] Try to access `/practice/grammar-master/content` endpoint
- [ ] Should return 200 (access granted)
- [ ] No 403 errors

### 6. Test Trial Expiry (Optional)
- [ ] Expire trial in database:
  ```bash
  sqlite3 integrations/paddle-dodo/app.db \
    "UPDATE trials SET started_at = datetime('now', '-8 days') WHERE product_key = 'grammar-master' LIMIT 1;"
  ```
- [ ] Refresh page
- [ ] `/trial/status/grammar-master` still returns 200
- [ ] But status shows "expired"
- [ ] `/practice/grammar-master/content` returns 403

## Expected Results

✅ **All Passing**:
- Authorization headers present and correct
- No 401 Unauthorized errors
- Trial can be started
- Trial status displays correctly
- Access control works (200 with trial, 403 without)

❌ **If Failing**:
- Check FastAPI logs for error messages
- Verify session is loaded (check `/api/auth/session`)
- Verify user ID is correct in Authorization header
- Check database for trial records

## Browser Console Commands

```javascript
// Check session
fetch('/api/auth/session').then(r => r.json()).then(console.log)

// Check user ID
fetch('/api/auth/session').then(r => r.json()).then(d => console.log('User ID:', d.user?.id))

// Manually call trial API (replace USER_ID)
fetch('http://localhost:8000/trial/status/grammar-master', {
  headers: { Authorization: 'Bearer USER_ID' }
}).then(r => r.json()).then(console.log)
```

## Database Inspection

```bash
# View all trials
sqlite3 integrations/paddle-dodo/app.db "SELECT id, user_id, product_key, status, started_at FROM trials;"

# View specific user's trials
sqlite3 integrations/paddle-dodo/app.db "SELECT t.id, t.product_key, t.status, t.started_at FROM trials t JOIN users u ON t.user_id = u.id WHERE u.email = 'test@example.com';"

# Reset database
rm integrations/paddle-dodo/app.db
```

## Success Criteria

✅ Test passes if:
1. Authorization header is present and correct
2. No 401 Unauthorized errors
3. Trial can be started successfully
4. Trial status displays correctly
5. Access control works as expected
6. No console errors related to authentication

---

**Time to Complete**: ~5-10 minutes
**Difficulty**: Easy
**Risk**: Low (read-only test, no data modification)
