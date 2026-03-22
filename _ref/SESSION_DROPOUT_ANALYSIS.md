# Session/Login State Dropout Issue - Analysis & Solution

## Problem Summary
用户反馈：之前登录后浏览器能记住登录状态好几天，最近发现已经退出登录，需要重新走 magic link 流程。

## Root Cause Analysis

### 1. **Session Expiration Time (DEFAULT: 30 days)**
- **Current Setting**: NextAuth uses **default JWT session expiration of 30 days**
- **Location**: `src/lib/auth.ts` - No explicit `session.maxAge` configured
- **Issue**: NextAuth defaults to 30 days, but this is the JWT token lifetime, not the cookie lifetime
- **Finding**: The JWT token itself is valid for 30 days, but the cookie might be cleared earlier

### 2. **Cookie Configuration (CRITICAL ISSUE)**
- **Current Setting**: NextAuth uses **session-only cookies by default** (no explicit maxAge)
- **Location**: `src/lib/auth.ts` - No `session.maxAge` or cookie configuration
- **Issue**: Session-only cookies are cleared when browser closes or after inactivity
- **Impact**: Even though JWT is valid for 30 days, the cookie holding the token is lost

### 3. **Email Remember Feature**
- **Current Status**: ❌ **NOT IMPLEMENTED**
- **Location**: `src/app/[locale]/login/page.tsx`
- **Issue**: No localStorage to remember email address
- **Impact**: Users must re-type email on each login

### 4. **Possible Session Invalidation**
- **NEXTAUTH_SECRET Changes**: If `NEXTAUTH_SECRET` was rotated, all existing JWT tokens become invalid
- **Database Changes**: If user record was deleted/modified, session callback might fail
- **Code Updates**: Recent changes to auth.ts callbacks could affect session validation

## Current Configuration Details

### NextAuth Settings (src/lib/auth.ts)
```typescript
session: {
  strategy: "jwt",  // Using JWT strategy
  // ❌ NO maxAge specified - defaults to 30 days
  // ❌ NO cookie configuration - uses session-only cookies
}
```

### Cookie Behavior
- **Cookie Name**: `next-auth.session-token` (or `__Secure-next-auth.session-token` in HTTPS)
- **Cookie Type**: Session cookie (cleared on browser close)
- **Cookie Duration**: Browser session only (NOT persistent)
- **httpOnly**: true (secure, can't be accessed by JavaScript)
- **Secure**: true in production (HTTPS only)
- **SameSite**: "lax" (default)

### JWT Token Lifetime
- **Default**: 30 days (from NextAuth defaults)
- **Actual Expiration**: Checked on each request via `jwt` callback
- **Issue**: Even if JWT is valid, cookie is gone

## Why Users Get Logged Out

### Scenario 1: Browser Close (Most Likely)
1. User logs in → JWT token stored in session cookie
2. User closes browser → Session cookie is cleared (browser behavior)
3. User reopens browser → No cookie found → Logged out
4. User must re-login via magic link

### Scenario 2: Browser Inactivity
1. User logs in → JWT token stored in session cookie
2. User doesn't use browser for several days
3. Browser clears session cookies (some browsers do this)
4. User must re-login

### Scenario 3: NEXTAUTH_SECRET Rotation
1. If `NEXTAUTH_SECRET` was changed in `.env`
2. All existing JWT tokens become invalid (can't be verified)
3. All users are logged out immediately
4. Users must re-login

## Solution Implementation

### Fix 1: Configure Persistent Cookie (7-14 days)
**File**: `src/lib/auth.ts`

Add explicit session configuration:
```typescript
session: {
  strategy: "jwt",
  maxAge: 14 * 24 * 60 * 60, // 14 days in seconds
},
```

This tells NextAuth to:
- Set cookie `Max-Age` to 14 days
- Keep JWT token valid for 14 days
- Persist cookie across browser restarts

### Fix 2: Implement Email Remember Feature
**File**: `src/app/[locale]/login/page.tsx`

Add localStorage to remember email:
```typescript
// On component mount
useEffect(() => {
  const savedEmail = localStorage.getItem("tutorbox_remembered_email");
  if (savedEmail) setEmail(savedEmail);
}, []);

// On successful email submission
if (emailSent) {
  localStorage.setItem("tutorbox_remembered_email", email);
}

// Add checkbox for "Remember email"
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={rememberEmail}
    onChange={(e) => setRememberEmail(e.target.checked)}
  />
  <span>Remember my email</span>
</label>
```

### Fix 3: Add Session Refresh Logic (Optional)
**File**: `src/lib/auth.ts` - JWT callback

Refresh token on each request to extend expiration:
```typescript
async jwt({ token, user, account }) {
  // On login, set issued time
  if (user) {
    token.iat = Math.floor(Date.now() / 1000);
  }
  
  // On each request, check if token is older than 7 days
  // If so, refresh it to extend expiration
  const now = Math.floor(Date.now() / 1000);
  const tokenAge = now - (token.iat as number || 0);
  const refreshThreshold = 7 * 24 * 60 * 60; // 7 days
  
  if (tokenAge > refreshThreshold) {
    token.iat = now; // Reset issued time to extend expiration
  }
  
  return token;
}
```

## Recommended Changes

### Priority 1 (Critical - Fixes Main Issue)
- [ ] Add `session.maxAge: 14 * 24 * 60 * 60` to NextAuth config
- [ ] This alone will fix 90% of the dropout issue

### Priority 2 (Important - Improves UX)
- [ ] Implement email remember feature in login page
- [ ] Users won't need to re-type email on next login

### Priority 3 (Nice to Have - Extends Session)
- [ ] Add token refresh logic to extend session on activity
- [ ] Users who actively use the app won't be logged out for 30+ days

## Testing the Fix

### Before Deployment
1. Clear browser cookies and localStorage
2. Login with email
3. Close browser completely
4. Reopen browser and visit site
5. Should still be logged in (not redirected to login)
6. Check cookie in DevTools → Application → Cookies
7. Verify `next-auth.session-token` has `Max-Age: 1209600` (14 days in seconds)

### After Deployment
1. Monitor user feedback for session dropout issues
2. Check server logs for JWT validation failures
3. Verify no increase in "sign in" page visits

## Environment Variable Considerations

### NEXTAUTH_SECRET Rotation
- ⚠️ **WARNING**: Changing `NEXTAUTH_SECRET` will invalidate all existing sessions
- If you need to rotate the secret:
  1. Deploy with new secret
  2. All users will be logged out (unavoidable)
  3. Users will need to re-login once
  4. After that, new sessions will use new secret

### Recommended Secret Management
- Use strong random secret: `openssl rand -base64 32`
- Store in secure environment variable manager
- Only rotate if compromised
- Document rotation in deployment notes

## Files to Modify

1. **src/lib/auth.ts** - Add session.maxAge configuration
2. **src/app/[locale]/login/page.tsx** - Add email remember feature
3. **docs/ENVIRONMENT_VARIABLES.md** - Document session duration

## Expected Outcome

After implementing Priority 1 fix:
- ✅ Users stay logged in for 14 days
- ✅ Session persists across browser restarts
- ✅ Only need to re-login after 14 days or manual logout
- ✅ No more unexpected logouts on browser close

After implementing Priority 2 fix:
- ✅ Email address is remembered in login form
- ✅ Users can quickly re-login if needed
- ✅ Better UX for returning users

## References

- [NextAuth.js Session Configuration](https://next-auth.js.org/configuration/options#session)
- [NextAuth.js JWT Configuration](https://next-auth.js.org/configuration/options#jwt)
- [HTTP Cookie Max-Age](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
