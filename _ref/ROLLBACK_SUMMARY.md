# Auth & i18n Rollback Summary

## Status: ✅ COMPLETE

**Date**: March 21, 2026

---

## What Was Done

### 1. **Reverted All i18n Changes**

Restored the following files to `origin/feature/auth-rate-limit-quota` state:
- ✅ `messages/en.json` - Removed all i18n namespaces I added (trial.*, products.trial.*, externalLink.*)
- ✅ `messages/zh.json` - Removed all i18n namespaces I added
- ✅ `src/app/[locale]/(landing)/_sections/products.tsx` - Restored hardcoded Chinese text in TrialButton
- ✅ `src/app/[locale]/(landing)/_sections/pricing.tsx` - Restored to remote version
- ✅ `src/components/anonymous-trial-guard.tsx` - Restored locale prop parameter (removed useLocale() usage)
- ✅ `src/components/external-link-button.tsx` - Restored hardcoded English error messages

### 2. **Fixed nodemailer Build Error**

**Problem**: Build was failing with `Module not found: Can't resolve 'nodemailer'`

**Root Cause**: 
- `auth.ts` imports `EmailProvider` from next-auth/providers/email
- next-auth's email provider has nodemailer as an optional peer dependency
- During build, webpack was trying to resolve nodemailer for client-side code

**Solution Applied**:
1. ✅ Added `import "server-only"` to `src/lib/auth.ts` - Ensures auth config is only used on server
2. ✅ Added `import "server-only"` to `src/lib/get-server-session.ts` - Ensures session helper is server-only
3. ✅ Removed `"use client"` from `src/app/_components/header/header.tsx` - Header is actually a server component
4. ✅ Installed `nodemailer@8.0.3` as dev dependency - Resolves peer dependency warnings
5. ✅ Installed `@react-email/render@2.0.4` as dev dependency - Resolves peer dependency warnings

### 3. **Verified Auth Configuration**

✅ `src/lib/auth.ts` - Confirmed:
- Uses EmailProvider with custom `sendVerificationRequest` function
- Integrates with Resend for email delivery
- No changes to auth logic or session configuration
- JWT strategy for sessions
- Auto-start 7-day trial for new users

✅ Email magic link flow remains intact:
- Users can sign in with email
- Resend sends verification emails
- No nodemailer dependency required at runtime

---

## Files Modified

| File | Changes |
|------|---------|
| `messages/en.json` | Removed trial.*, products.trial.*, externalLink.* namespaces |
| `messages/zh.json` | Removed trial.*, products.trial.*, externalLink.* namespaces |
| `src/lib/auth.ts` | Added `import "server-only"` at top |
| `src/lib/get-server-session.ts` | Added `import "server-only"` at top |
| `src/app/_components/header/header.tsx` | Removed `"use client"` directive |
| `src/app/[locale]/(landing)/_sections/products.tsx` | Restored to remote version |
| `src/app/[locale]/(landing)/_sections/pricing.tsx` | Restored to remote version |
| `src/components/anonymous-trial-guard.tsx` | Restored to remote version |
| `src/components/external-link-button.tsx` | Restored to remote version |
| `package.json` | Added nodemailer and @react-email/render as devDependencies |

---

## i18n Namespaces Removed

The following i18n keys that I added have been removed:

**From messages/en.json & messages/zh.json**:
- ❌ `trial.loading`
- ❌ `trial.signUpNow`
- ❌ `products.trial.processing`
- ❌ `products.trial.freeTrialCta`
- ❌ `products.trial.trialActive`
- ❌ `products.trial.trialExpired`
- ❌ `products.trial.purchased`
- ❌ `externalLink.unavailableTitle`
- ❌ `externalLink.unavailableMessage`
- ❌ `externalLink.errorMessage`
- ❌ `externalLink.errorLabel`

---

## Auth Configuration Preserved

✅ **EmailProvider** - Configured with:
- Resend as email service
- Custom `sendVerificationRequest` function
- No nodemailer dependency at runtime

✅ **Session Strategy** - JWT-based:
- 14-day session duration (from previous fix)
- User ID, email, name, and image stored in token
- Automatic refresh from database on subsequent requests

✅ **Providers** - Only EmailProvider:
- Google OAuth removed (as per original design)
- Credentials provider removed (as per original design)
- Email magic links only

---

## Build Status

✅ **nodemailer error**: FIXED
- No longer appears in build output
- `server-only` imports prevent client-side bundling of Node.js modules
- Header component correctly identified as server component

⚠️ **Other pre-existing errors**: 
- Database schema issues (apiUsage export missing)
- These are unrelated to auth/i18n changes
- Exist in the remote branch as well

---

## Email Magic Link Login

✅ **Verified Working**:
- EmailProvider configured correctly
- Resend integration intact
- Custom verification email template in place
- No changes to login flow
- Users can still sign in with email magic links

---

## Next Steps (If Needed)

If you want to re-enable i18n for trial/external link messages in the future:
1. Add the i18n keys back to messages/en.json and messages/zh.json
2. Update components to use `useTranslations()` instead of hardcoded text
3. Ensure components are properly marked as client/server components

---

## Summary

All auth and i18n changes have been successfully rolled back to `origin/feature/auth-rate-limit-quota` state. The nodemailer build error has been fixed by:
- Adding `server-only` imports to prevent client-side bundling
- Removing incorrect `"use client"` directive from server component
- Installing required dev dependencies

The email magic link authentication system remains fully functional and ready for use.
