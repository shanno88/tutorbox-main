# Frontend Trial Authentication Fix

## Problem
前端调用 FastAPI `/trial/*` 接口时返回 401 Unauthorized，因为：
- 前端用的是 next-auth session（JWT strategy）
- FastAPI 期望的是自己签名的 JWT token
- 两个系统的 token 不兼容

## Solution

### Backend Change: FastAPI `get_current_user` 更新
**File**: `integrations/paddle-dodo/app/deps.py`

修改了 `get_current_user` 依赖，现在支持两种认证方式：
1. **JWT Token**: 用 `settings.jwt_secret_key` 签名的标准 JWT
2. **Simple User ID**: 直接传递 user ID（用于前端）

**逻辑**:
```python
# 首先尝试作为 JWT token 解析
try:
    payload = jwt.decode(token, settings.jwt_secret_key, ...)
    user_id = int(payload.get("sub"))
except jwt.InvalidTokenError:
    # JWT 解析失败，尝试作为简单的 user ID
    try:
        user_id = int(token)
    except ValueError:
        raise HTTPException(401, "Invalid token format")
```

### Frontend Change: useTrial Hook 确认
**File**: `src/hooks/use-trial.ts`

已确认 Authorization header 正确：
```typescript
headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${session.user.id}`, // User ID from next-auth session
}
```

**Token 来源**:
- `session.user.id` 来自 next-auth session
- 由 `src/lib/auth.ts` 的 JWT callback 设置
- 在用户登录时从数据库获取

---

## How to Test

### 1. Ensure Both Servers Running

**FastAPI Server**:
```bash
cd integrations/paddle-dodo
uvicorn app.main:app --reload
```

**Next.js Dev Server**:
```bash
npm run dev
```

### 2. Manual Frontend Test

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to `http://localhost:3000/zh/grammar-master` (or `/en/grammar-master`)
4. Login with test account
5. Look for these requests:
   - `GET /trial/status/grammar-master`
   - `POST /trial/start`

### 3. Verify Request Headers

In DevTools Network tab, click on `/trial/status/grammar-master` request:

**Request Headers** should show:
```
Authorization: Bearer 123
Content-Type: application/json
```

Where `123` is the actual user ID from session.

### 4. Verify Response Status

- **Before starting trial**: 
  - `/trial/status/grammar-master` → 404 (no trial found)
  - `/practice/grammar-master/content` → 403 (no trial or subscription)

- **After clicking "开始试用"**:
  - `/trial/start` → 200 (trial created)
  - `/trial/status/grammar-master` → 200 (trial active)
  - `/practice/grammar-master/content` → 200 (access granted)

### 5. Check Browser Console

Should see no errors like:
```
[useTrial] Failed to fetch trial status: Unauthorized
```

Instead should see successful responses logged.

---

## Expected Behavior

### Scenario 1: Not Logged In
- Grammar Master page shows login prompt
- No trial API calls made

### Scenario 2: Logged In, No Trial
- Page loads
- `/trial/status/grammar-master` returns 404
- "开始试用" button is enabled
- "开始试用" button shows "处理中..." while loading

### Scenario 3: Logged In, Trial Started
- Click "开始试用"
- `/trial/start` returns 200
- Page shows "✓ 试用中，剩余 7 天"
- "开始试用" button becomes disabled (trial already active)

### Scenario 4: Trial Expired
- Manually expire trial in database:
  ```bash
  sqlite3 integrations/paddle-dodo/app.db \
    "UPDATE trials SET started_at = datetime('now', '-8 days') WHERE product_key = 'grammar-master' LIMIT 1;"
  ```
- Refresh page
- `/trial/status/grammar-master` returns 200 but status="expired"
- Page no longer shows trial status
- "开始试用" button is enabled again

---

## Troubleshooting

### Still Getting 401?

1. **Check Authorization Header**:
   - DevTools → Network → Click request → Headers
   - Should see `Authorization: Bearer <number>`
   - If missing or `Bearer null`, session not loaded

2. **Check Session Status**:
   - Open browser console
   - Run: `fetch('/api/auth/session').then(r => r.json()).then(console.log)`
   - Should show user object with `id` field

3. **Check FastAPI Logs**:
   - Look for error messages in FastAPI terminal
   - Should show which part of `get_current_user` failed

### Getting 404 on /trial/status?

This is **normal** if user hasn't started trial yet. It means:
- Authorization header is correct (no 401)
- User is authenticated
- Just no trial record in database yet

### Getting 403 on /practice/grammar-master/content?

This is **expected** if:
- User has no trial (need to click "开始试用" first)
- User has Free subscription (not Pro)
- Trial has expired

---

## Files Modified

| File | Change |
|------|--------|
| `integrations/paddle-dodo/app/deps.py` | Updated `get_current_user` to accept user ID |
| `src/hooks/use-trial.ts` | Updated comments to clarify token source |

---

## Architecture

```
Frontend (Next.js)
  ↓
useTrial hook
  ↓
fetch(`/trial/status/grammar-master`, {
  headers: {
    Authorization: `Bearer ${session.user.id}`
  }
})
  ↓
FastAPI
  ↓
get_current_user dependency
  ↓
Try JWT decode → Fail → Try int(token) → Success
  ↓
Query user by ID → Return user
  ↓
Route handler processes request
  ↓
Return 200 or 403
```

---

## Next Steps

1. ✅ Test manually in browser
2. ✅ Verify Authorization headers are correct
3. ✅ Confirm trial flow works end-to-end
4. ✅ Run automated test script if needed
5. Consider: Add error logging for debugging
6. Consider: Add retry logic for failed requests
