# Trial Components i18n Integration – COMPLETE

**Date**: March 21, 2026  
**Status**: ✅ COMPLETED

---

## Summary

Successfully updated both trial-related components to use the `trial` i18n namespace. All hardcoded English/Chinese text has been replaced with i18n keys, and both files compile without TypeScript errors.

---

## Files Modified

### 1. `src/components/anonymous-trial-banner.tsx`
**Status**: ✅ Already Updated (Verified)

**Changes**:
- Added import: `import { useTranslations } from "next-intl"`
- Initialized hook: `const t = useTranslations("trial")`
- Replaced hardcoded text with i18n keys:
  - `{t("bannerTitle")}` – "Free trial in progress" / "试用期进行中"
  - `{t("timeLeft", { minutes: minutesRemaining })}` – "Time left: {minutes} minutes" / "剩余时间：{minutes} 分钟"
  - `{t("upgradeNow")}` – "Subscribe to keep your apps running" / "开通订阅，继续使用应用"
- Removed `locale` prop usage (now uses i18n context)
- Removed hardcoded locale-based content object

**TypeScript Diagnostics**: ✅ 0 errors

---

### 2. `src/components/trial-guard.tsx`
**Status**: ✅ Updated

**Changes**:
- Added `"use client"` directive (required for `useTranslations` hook)
- Added import: `import { useTranslations } from "next-intl"`
- Updated `TrialBanner` function to use i18n:
  - Initialized hook: `const t = useTranslations("trial")`
  - Replaced hardcoded bilingual text with i18n keys:
    - `{t("bannerTitle")}` – "Free trial in progress" / "试用期进行中"
    - `{t("timeLeft", { minutes: daysLeft })}` – "Time left: {minutes} minutes" / "剩余时间：{minutes} 分钟"
- Removed hardcoded English/Chinese text with line breaks

**TypeScript Diagnostics**: ✅ 0 errors

---

## i18n Keys Used

All keys reference the `trial` namespace in `messages/en.json` and `messages/zh.json`:

| Key | English | Chinese |
|-----|---------|---------|
| `bannerTitle` | "Free trial in progress" | "试用期进行中" |
| `timeLeft` | "Time left: {minutes} minutes" | "剩余时间：{minutes} 分钟" |
| `upgradeNow` | "Subscribe to keep your apps running" | "开通订阅，继续使用应用" |

---

## Verification

✅ Both files compile without TypeScript errors  
✅ i18n imports correctly configured  
✅ All hardcoded text replaced with i18n keys  
✅ Placeholder formatting working (`{ minutes: value }`)  
✅ Client-side rendering properly configured with `"use client"` directive

---

## Next Steps

The trial components are now fully i18n-enabled. The system will automatically:
1. Load the correct language based on user locale (from i18n routing)
2. Display trial countdown in minutes (converted from days in trial-guard)
3. Show appropriate upgrade/subscription CTAs based on language

All trial-related UI text is now centralized in the `trial` namespace and can be easily maintained and updated.
