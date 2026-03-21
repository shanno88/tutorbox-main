# 3-Day Account Trial Implementation for Grammar Master

## Overview

Implemented a clean, centralized 3-day account trial system for Grammar Master that is completely separate from:
- ❌ Anonymous 30-minute trial (still works independently)
- ❌ Old 7-day trial logic (deprecated)
- ❌ Legacy `trialStartedAt` field (kept for backward compatibility only)
- ❌ Cast Master (not touched)

---

## 1. User Model Changes

### File: `prisma/schema.prisma`

**Added Fields:**
```prisma
model User {
  // ... existing fields ...
  
  // Account trial fields (3-day trial per user)
  trialStart    DateTime?
  trialEnd      DateTime?
  hasUsedTrial  Boolean  @default(false)

  // Legacy field - kept for backward compatibility
  trialStartedAt DateTime?
  plan           String?
}
```

**Migration File:** `prisma/migrations/20260308152319_add_account_trial_fields/migration.sql`

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialStart" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialEnd" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false;
```

**To Apply Migration:**
```bash
npx prisma migrate deploy
# or
npx prisma db push
```

---

## 2. Centralized Trial Logic

### File: `src/lib/trial/account-trial.ts` (NEW)

This file contains ALL account trial logic for Grammar Master.

**Main Function: `ensureAccountTrialForApp()`**

```typescript
export async function ensureAccountTrialForApp(
  userId: string,
  product: AccountTrialProduct
): Promise<AccountTrialResult>
```

**Behavior:**
1. Loads user from database
2. If `hasUsedTrial === false`:
   - Sets `trialStart = now`
   - Sets `trialEnd = now + 3 days`
   - Sets `hasUsedTrial = true`
   - Returns `{ isTrialActive: true, ... }`
3. If `hasUsedTrial === true`:
   - Checks if `now < trialEnd`
   - Returns `{ isTrialActive: true/false, ... }`

**Configuration:**
- Trial duration: `ACCOUNT_TRIAL_DAYS` env var (default: 3 days)
- Can be changed via `.env`: `ACCOUNT_TRIAL_DAYS=3`

**Helper Functions:**
- `checkPaidAccess()` - Checks if user has paid ProductGrant
- `checkGrammarMasterAccess()` - Complete access check (paid + trial)

**Return Type:**
```typescript
interface AccountTrialResult {
  isTrialActive: boolean;
  trialStart: Date | null;
  trialEnd: Date | null;
  hasUsedTrial: boolean;
  daysRemaining?: number;
}
```

---

## 3. Grammar Master Access API

### File: `src/app/api/grammar/access/route.ts` (UPDATED)

**Changes:**
- ❌ Removed: `ensureTrialForApp()` from old system
- ✅ Added: `checkGrammarMasterAccess()` from new system
- ✅ Kept: Anonymous trial logic (unchanged)

**Flow:**
```
1. Check if user is authenticated
   ├─ NO → Check anonymous trial
   │   ├─ Active → Allow (200 OK)
   │   ├─ Not started → Auto-start (200 OK + cookie)
   │   └─ Expired → Block (403)
   │
   └─ YES → Check account trial
       ├─ Paid access → Allow (200 OK)
       ├─ Trial active → Allow (200 OK)
       └─ Trial expired → Block (403)
```

**Response Examples:**

**Anonymous Trial Active:**
```json
{
  "ok": true,
  "code": "ANONYMOUS_TRIAL",
  "message": "Anonymous trial active. 25 minutes remaining.",
  "minutesRemaining": 25
}
```

**Account Trial Active:**
```json
{
  "ok": true,
  "code": "OK",
  "accessType": "trial",
  "daysRemaining": 2
}
```

**Trial Expired:**
```json
{
  "ok": false,
  "code": "TRIAL_EXPIRED",
  "message": "语法大师试用已结束，请升级 Pro 继续使用。",
  "upgradeUrl": "/#pricing"
}
```

---

## 4. Frontend Behavior

### File: `src/app/products/grammar-master/page.tsx` (NO CHANGES NEEDED)

The existing implementation already works correctly with the new system:

**Anonymous User:**
- `AnonymousTrialGuard` shows blue banner: "匿名试用：剩余 XX 分钟"
- Button click → API auto-starts anonymous trial → Redirect to app
- After 30 minutes → Shows expired modal

**Logged-In User (Trial Active):**
- `AnonymousTrialGuard` detects authentication → Hides banner
- Button click → API checks account trial → Redirect to app
- No anonymous trial logic applies

**Logged-In User (Trial Expired):**
- Button click → API returns 403
- Page shows `TrialExpiredNotice` component:
  - Message: "语法大师试用已结束"
  - Button: "查看定价方案" → `/#pricing`

---

## 5. Files Modified/Created

### Created:
1. ✅ `src/lib/trial/account-trial.ts` - Centralized trial logic
2. ✅ `prisma/migrations/20260308152319_add_account_trial_fields/migration.sql` - DB migration

### Modified:
1. ✅ `prisma/schema.prisma` - Added trial fields to User model
2. ✅ `src/app/api/grammar/access/route.ts` - Updated to use new trial system

### Not Modified (Already Works):
1. ✅ `src/app/products/grammar-master/page.tsx` - Frontend logic
2. ✅ `src/components/anonymous-trial-guard.tsx` - Anonymous trial component
3. ✅ `src/lib/anonymous-trial.ts` - Anonymous trial logic

---

## 6. Cleanup - What Was Removed

### ❌ No Longer Used by Grammar Master:
1. `src/components/trial-guard.tsx` - Old 7-day trial guard (forces login)
2. `src/lib/access.ts` - Old `checkUserAccess()` function
3. `src/lib/access/ensureTrialForApp.ts` - Old trial logic (10 minutes test mode)

These files still exist but are NOT used by Grammar Master anymore. They may still be used by Cast Master.

---

## 7. Final Behavior Summary

### Anonymous User (30-Minute Trial)

**First Visit:**
1. Visit `/products/grammar-master`
2. See blue banner: "匿名试用：剩余 30 分钟"
3. Click "开始使用语法大师（新试用系统）"
4. API auto-starts anonymous trial
5. Redirect to `https://gm.tutorbox.cc`

**Within 30 Minutes:**
- Can use Grammar Master freely
- Banner shows countdown
- No login required

**After 30 Minutes:**
- Trial expires
- Modal appears: "匿名试用已结束，请注册获得 3 天完整试用"
- Button click blocked
- Must sign up to continue

---

### Logged-In User (3-Day Account Trial)

**First Use After Login:**
1. User logs in via email magic link
2. Visit `/products/grammar-master`
3. No banner shown (authenticated)
4. Click "开始使用语法大师（新试用系统）"
5. API auto-starts 3-day trial:
   - Sets `trialStart = now`
   - Sets `trialEnd = now + 3 days`
   - Sets `hasUsedTrial = true`
6. Redirect to `https://gm.tutorbox.cc`

**Within 3 Days:**
- Can use Grammar Master freely
- No banner shown
- API returns: `{ ok: true, accessType: "trial", daysRemaining: X }`

**After 3 Days:**
- Trial expires
- Button click → API returns 403
- Page shows `TrialExpiredNotice`:
  - "语法大师试用已结束"
  - "你的试用已经用完。升级为语法大师 Pro 版后..."
  - Button: "查看定价方案" → `/#pricing`

---

### Logged-In User (Paid Access)

**With Active ProductGrant:**
1. User has paid `productGrant` with `type: "paid"`, `status: "active"`
2. Visit `/products/grammar-master`
3. Click button
4. API checks paid access first → Returns 200 OK
5. Redirect to `https://gm.tutorbox.cc`
6. Unlimited access (no trial logic applies)

---

## 8. Configuration

### Environment Variables

**`.env` or `.env.local`:**
```bash
# Account trial duration (default: 3 days)
ACCOUNT_TRIAL_DAYS=3

# Anonymous trial duration (default: 30 minutes)
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=30
```

---

## 9. Testing Instructions

### Test 1: Anonymous User Flow

**Steps:**
1. Open incognito/private browser window
2. Visit `http://localhost:3000/products/grammar-master`
3. Should see blue banner: "匿名试用：剩余 30 分钟"
4. Click "开始使用语法大师（新试用系统）"
5. Check Network tab: `GET /api/grammar/access` → 200 OK
6. Should redirect to `https://gm.tutorbox.cc`

**Expected:**
- ✅ Anonymous trial starts automatically
- ✅ Cookie `tutorbox_anon_trial` is set
- ✅ No login required

---

### Test 2: Logged-In User (First Time)

**Steps:**
1. Log in via `/zh/login` with email
2. Visit `http://localhost:3000/products/grammar-master`
3. Should NOT see blue banner (authenticated)
4. Click "开始使用语法大师（新试用系统）"
5. Check Network tab: `GET /api/grammar/access` → 200 OK
6. Check response: `{ ok: true, accessType: "trial", daysRemaining: 3 }`

**Expected:**
- ✅ 3-day account trial starts automatically
- ✅ Database: `hasUsedTrial = true`, `trialStart` and `trialEnd` set
- ✅ Redirect to app

---

### Test 3: Logged-In User (Trial Expired)

**Steps:**
1. Manually set `trialEnd` to past date in database:
   ```sql
   UPDATE "User" SET "trialEnd" = NOW() - INTERVAL '1 day' WHERE email = 'test@example.com';
   ```
2. Visit `/products/grammar-master`
3. Click button
4. Check Network tab: `GET /api/grammar/access` → 403 Forbidden

**Expected:**
- ✅ Button click blocked
- ✅ Shows "语法大师试用已结束" message
- ✅ Shows "查看定价方案" button

---

### Test 4: Database Check

**Query:**
```sql
SELECT id, email, "trialStart", "trialEnd", "hasUsedTrial" 
FROM "User" 
WHERE email = 'your-test-email@example.com';
```

**Expected After First Use:**
```
| id   | email              | trialStart          | trialEnd            | hasUsedTrial |
|------|--------------------|---------------------|---------------------|--------------|
| cxyz | test@example.com   | 2024-01-15 10:00:00 | 2024-01-18 10:00:00 | true         |
```

---

## 10. Migration Steps

**To apply the database changes:**

```bash
# Option 1: Run migration
npx prisma migrate deploy

# Option 2: Push schema directly (dev only)
npx prisma db push

# Option 3: Generate Prisma client
npx prisma generate
```

**Verify migration:**
```bash
npx prisma studio
# Check User model has new fields: trialStart, trialEnd, hasUsedTrial
```

---

## 11. Key Design Decisions

### Why Separate from Anonymous Trial?
- Anonymous trial: Cookie-based, no account required, 30 minutes
- Account trial: Database-based, requires login, 3 days
- Two completely independent systems with different purposes

### Why `hasUsedTrial` Boolean?
- Prevents users from getting multiple trials
- Simple flag: once true, always true
- Trial can only be started once per user

### Why Not Use `productGrants` for Trial?
- `productGrants` is for paid/gift access
- Account trial is a user-level feature (one per user, not per product)
- Simpler to track at user level

### Why 3 Days Instead of 7?
- Shorter trial encourages faster conversion
- Still enough time to evaluate the product
- Configurable via env var if needed

---

## 12. Troubleshooting

### Issue: "hasUsedTrial is not a column"
**Solution:** Run migration: `npx prisma db push`

### Issue: Trial doesn't start for logged-in user
**Check:**
1. User exists in database
2. `hasUsedTrial` is false
3. API is calling `checkGrammarMasterAccess()`

### Issue: Anonymous trial still shows for logged-in user
**Check:**
1. `AnonymousTrialGuard` component checks `isAuthenticated`
2. Session is valid
3. Cookie is being read correctly

---

## 13. Future Enhancements

### Possible Improvements:
1. Add trial reminder emails (1 day before expiration)
2. Add trial extension for special cases
3. Add admin panel to view/manage user trials
4. Add analytics to track trial conversion rates
5. Add A/B testing for different trial durations

---

## Summary

✅ Clean 3-day account trial system implemented
✅ Completely separate from anonymous 30-minute trial
✅ No dependency on old 7-day trial logic
✅ Centralized in one file: `src/lib/trial/account-trial.ts`
✅ Simple database schema with 3 fields
✅ Works seamlessly with existing frontend
✅ Grammar Master only (Cast Master not touched)
