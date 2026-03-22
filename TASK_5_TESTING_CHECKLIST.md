# Task 5: Upsert User Implementation - Testing Checklist

## Pre-Testing Setup

### 1. Database Reset
```bash
# Delete old database with old schema
rm integrations/paddle-dodo/app.db
```

### 2. Start Services

**Terminal 1 - Next.js**:
```bash
npm run dev
# Should start on http://localhost:3000
```

**Terminal 2 - FastAPI**:
```bash
cd integrations/paddle-dodo
python -m uvicorn app.main:app --reload --port 8000
# Should start on http://127.0.0.1:8000
# Should see: "Base.metadata.create_all(bind=engine)" creating tables
```

## Test Scenarios

### Test 1: New User - Start Trial

**Steps**:
1. Open http://localhost:3000/zh/grammar-master
2. Click "登录" (login button)
3. Enter email: `test@example.com`
4. Check email for magic link and click it
5. Should redirect back to Grammar Master page
6. Click "开始 7 天免费试用" button

**Expected Results**:
- [ ] Page shows "加载中..." while session is loading
- [ ] After loading, shows "开始 7 天免费试用" button (not "登录后开始使用")
- [ ] Network tab shows:
  - [ ] POST /api/trial/start (200)
  - [ ] POST /auth/upsert-user (200)
  - [ ] POST /trial/start (200)
- [ ] Page shows "✓ 试用中，剩余 7 天"
- [ ] No error messages

**FastAPI Logs**:
- [ ] Should see JWT decode successful
- [ ] Should see user upsert: "created" or "updated"
- [ ] No ValueError or user lookup errors

---

### Test 2: Existing User - Check Trial Status

**Steps**:
1. Refresh the page (http://localhost:3000/zh/grammar-master)
2. Wait for page to load

**Expected Results**:
- [ ] Page shows "✓ 试用中，剩余 7 天" (or remaining days)
- [ ] Network tab shows:
  - [ ] GET /api/trial/status/grammar-master (200)
  - [ ] POST /auth/upsert-user (200)
  - [ ] GET /trial/status/grammar-master (200)
- [ ] No "User not found" errors

---

### Test 3: Unauthenticated User

**Steps**:
1. Open incognito/private window
2. Go to http://localhost:3000/zh/grammar-master
3. Wait for page to load

**Expected Results**:
- [ ] Page shows "登录后开始使用" (Sign in to get started)
- [ ] "开始 7 天免费试用" button is disabled
- [ ] Click button → redirects to login page
- [ ] No API calls to FastAPI (no upsert-user call)

---

### Test 4: JWT Token Validation

**Steps**:
1. Open browser DevTools → Network tab
2. Start trial (Test 1)
3. Click on POST /auth/upsert-user request
4. Check Request Headers → Authorization header

**Expected Results**:
- [ ] Authorization header: `Bearer eyJ...` (JWT token)
- [ ] Response status: 200
- [ ] Response body includes user data:
  ```json
  {
    "id": "user_id_string",
    "email": "test@example.com",
    "name": null,
    "created_at": "2024-01-15T..."
  }
  ```

---

### Test 5: Database Verification

**Steps**:
1. After Test 1, check FastAPI database
2. Open SQLite browser or use Python:
   ```python
   import sqlite3
   conn = sqlite3.connect('integrations/paddle-dodo/app.db')
   cursor = conn.cursor()
   
   # Check users table
   cursor.execute("SELECT * FROM users")
   print(cursor.fetchall())
   
   # Check trials table
   cursor.execute("SELECT * FROM trials")
   print(cursor.fetchall())
   ```

**Expected Results**:
- [ ] Users table has 1 row with:
  - [ ] id: string (e.g., "cmmko2rsk00019kk1h8ym5057")
  - [ ] email: "test@example.com"
  - [ ] name: NULL
  - [ ] hashed_password: "" (empty)
- [ ] Trials table has 1 row with:
  - [ ] user_id: matches user.id
  - [ ] product_key: "grammar-master"
  - [ ] status: "active"
  - [ ] days_remaining: 7

---

### Test 6: User Update (Upsert)

**Steps**:
1. Update user profile in NextAuth (if possible)
2. Or manually update session.user.name
3. Start another trial for different product
4. Check database

**Expected Results**:
- [ ] User record updated (not duplicated)
- [ ] Email and name fields updated
- [ ] No new user record created

---

### Test 7: Error Handling

**Test 7a: Invalid JWT**:
```bash
curl -X POST http://localhost:8000/auth/upsert-user \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json"
```

**Expected**: 401 Unauthorized - "Invalid token"

**Test 7b: Missing Authorization Header**:
```bash
curl -X POST http://localhost:8000/auth/upsert-user \
  -H "Content-Type: application/json"
```

**Expected**: 401 Unauthorized - "Missing authorization header"

**Test 7c: Missing Email in JWT**:
```bash
# Generate JWT without email field
curl -X POST http://localhost:8000/auth/upsert-user \
  -H "Authorization: Bearer {token_without_email}" \
  -H "Content-Type: application/json"
```

**Expected**: 401 Unauthorized - "Invalid token: missing sub or email"

---

## Verification Checklist

### Frontend (Next.js)
- [ ] Grammar Master page loads correctly
- [ ] Login/logout works
- [ ] Session status shows correctly (loading/authenticated/unauthenticated)
- [ ] Buttons disabled during loading
- [ ] No console errors

### Backend (FastAPI)
- [ ] /auth/upsert-user endpoint works
- [ ] User created on first call
- [ ] User updated on subsequent calls
- [ ] JWT validation works
- [ ] Error messages are clear

### Database
- [ ] User table has correct schema (String id, name field)
- [ ] Trial table has correct schema (String user_id)
- [ ] Data is persisted correctly
- [ ] Foreign keys work

### Integration
- [ ] Frontend → Backend communication works
- [ ] JWT token includes email and name
- [ ] Upsert happens before trial/start
- [ ] No "User not found" errors

---

## Troubleshooting

### Issue: "User not found in DB"

**Cause**: /auth/upsert-user not called or failed

**Solution**:
1. Check Network tab for POST /auth/upsert-user
2. Check response status (should be 200)
3. Check FastAPI logs for errors
4. Verify JWT_SECRET_KEY matches in both systems

---

### Issue: "Invalid token: missing sub or email"

**Cause**: JWT payload missing required fields

**Solution**:
1. Check JWT payload in API Route
2. Verify session.user.email exists
3. Check FASTAPI_JWT_SECRET is set

---

### Issue: Database schema error

**Cause**: Old database file still exists

**Solution**:
```bash
rm integrations/paddle-dodo/app.db
# Restart FastAPI
```

---

### Issue: CORS error

**Cause**: FastAPI CORS not configured for frontend URL

**Solution**:
Check `integrations/paddle-dodo/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Should include frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Performance Notes

- First call to /auth/upsert-user: ~50-100ms (creates user)
- Subsequent calls: ~10-20ms (updates user)
- Trial/start call: ~50-100ms (creates trial record)
- Trial/status call: ~10-20ms (queries trial record)

---

## Success Criteria

✅ All tests pass
✅ No console errors
✅ No FastAPI errors
✅ Database has correct data
✅ User can start trial and see remaining days
✅ User can refresh and see trial status
✅ Unauthenticated users see login prompt

---

## Next Steps

After all tests pass:
1. Test with multiple users
2. Test with different products
3. Test trial expiration logic
4. Test subscription integration
5. Deploy to staging environment
