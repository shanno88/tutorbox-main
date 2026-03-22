# Grammar Master Trial Integration - Test Guide

## Quick Start

### 1. Start the FastAPI Server

```bash
cd integrations/paddle-dodo
uvicorn app.main:app --reload
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### 2. Run the Test Script

In a new terminal:

```bash
cd integrations/paddle-dodo
python test_grammar_master_trial.py
```

When prompted, press Enter to start the tests.

### 3. Expected Test Results

The script will run 9 test steps:

```
1. Initialize Free/Pro Plan
   ✅ Status: 200

2. Register new user
   ✅ Status: 200

3. Login user
   ✅ Status: 200
   ✅ Token obtained

4. Access Grammar Master without trial
   ✅ Status: 403 (Correct - no trial yet)

5. Start Grammar Master trial
   ✅ Status: 200
   ✅ Trial started successfully

6. Get trial status
   ✅ Status: 200
   ✅ Trial status: active, days_remaining: 7

7. Access Grammar Master with active trial
   ✅ Status: 200 (Correct - trial is active)

8. Simulate trial expiry
   ✅ Trial marked as expired (started_at set to 8 days ago)

9. Access Grammar Master with expired trial
   ✅ Status: 403 (Correct - trial expired)

✅ All tests passed!
```

---

## What Each Test Verifies

### Test 1: Initialize Plans
- Ensures Free and Pro plans exist in database
- Required for user registration

### Test 2: Register User
- Creates a new test user
- User automatically gets Free subscription

### Test 3: Login
- Authenticates user
- Obtains JWT token for subsequent requests

### Test 4: Access Without Trial (403)
- Verifies that users without trial cannot access Grammar Master content
- Expected: 403 Forbidden

### Test 5: Start Trial
- User initiates Grammar Master trial
- Creates Trial record in database
- Expected: 200 OK

### Test 6: Get Trial Status
- Queries current trial status
- Shows days remaining
- Expected: 200 OK, status="active", days_remaining=7

### Test 7: Access With Trial (200)
- Verifies that users with active trial CAN access Grammar Master content
- Expected: 200 OK

### Test 8: Simulate Expiry
- Modifies database to mark trial as expired
- Sets started_at to 8 days ago (past the 7-day limit)

### Test 9: Access With Expired Trial (403)
- Verifies that expired trials are rejected
- Expected: 403 Forbidden

---

## Troubleshooting

### Error: Connection refused
```
❌ Error: Failed to connect to http://localhost:8000
```
**Solution**: Make sure FastAPI server is running in another terminal
```bash
uvicorn app.main:app --reload
```

### Error: User already exists
```
❌ Error: User with email already exists
```
**Solution**: The test script generates unique emails with timestamps, so this shouldn't happen. If it does, delete `app.db` and restart:
```bash
rm app.db
uvicorn app.main:app --reload
```

### Error: Plan not found
```
❌ Error: Plan not found
```
**Solution**: Make sure test 1 (Initialize Plans) passed. If not, check database:
```bash
sqlite3 app.db "SELECT * FROM plans;"
```

### Error: Database locked
```
❌ Error: database is locked
```
**Solution**: Close any other connections to app.db and try again

---

## Manual Testing (Alternative)

If you prefer to test manually using curl:

### 1. Initialize Plans
```bash
curl -X POST http://localhost:8000/plans/seed
```

### 2. Register User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Save the `access_token` from response.

### 4. Start Trial
```bash
curl -X POST http://localhost:8000/trial/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"product_key":"grammar-master"}'
```

### 5. Get Trial Status
```bash
curl -X GET http://localhost:8000/trial/status/grammar-master \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Access Grammar Master Content
```bash
curl -X GET http://localhost:8000/practice/grammar-master/content \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 200 OK with content

### 7. Expire Trial (Database)
```bash
sqlite3 app.db "UPDATE trials SET started_at = datetime('now', '-8 days') WHERE product_key = 'grammar-master' LIMIT 1;"
```

### 8. Access Grammar Master Content Again
```bash
curl -X GET http://localhost:8000/practice/grammar-master/content \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 403 Forbidden

---

## Database Inspection

### View all trials
```bash
sqlite3 app.db "SELECT id, user_id, product_key, status, started_at FROM trials;"
```

### View specific user's trials
```bash
sqlite3 app.db "SELECT t.id, t.product_key, t.status, t.started_at FROM trials t JOIN users u ON t.user_id = u.id WHERE u.email = 'test@example.com';"
```

### View all users
```bash
sqlite3 app.db "SELECT id, email, created_at FROM users;"
```

### Reset database
```bash
rm app.db
uvicorn app.main:app --reload
```

---

## API Endpoints Reference

### Trial Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/trial/start` | Required | Start a trial for a product |
| GET | `/trial/status/{product_key}` | Required | Get trial status |

### Practice Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/practice/star-light-home` | Required (Pro) | Pro-only content |
| GET | `/practice/grammar-master/content` | Required (Trial/Sub) | Grammar Master content |

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login user |

---

## Success Criteria

✅ Test passes if:
- All 9 test steps complete without errors
- Status codes are correct (200, 403 as expected)
- Trial can be started and status retrieved
- Access is granted during trial period
- Access is denied after trial expiry
- No database errors occur

---

## Next Steps

After successful testing:

1. **Frontend Integration**: Test Grammar Master page with real trial flow
2. **Extend to Other Products**: Apply same pattern to Cast Master
3. **Monitor Metrics**: Track trial starts, conversions, expirations
4. **Add Cleanup**: Consider cron job to clean up old expired trials
5. **Performance**: Monitor database queries for large user bases

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review test script output for specific error messages
3. Check FastAPI server logs for backend errors
4. Inspect database with sqlite3 to verify data state
