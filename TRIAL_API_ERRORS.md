# Trial API Errors - Diagnosis and Fix

## Likely Root Causes (Without Server Logs)

Based on code analysis, here are the most probable causes of the 500 errors:

### 1. `/api/external-links/health` - GET 500
**Probable Cause:** Prisma database not initialized or `ExternalLinkHealth` table empty
**Error Location:** `src/lib/external-link-health.ts` line ~120 in `getAllLinkHealth()`
**Why:** `prisma.externalLinkHealth.findMany()` fails if:
- Database not migrated
- Prisma client not generated
- Database connection string missing

### 2. `/api/anonymous-trial/start` - POST 500
**Probable Cause:** `cookies()` function from Next.js failing or JWT signing error
**Error Location:** `src/lib/anonymous-trial.ts` line ~90 in `setAnonymousTrialState()`
**Why:** 
- `cookies()` might need to be called differently in API routes
- `NEXTAUTH_SECRET` env var might be missing for JWT signing
- Cookie options might be incompatible with current Next.js version

### 3. `/api/grammar/access` - GET 500 (but you said POST?)
**Probable Cause:** Same as #2 - cookie/JWT issues when trying to auto-start trial
**Error Location:** `src/lib/anonymous-trial.ts` when calling `startAnonymousTrial()`
**Why:** When anonymous user clicks button, API tries to start trial → calls `setAnonymousTrialState()` → fails

## Most Likely Issue: `cookies()` API Usage

In Next.js 15, the `cookies()` function from `next/headers` can only be used in:
- Server Components
- Server Actions
- Route Handlers

BUT it must be called at the TOP LEVEL of the function, not inside try-catch or async callbacks.

## The Fix

The issue is that we're trying to set cookies in API routes, but the `cookies()` API might not work as expected. We need to use `NextResponse` to set cookies instead.
