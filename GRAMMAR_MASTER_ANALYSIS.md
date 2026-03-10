# Grammar Master - Complete System Analysis

## Overview
This document analyzes ALL routes, components, and systems related to Grammar Master to identify which use the old 7-day trial system vs. the new anonymous + 3-day trial system.

---

## 🟢 NEW SYSTEM (Anonymous 30min + Account 3-day Trial)

### 1. **Main Product Page**
**File:** `src/app/products/grammar-master/page.tsx`
**What it does:** The main Grammar Master product page that users visit
**System:** ✅ NEW - Uses `AnonymousTrialGuard` component
**Details:**
- Wraps entire page with `AnonymousTrialGuard` (product="grammar-master")
- Shows 30-minute countdown banner for anonymous users
- Button text: "开始使用语法大师（新试用系统）"
- Green badge: "✓ 新版试用系统已启用：匿名 30 分钟 + 注册后 3 天完整试用"
- Calls `/api/grammar/access` when button clicked
- Checks external link health before redirecting

### 2. **Product Page Layout**
**File:** `src/app/products/grammar-master/layout.tsx`
**What it does:** Layout wrapper for Grammar Master pages
**System:** ✅ NEW - Removed old TrialGuard, just passes through children
**Details:**
- Previously used OLD `TrialGuard` which forced immediate login
- Now just returns `{children}` - no authentication check
- Allows anonymous users to access the page

### 3. **Grammar Access API**
**File:** `src/app/api/grammar/access/route.ts`
**What it does:** API endpoint that checks if user can access Grammar Master
**System:** ✅ HYBRID - Uses BOTH systems
**Details:**
- First checks anonymous trial via `checkAnonymousAccess()`
- If anonymous trial active → returns 200 with "ANONYMOUS_TRIAL" code
- If anonymous trial expired → returns 403 with "ANONYMOUS_TRIAL_EXPIRED"
- If authenticated → checks account-based trial via `ensureTrialForApp()`
- Account trial: Auto-starts on first use, currently 10 minutes (TEST), should be 3 days
- Returns upgrade URL: `/#pricing`

### 4. **Anonymous Trial Configuration**
**File:** `src/config/anonymous-trial.ts`
**What it does:** Configuration for anonymous trial system
**System:** ✅ NEW
**Details:**
- Defines supported products: `["grammar-master", "cast-master"]`
- Max actions: 10 grammar checks during anonymous trial
- Duration controlled by env var `NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES` (default 30)

### 5. **Anonymous Trial Guard Component**
**File:** `src/components/anonymous-trial-guard.tsx`
**What it does:** Client component that wraps pages to enforce anonymous trial
**System:** ✅ NEW
**Details:**
- Shows countdown banner for anonymous users
- Auto-starts trial on mount if `autoStart={true}`
- Shows expired modal when trial ends
- Blocks content if `blockOnExpired={true}`
- Used by Grammar Master page

### 6. **Anonymous Trial Hook**
**File:** `src/hooks/use-anonymous-trial.ts`
**What it does:** React hook for managing anonymous trial state
**System:** ✅ NEW
**Details:**
- Fetches trial state from `/api/anonymous-trial/state`
- Provides: `hasAccess`, `isExpired`, `minutesRemaining`, `startTrial()`, etc.
- Used by `AnonymousTrialGuard` component

### 7. **Anonymous Trial Server Logic**
**File:** `src/lib/anonymous-trial.ts`
**What it does:** Server-side functions for anonymous trial (JWT signing, verification)
**System:** ✅ NEW
**Details:**
- Signs JWT tokens with trial data
- Verifies tokens from cookies
- Checks if trial is expired
- Used by API routes

### 8. **Anonymous Trial API Routes**
**Files:**
- `src/app/api/anonymous-trial/state/route.ts`
- `src/app/api/anonymous-trial/start/route.ts`
- `src/app/api/anonymous-trial/mark-seen/route.ts`
- `src/app/api/anonymous-trial/increment/route.ts`

**What they do:** API endpoints for managing anonymous trial state
**System:** ✅ NEW
**Details:**
- `/state` - Get current trial status
- `/start` - Start a new anonymous trial
- `/mark-seen` - Mark expired modal as seen
- `/increment` - Increment action counter (for future use)

### 9. **External Link Health Check**
**File:** `src/config/external-links.ts`
**What it does:** Configuration for checking external Grammar Master URLs
**System:** ✅ NEW (supporting feature)
**Details:**
- Defines `grammar_master_app` (https://gm.tutorbox.cc)
- Defines `grammar_master_trial` (https://tutorbox.cc/products/grammar-master)
- Used to prevent redirecting to broken external services

---

## 🔴 OLD SYSTEM (7-day trial + immediate login)

### 10. **Trial Guard Component**
**File:** `src/components/trial-guard.tsx`
**What it does:** Server component that forces authentication and checks trial
**System:** ❌ OLD - Forces immediate login, checks 7-day trial
**Details:**
- Redirects to `/en/login` if not authenticated
- Uses `checkUserAccess()` which checks `trialStartedAt` field
- 7-day trial from user registration
- Redirects to product page if trial expired
- **NOT USED by Grammar Master anymore** (removed from layout)

### 11. **User Access Check**
**File:** `src/lib/access.ts`
**What it does:** Checks if user has access based on `trialStartedAt` field
**System:** ❌ OLD - Uses 7-day trial from registration
**Details:**
- Checks `user.trialStartedAt` field (set on registration)
- 7-day trial duration hardcoded
- Checks `productGrants` for paid access
- Returns `{ access: true/false, reason: "paid" | "trial" | "expired" }`
- **STILL USED by Cast Master** via `TrialGuard`

### 12. **Ensure Trial for App**
**File:** `src/lib/access/ensureTrialForApp.ts`
**What it does:** Auto-starts trial on first app use, creates `productGrant` record
**System:** ⚠️ HYBRID - Used by account-based trial (after anonymous expires)
**Details:**
- Called by `/api/grammar/access` for authenticated users
- Auto-creates trial `productGrant` on first use
- Currently 10 minutes (TEST), should be 3 days
- Checks for paid `productGrant` first
- **USED by Grammar Master** for account-based trial

---

## 🟡 NEUTRAL / SUPPORTING COMPONENTS

### 13. **Product Definition**
**File:** `src/lib/products.ts`
**What it does:** Defines all products including Grammar Master
**System:** 🟡 NEUTRAL - Just data definition
**Details:**
- Defines Grammar Master with slug `'grammar-master'`
- CTA text: `'开始使用'` (generic, not trial-specific)
- Used by landing page and product cards

### 14. **Products Landing Section**
**File:** `src/app/[locale]/(landing)/_sections/products.tsx`
**What it does:** Shows product cards on landing page
**System:** 🟡 NEUTRAL - Shows products, has separate trial system
**Details:**
- Shows Grammar Master card with link to `/products/grammar-master`
- Has its own trial system via `/api/me/products` (separate from anonymous trial)
- Shows "免费试用 7 天" button for logged-in users
- This is a DIFFERENT trial system (not anonymous, not Grammar Master specific)

### 15. **Simple Products Section**
**File:** `src/app/(landing)/_sections/products.tsx`
**What it does:** Simpler product cards (no trial buttons)
**System:** 🟡 NEUTRAL - Just links to product pages
**Details:**
- Shows Grammar Master card
- Button text: "开始使用" (generic)
- Links to `/products/grammar-master`
- No trial logic in this component

### 16. **Pricing Section**
**File:** `src/app/[locale]/(landing)/_sections/pricing.tsx`
**What it does:** Shows pricing cards with Paddle checkout
**System:** 🟡 NEUTRAL - Just payment/upgrade flow
**Details:**
- Shows Grammar Master pricing: ¥199/year
- Uses `PaddleCheckoutButton` for payment
- No trial logic, just upgrade path

### 17. **Grammar Redirect Page**
**File:** `src/app/grammar/page.tsx`
**What it does:** Redirects `/grammar` to `/products/grammar-master`
**System:** 🟡 NEUTRAL - Just a redirect
**Details:**
- Client-side redirect using `window.location.href`
- Fallback link if redirect fails

### 18. **Footer Link**
**File:** `src/app/_components/footer.tsx`
**What it does:** Footer navigation with Grammar Master link
**System:** 🟡 NEUTRAL - Just navigation
**Details:**
- Links to `/products/grammar-master`

### 19. **Webhook Handler**
**File:** `src/app/api/webhooks/paddle/route.ts`
**What it does:** Handles Paddle payment webhooks
**System:** 🟡 NEUTRAL - Payment processing
**Details:**
- Creates/updates `productGrant` records for Grammar Master
- Sets `type: "paid"` when payment successful
- Used by both old and new systems (productGrants table is shared)

### 20. **Subscription Verification**
**File:** `src/app/api/verify-subscription/route.ts`
**What it does:** Maps Paddle price IDs to product slugs
**System:** 🟡 NEUTRAL - Payment mapping
**Details:**
- Maps Grammar Master price IDs to `"grammar-master"` slug
- Used for payment verification

### 21. **Product Config**
**File:** `src/config/products.ts`
**What it does:** Trial configuration for NEW products (Thinker AI, FlowForge, etc.)
**System:** 🟡 NEUTRAL - Different trial system
**Details:**
- Does NOT include Grammar Master or Cast Master
- This is for the `/api/me/products` trial system (separate)
- Grammar Master uses anonymous trial system instead

### 22. **Translation Files**
**Files:** `messages/en.json`, `messages/zh.json`
**What they do:** i18n translations for Grammar Master
**System:** 🟡 NEUTRAL - Just text content
**Details:**
- Product names, taglines, pricing text
- No trial-specific logic

---

## 📊 SUMMARY TABLE

| Component | File | System | Status |
|-----------|------|--------|--------|
| Main Product Page | `src/app/products/grammar-master/page.tsx` | ✅ NEW | Active |
| Product Layout | `src/app/products/grammar-master/layout.tsx` | ✅ NEW | Active |
| Grammar Access API | `src/app/api/grammar/access/route.ts` | ✅ HYBRID | Active |
| Anonymous Trial Config | `src/config/anonymous-trial.ts` | ✅ NEW | Active |
| Anonymous Trial Guard | `src/components/anonymous-trial-guard.tsx` | ✅ NEW | Active |
| Anonymous Trial Hook | `src/hooks/use-anonymous-trial.ts` | ✅ NEW | Active |
| Anonymous Trial Logic | `src/lib/anonymous-trial.ts` | ✅ NEW | Active |
| Anonymous Trial APIs | `src/app/api/anonymous-trial/*` | ✅ NEW | Active |
| External Link Health | `src/config/external-links.ts` | ✅ NEW | Active |
| Trial Guard Component | `src/components/trial-guard.tsx` | ❌ OLD | Not used by GM |
| User Access Check | `src/lib/access.ts` | ❌ OLD | Not used by GM |
| Ensure Trial for App | `src/lib/access/ensureTrialForApp.ts` | ⚠️ HYBRID | Used for account trial |
| Product Definition | `src/lib/products.ts` | 🟡 NEUTRAL | Supporting |
| Landing Products | `src/app/[locale]/(landing)/_sections/products.tsx` | 🟡 NEUTRAL | Supporting |
| Simple Products | `src/app/(landing)/_sections/products.tsx` | 🟡 NEUTRAL | Supporting |
| Pricing Section | `src/app/[locale]/(landing)/_sections/pricing.tsx` | 🟡 NEUTRAL | Supporting |
| Grammar Redirect | `src/app/grammar/page.tsx` | 🟡 NEUTRAL | Supporting |
| Footer Link | `src/app/_components/footer.tsx` | 🟡 NEUTRAL | Supporting |
| Paddle Webhook | `src/app/api/webhooks/paddle/route.ts` | 🟡 NEUTRAL | Supporting |
| Verify Subscription | `src/app/api/verify-subscription/route.ts` | 🟡 NEUTRAL | Supporting |
| Product Config | `src/config/products.ts` | 🟡 NEUTRAL | Different system |
| Translations | `messages/*.json` | 🟡 NEUTRAL | Supporting |

---

## 🎯 KEY FINDINGS

### ✅ What's Working (NEW System)
1. Grammar Master product page uses `AnonymousTrialGuard` correctly
2. Anonymous 30-minute trial is fully implemented
3. Layout no longer forces immediate login
4. External link health checking prevents broken redirects
5. API route checks anonymous trial first, then account trial

### ⚠️ Hybrid Components
1. **`/api/grammar/access`** - Uses BOTH anonymous trial AND account trial
2. **`ensureTrialForApp.ts`** - Used for account-based trial (after anonymous expires)
   - Currently set to 10 minutes (TEST mode)
   - Should be changed to 3 days for production

### ❌ Old System (Not Used by Grammar Master)
1. **`TrialGuard` component** - Forces login, checks 7-day trial from registration
   - Still used by Cast Master
   - NOT used by Grammar Master anymore
2. **`checkUserAccess()` in `src/lib/access.ts`** - Checks `trialStartedAt` field
   - Still used by Cast Master
   - NOT used by Grammar Master anymore

### 🟡 Separate Trial System
1. **`/api/me/products` trial system** - Different from Grammar Master's anonymous trial
   - Used by landing page product cards
   - Shows "免费试用 7 天" button
   - Creates trial records in `productGrants` table
   - This is for NEW products (Thinker AI, FlowForge, etc.)
   - Grammar Master does NOT use this system

---

## 🔧 RECOMMENDATIONS

### Keep (NEW System)
- ✅ All anonymous trial components and APIs
- ✅ `AnonymousTrialGuard` usage in Grammar Master page
- ✅ External link health checking
- ✅ Current layout (no forced login)

### Update (HYBRID)
- ⚠️ Change `ensureTrialForApp.ts` trial duration from 10 minutes to 3 days
- ⚠️ Consider renaming to clarify it's for "account trial" not "anonymous trial"

### Remove or Deprecate (OLD System)
- ❌ `TrialGuard` component (if Cast Master also moves to new system)
- ❌ `checkUserAccess()` in `src/lib/access.ts` (if not used by other products)
- ❌ `user.trialStartedAt` field (if moving fully to productGrants-based trials)

### Clarify (NEUTRAL)
- 🟡 Document that `/api/me/products` is a DIFFERENT trial system
- 🟡 Consider consolidating trial systems in the future
