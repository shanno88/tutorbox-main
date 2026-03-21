# Grammar Master Access Logic Fix

## Problem
When clicking the "开始使用语法大师（新试用系统）" button as an anonymous user, the system showed:
> "请先登录后再使用语法大师。你可以返回首页通过邮箱登录。"

This is the OPPOSITE of what we want. Anonymous users should get 30 minutes of free access WITHOUT logging in first.

## Root Cause
The API route `/api/grammar/access` was checking anonymous trial state, but when the trial was `"not_started"`, it fell through to the "NOT_AUTHENTICATED" error instead of auto-starting the trial.

**Flow Before Fix:**
1. Anonymous user clicks button
2. API checks `checkAnonymousAccess()` → returns `{ hasAccess: false, reason: "not_started" }`
3. API skips the "not_started" case
4. API hits the `if (!isAuthenticated)` check → returns 401 "NOT_AUTHENTICATED"
5. User sees "请先登录后再使用语法大师"

## Solution
Added logic to auto-start the anonymous trial when it's not started yet.

### File Modified
**`src/app/api/grammar/access/route.ts`**

### Code Changes

**BEFORE:**
```typescript
export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);
  const isAuthenticated = !!session?.user?.email;

  // Check anonymous trial access first
  const anonymousAccess = await checkAnonymousAccess(isAuthenticated, "grammar-master");

  // If anonymous trial is active, allow access
  if (anonymousAccess.hasAccess && anonymousAccess.reason === "anonymous_trial") {
    return NextResponse.json({ ok: true, code: "ANONYMOUS_TRIAL", ... }, { status: 200 });
  }

  // If anonymous trial expired, prompt to sign up
  if (!isAuthenticated && anonymousAccess.reason === "expired") {
    return NextResponse.json({ ok: false, code: "ANONYMOUS_TRIAL_EXPIRED", ... }, { status: 403 });
  }

  // ❌ MISSING: Handle "not_started" case
  // Falls through to this:

  // If not authenticated and no trial, require login
  if (!isAuthenticated) {
    return NextResponse.json({ ok: false, code: "NOT_AUTHENTICATED", ... }, { status: 401 });
  }

  // ... rest of authenticated user logic
}
```

**AFTER:**
```typescript
export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);
  const isAuthenticated = !!session?.user?.email;

  // Check anonymous trial access first
  const anonymousAccess = await checkAnonymousAccess(isAuthenticated, "grammar-master");

  // If anonymous trial is active, allow access
  if (anonymousAccess.hasAccess && anonymousAccess.reason === "anonymous_trial") {
    return NextResponse.json({ ok: true, code: "ANONYMOUS_TRIAL", ... }, { status: 200 });
  }

  // ✅ NEW: If anonymous trial not started and user is not authenticated, auto-start trial
  if (!isAuthenticated && anonymousAccess.reason === "not_started") {
    const { startAnonymousTrial } = await import("@/lib/anonymous-trial");
    const newTrialState = await startAnonymousTrial();
    
    const minutesRemaining = Math.floor(
      (newTrialState.expiryTimestamp - Date.now()) / (1000 * 60)
    );

    return NextResponse.json(
      {
        ok: true,
        code: "ANONYMOUS_TRIAL_STARTED",
        message: `Anonymous trial started. ${minutesRemaining} minutes remaining.`,
        minutesRemaining,
      },
      { status: 200 }
    );
  }

  // If anonymous trial expired, prompt to sign up
  if (!isAuthenticated && anonymousAccess.reason === "expired") {
    return NextResponse.json({ ok: false, code: "ANONYMOUS_TRIAL_EXPIRED", ... }, { status: 403 });
  }

  // If not authenticated and no trial, require login (shouldn't reach here normally)
  if (!isAuthenticated) {
    return NextResponse.json({ ok: false, code: "NOT_AUTHENTICATED", ... }, { status: 401 });
  }

  // ... rest of authenticated user logic
}
```

## Exact Behavior After Fix

### 1. Anonymous User - First Visit (Trial Not Started)
**User Action:** Clicks "开始使用语法大师（新试用系统）" button

**API Flow:**
1. `checkAnonymousAccess()` → `{ hasAccess: false, reason: "not_started" }`
2. API auto-starts trial via `startAnonymousTrial()`
3. Sets cookie with JWT token containing trial state
4. Returns `200 OK` with code `"ANONYMOUS_TRIAL_STARTED"`

**Result:**
- ✅ User is redirected to `https://gm.tutorbox.cc`
- ✅ 30-minute countdown starts
- ✅ No login required

### 2. Anonymous User - Within 30-Minute Window
**User Action:** Clicks button again (or refreshes page and clicks)

**API Flow:**
1. `checkAnonymousAccess()` → `{ hasAccess: true, reason: "anonymous_trial", minutesRemaining: X }`
2. Returns `200 OK` with code `"ANONYMOUS_TRIAL"`

**Result:**
- ✅ User is redirected to `https://gm.tutorbox.cc`
- ✅ Countdown continues
- ✅ No login required

### 3. Anonymous User - After 30 Minutes Expired
**User Action:** Clicks button after trial expires

**API Flow:**
1. `checkAnonymousAccess()` → `{ hasAccess: false, reason: "expired" }`
2. Returns `403 Forbidden` with code `"ANONYMOUS_TRIAL_EXPIRED"`

**Result:**
- ❌ Button click fails
- ❌ Page shows `status="expired"` state
- ✅ `TrialExpiredNotice` component appears with:
  - Message: "语法大师试用已结束"
  - "你的试用已经用完。升级为语法大师 Pro 版后，你可以继续无限次使用语法大师的所有功能。"
  - Button: "查看定价方案" → links to `/#pricing`
- ✅ Modal appears (if not seen before): "匿名试用已结束，请注册获得 3 天完整试用"

### 4. Logged-In User - Within 3-Day Account Trial
**User Action:** Logged-in user clicks button

**API Flow:**
1. `checkAnonymousAccess()` → `{ hasAccess: true, reason: "authenticated" }` (bypasses anonymous check)
2. Finds user in database
3. `ensureTrialForApp()` → auto-starts 3-day trial if first use, or checks existing trial
4. Trial is active → `{ hasAccess: true, isTrial: true, daysLeft: X }`
5. Returns `200 OK` with code `"OK"`

**Result:**
- ✅ User is redirected to `https://gm.tutorbox.cc`
- ✅ 3-day account trial active
- ✅ No anonymous trial logic applies

### 5. Logged-In User - After 3-Day Trial Expired
**User Action:** Logged-in user clicks button after account trial ends

**API Flow:**
1. `checkAnonymousAccess()` → `{ hasAccess: true, reason: "authenticated" }`
2. Finds user in database
3. `ensureTrialForApp()` → `{ hasAccess: false, reason: "TRIAL_EXPIRED" }`
4. Returns `403 Forbidden` with code `"TRIAL_EXPIRED"`

**Result:**
- ❌ Button click fails
- ❌ Page shows `status="expired"` state
- ✅ `TrialExpiredNotice` component appears with:
  - Message: "语法大师试用已结束"
  - "你的试用已经用完。升级为语法大师 Pro 版后，你可以继续无限次使用语法大师的所有功能。"
  - Button: "查看定价方案" → links to `/#pricing`

### 6. Logged-In User - With Paid Access
**User Action:** User with paid `productGrant` clicks button

**API Flow:**
1. `checkAnonymousAccess()` → `{ hasAccess: true, reason: "authenticated" }`
2. Finds user in database
3. `ensureTrialForApp()` → finds paid grant → `{ hasAccess: true, isTrial: false, reason: "PAID" }`
4. Returns `200 OK` with code `"OK"`

**Result:**
- ✅ User is redirected to `https://gm.tutorbox.cc`
- ✅ Full paid access
- ✅ No trial limitations

## Summary Table

| User State | Trial Status | Button Click Result | Redirect | Message |
|------------|--------------|---------------------|----------|---------|
| Anonymous | Not started | ✅ 200 OK | https://gm.tutorbox.cc | Trial auto-starts |
| Anonymous | Active (< 30min) | ✅ 200 OK | https://gm.tutorbox.cc | Continue trial |
| Anonymous | Expired (> 30min) | ❌ 403 Forbidden | None | "试用已结束" + upgrade prompt |
| Logged-in | Account trial active | ✅ 200 OK | https://gm.tutorbox.cc | 3-day trial |
| Logged-in | Account trial expired | ❌ 403 Forbidden | None | "试用已结束" + upgrade prompt |
| Logged-in | Paid access | ✅ 200 OK | https://gm.tutorbox.cc | Full access |

## Key Points

### ✅ What Works Now
1. Anonymous users can click button and immediately use Grammar Master for 30 minutes
2. No login required for first-time anonymous users
3. Trial auto-starts on first button click
4. Cookie-based trial state persists across page refreshes
5. After 30 minutes, users are prompted to sign up for 3-day account trial
6. Logged-in users get separate 3-day account trial
7. Paid users get unlimited access

### 🔄 Trial Progression
```
Anonymous User Journey:
1. Visit /products/grammar-master
2. See button "开始使用语法大师（新试用系统）"
3. Click button → Trial auto-starts → Redirect to app
4. Use for 30 minutes
5. Trial expires → See "试用已结束" message
6. Click "查看定价方案" or sign up for 3-day account trial

Logged-In User Journey:
1. Visit /products/grammar-master (already logged in)
2. Click button → 3-day account trial auto-starts → Redirect to app
3. Use for 3 days
4. Trial expires → See "试用已结束" message
5. Click "查看定价方案" → Upgrade to paid
```

### 🎯 Design Goals Achieved
- ✅ Reduce friction: Anonymous users can try immediately
- ✅ Progressive engagement: 30min anonymous → 3-day account → paid
- ✅ No forced login: Only required after anonymous trial expires
- ✅ Clear upgrade path: Pricing page linked from expired state
- ✅ Separate trials: Anonymous and account trials are independent

## Testing Checklist

- [ ] Anonymous user first visit → button click → redirects to app
- [ ] Anonymous user within 30min → button click → redirects to app
- [ ] Anonymous user after 30min → button click → shows expired message
- [ ] Logged-in user first use → button click → redirects to app (3-day trial starts)
- [ ] Logged-in user within 3 days → button click → redirects to app
- [ ] Logged-in user after 3 days → button click → shows expired message
- [ ] Paid user → button click → redirects to app (no trial)
- [ ] Cookie persists across page refreshes
- [ ] Expired modal shows once (not repeatedly)
- [ ] Upgrade links work correctly
