# Grammar Master Redirect Fix

## Problem

Visiting `/products/grammar-master` immediately redirected to `/en/login`, preventing users from seeing the new Grammar Master product page with the anonymous trial system.

## Root Cause

The `src/app/products/grammar-master/layout.tsx` file was wrapping the page with the OLD `TrialGuard` component, which:
1. Checks if user is authenticated
2. If not authenticated → redirects to `/en/login` immediately
3. This happened BEFORE the page's `AnonymousTrialGuard` could render

**Conflict**:
- **Layout**: Used OLD `TrialGuard` (requires authentication)
- **Page**: Used NEW `AnonymousTrialGuard` (allows anonymous access)
- **Result**: Layout redirect happened first, page never rendered

## Solution

Removed the OLD `TrialGuard` from the layout, allowing the NEW `AnonymousTrialGuard` in the page to handle access control properly.

## Files Changed

### 1. `src/app/products/grammar-master/layout.tsx`

**Before**:
```tsx
import { TrialGuard } from "@/components/trial-guard";

export default function GrammarMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TrialGuard product="grammar">{children}</TrialGuard>;
}
```

**After**:
```tsx
// Layout removed - using AnonymousTrialGuard directly in page.tsx instead
// This allows anonymous users to access the page without authentication

export default function GrammarMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

**Changes**:
- ✅ Removed `TrialGuard` import
- ✅ Removed `TrialGuard` wrapper
- ✅ Added comment explaining why
- ✅ Layout now just passes through children

## Page Component Location

**File**: `src/app/products/grammar-master/page.tsx`

**Structure**:
```tsx
export default function GrammarMasterProductPage() {
  // ... component logic ...
  
  return (
    <AnonymousTrialGuard
      product="grammar-master"
      productName="Grammar Master"
      productNameCN="语法大师"
      locale="zh"
      autoStart={true}
      showBanner={true}
      blockOnExpired={false}
    >
      <main>
        {/* Grammar Master product page content */}
        <h1>语法大师 Grammar Master</h1>
        
        <button onClick={handleStartGrammarMaster}>
          开始使用语法大师（新试用系统）
        </button>
        
        <p className="text-green-600">
          ✓ 新版试用系统已启用：匿名 30 分钟 + 注册后 3 天完整试用
        </p>
        
        {/* ... rest of content ... */}
      </main>
    </AnonymousTrialGuard>
  );
}
```

## Access Control Logic

### Decision Flow

```
User visits /products/grammar-master
    ↓
Layout renders (just passes through children)
    ↓
Page component renders
    ↓
AnonymousTrialGuard checks authentication
    ↓
┌─────────────────────────────────────┐
│ Is user authenticated?              │
└────┬────────────────────────┬───────┘
     │                        │
    YES                      NO
     │                        │
     ▼                        ▼
┌─────────────┐      ┌──────────────────┐
│ Skip        │      │ Check anonymous  │
│ anonymous   │      │ trial cookie     │
│ trial logic │      └────┬─────────────┘
└─────┬───────┘           │
      │                   ▼
      │          ┌──────────────────┐
      │          │ Trial exists?    │
      │          └────┬─────────┬───┘
      │               │         │
      │              YES       NO
      │               │         │
      │               ▼         ▼
      │      ┌──────────┐  ┌──────────┐
      │      │ Expired? │  │ Auto-    │
      │      └──┬───┬───┘  │ start    │
      │         │   │      │ trial    │
      │        YES  NO     └──────────┘
      │         │   │
      │         ▼   ▼
      │   ┌────────────┐  ┌──────────┐
      │   │ Show modal │  │ Show     │
      │   │ Block      │  │ banner   │
      │   │ content    │  │ Allow    │
      │   └────────────┘  │ access   │
      │                   └──────────┘
      │
      ▼
┌──────────────────┐
│ Show page        │
│ (no banner)      │
│ Allow access     │
└──────────────────┘
```

### When to Show Product Page vs. Login

| Scenario | Shows Product Page? | Shows Login? | Notes |
|----------|---------------------|--------------|-------|
| Anonymous user, first visit | ✅ YES | ❌ NO | Auto-starts 30-min trial |
| Anonymous user, within 30 min | ✅ YES | ❌ NO | Shows countdown banner |
| Anonymous user, after 30 min | ✅ YES (blocked) | ❌ NO | Shows modal with signup button |
| Anonymous user clicks "Sign Up" | ❌ NO | ✅ YES | Redirects to `/en/login` |
| Logged-in user, within 3 days | ✅ YES | ❌ NO | No banner (uses account trial) |
| Logged-in user, after 3 days | ✅ YES (blocked) | ❌ NO | Shows upgrade notice |

**Key Point**: Login is ONLY triggered when:
1. Anonymous user clicks "Sign Up" button in expired modal, OR
2. User manually navigates to `/en/login`

**Never triggered automatically** just by visiting `/products/grammar-master`.

## Verification

### Test 1: Anonymous User Access

```bash
# 1. Clear cookies (simulate new user)
# In browser DevTools: Application → Cookies → Clear all

# 2. Visit Grammar Master page
open http://localhost:3000/products/grammar-master

# Expected Results:
# ✅ Page loads (NOT redirected to /en/login)
# ✅ Blue banner visible: "匿名试用: 剩余 30 分钟"
# ✅ Button text: "开始使用语法大师（新试用系统）"
# ✅ Green badge visible: "✓ 新版试用系统已启用..."
# ✅ Can click button and use app
```

### Test 2: Anonymous Trial Expiry

```bash
# 1. Set trial duration to 1 minute
# .env.local: NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=1

# 2. Visit page and wait 1 minute
open http://localhost:3000/products/grammar-master

# Expected Results:
# ✅ After 1 minute, modal appears
# ✅ Modal title: "Your 30-Minute Trial Has Ended"
# ✅ Modal has "Sign Up with Email" button
# ✅ Clicking "Sign Up" redirects to /en/login
# ✅ Content is blocked after dismissing modal
```

### Test 3: Logged-In User Access

```bash
# 1. Sign up and log in
open http://localhost:3000/en/login

# 2. Visit Grammar Master page
open http://localhost:3000/products/grammar-master

# Expected Results:
# ✅ Page loads immediately
# ✅ NO blue anonymous trial banner
# ✅ Button text: "开始使用语法大师（新试用系统）"
# ✅ Green badge visible
# ✅ Can click button and use app
```

### Test 4: No Redirect Loop

```bash
# 1. Visit page multiple times
open http://localhost:3000/products/grammar-master
# Refresh page
# Navigate away and back

# Expected Results:
# ✅ No redirect loops
# ✅ No infinite redirects
# ✅ Page loads consistently
# ✅ No console errors
```

## Middleware Behavior

**File**: `src/middleware.ts`

**Protected Paths**: Only `/todos` requires authentication

**Grammar Master Path**: `/products/grammar-master` is NOT protected

**Result**: Middleware allows anonymous access to Grammar Master page

## Component Hierarchy

```
/products/grammar-master
    ↓
layout.tsx (just passes through)
    ↓
page.tsx
    ↓
AnonymousTrialGuard (NEW system)
    ↓
<main> content
    ↓
Button + Banner + Badge
```

**Old Hierarchy (BROKEN)**:
```
/products/grammar-master
    ↓
layout.tsx
    ↓
TrialGuard (OLD system) ← REDIRECTED HERE
    ↓
❌ Never reached page.tsx
```

## Comparison: Old vs. New

| Aspect | Old System (TrialGuard) | New System (AnonymousTrialGuard) |
|--------|-------------------------|----------------------------------|
| **Location** | Layout (server component) | Page (client component) |
| **Authentication** | Required immediately | Optional (anonymous allowed) |
| **Trial Type** | Account-based only (3 days) | Anonymous (30 min) + Account (3 days) |
| **Redirect Behavior** | Redirects to `/en/login` if not authenticated | Shows page, only redirects when user clicks "Sign Up" |
| **Banner** | Amber banner for account trial | Blue banner for anonymous trial |
| **User Experience** | Must log in before seeing page | Can try immediately without login |

## Benefits of Fix

1. ✅ **Instant Access**: Anonymous users can see and use the page immediately
2. ✅ **No Forced Login**: Login only when user chooses to sign up
3. ✅ **Better UX**: Users can evaluate the product before committing
4. ✅ **Lower Friction**: 30-minute trial starts automatically
5. ✅ **Seamless Transition**: Anonymous → Account trial flow works
6. ✅ **Visual Confirmation**: Markers show new system is active

## Related Components

### AnonymousTrialGuard (NEW - Client Component)
- **File**: `src/components/anonymous-trial-guard.tsx`
- **Purpose**: Manages anonymous 30-min trial + account trial
- **Behavior**: Allows anonymous access, shows banners/modals

### TrialGuard (OLD - Server Component)
- **File**: `src/components/trial-guard.tsx`
- **Purpose**: Manages account-based trial only
- **Behavior**: Requires authentication, redirects if not logged in
- **Status**: ⚠️ Still used by Cast Master, but NOT by Grammar Master

## Future Cleanup

Consider updating Cast Master to also use `AnonymousTrialGuard` for consistency:

```tsx
// src/app/products/cast-master/layout.tsx (if it exists)
// Remove TrialGuard, use AnonymousTrialGuard in page instead
```

This would give Cast Master the same instant-access experience as Grammar Master.

## Rollback Plan

If issues arise, temporarily restore the old behavior:

```tsx
// src/app/products/grammar-master/layout.tsx
import { TrialGuard } from "@/components/trial-guard";

export default function GrammarMasterLayout({ children }) {
  return <TrialGuard product="grammar">{children}</TrialGuard>;
}
```

But this will bring back the immediate redirect to `/en/login`.

## Summary

**Problem**: Layout's `TrialGuard` redirected to `/en/login` before page could render

**Solution**: Removed `TrialGuard` from layout, let page's `AnonymousTrialGuard` handle access

**Result**: Anonymous users can now access `/products/grammar-master` and see the new trial system

**Files Changed**: 1 file (`src/app/products/grammar-master/layout.tsx`)

**Behavior**: Page shows for everyone, login only when user chooses to sign up
