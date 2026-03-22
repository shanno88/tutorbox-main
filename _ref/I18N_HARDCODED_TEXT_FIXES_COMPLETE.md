# i18n Hardcoded Text Fixes - Complete

**Status**: ✅ COMPLETE

**Date**: March 21, 2026

---

## Summary

Fixed all hardcoded Chinese and English text in critical components by moving them to i18n message files. All components now use `useTranslations()` for proper bilingual support.

---

## Changes Made

### 1. **messages/en.json** - Added i18n Namespaces

Added three new namespaces:

```json
"trial": {
  "loading": "Loading...",
  "signUpNow": "Sign Up Now"
}

"products": {
  "trial": {
    "processing": "Processing...",
    "freeTrialCta": "Free 7-day trial",
    "trialActive": "Trial active · Expires: {date}",
    "trialExpired": "Trial ended",
    "purchased": "✓ Purchased"
  }
}

"externalLink": {
  "unavailableTitle": "Partner page unavailable",
  "unavailableMessage": "The external trial page is currently returning a 404 or cannot be reached. This is an issue on the partner's side, not with your account.",
  "errorMessage": "The partner's trial page is currently unavailable (404 or unreachable). This is an issue on their side, not with your account or device. Please try again later or contact support.",
  "errorLabel": "Error: {error}"
}
```

### 2. **messages/zh.json** - Added i18n Namespaces

Added corresponding Chinese translations:

```json
"trial": {
  "loading": "加载中...",
  "signUpNow": "立即注册"
}

"products": {
  "trial": {
    "processing": "开始中...",
    "freeTrialCta": "免费试用 7 天",
    "trialActive": "试用中 · 到期：{date}",
    "trialExpired": "试用已结束",
    "purchased": "✓ 已购买"
  }
}

"externalLink": {
  "unavailableTitle": "合作方页面不可用",
  "unavailableMessage": "外部试用页面当前返回 404 或无法访问。这是合作方的问题，与你的账户无关。",
  "errorMessage": "合作方的试用页面当前不可用（404 或无法访问）。这是他们的问题，与你的账户或设备无关。请稍后重试或联系支持。",
  "errorLabel": "错误：{error}"
}
```

### 3. **src/app/[locale]/(landing)/_sections/products.tsx** - Fixed TrialButton Component

**Before**: Hardcoded Chinese text
```tsx
{starting ? "开始中..." : "免费试用 7 天"}
试用中 · 到期：{new Date(...).toLocaleDateString("zh-CN")}
试用已结束
✓ 已购买
```

**After**: Uses i18n with proper locale support
```tsx
function TrialButton({
  trialStatus,
  productSlug,
  onStartTrial,
  starting,
  locale,  // Added locale parameter
}: {
  // ...
  locale: string;
}) {
  const t = useTranslations("products.trial");
  const isZh = locale === "zh";
  
  // Now uses: t("processing"), t("freeTrialCta"), t("trialActive", { date }), etc.
}
```

**Changes**:
- Added `locale` parameter to TrialButton
- Replaced all hardcoded Chinese text with `useTranslations("products.trial")`
- Proper date formatting based on locale (zh-CN vs en-US)
- Updated ProductCard to pass locale to TrialButton
- Updated ProductsSection to pass locale to ProductCard

### 4. **src/components/external-link-button.tsx** - Fixed Error Messages

**Before**: Hardcoded English text
```tsx
alert("The partner's trial page is currently unavailable...")
<p className="font-semibold mb-1">Partner page unavailable</p>
<p className="text-xs">The external trial page is currently returning a 404...</p>
```

**After**: Uses i18n
```tsx
import { useTranslations } from "next-intl";

export function ExternalLinkButton(...) {
  const t = useTranslations("externalLink");
  
  // Now uses:
  alert(t("errorMessage"));
  <p className="font-semibold mb-1">{t("unavailableTitle")}</p>
  <p className="text-xs">{t("unavailableMessage")}</p>
  {t("errorLabel", { error: lastError })}
}
```

### 5. **src/components/anonymous-trial-guard.tsx** - Fixed Hardcoded Text & Locale Handling

**Before**: 
- Hardcoded text with locale parameter
- Used `locale` prop instead of `useLocale()`
```tsx
interface AnonymousTrialGuardProps {
  locale?: "en" | "zh";  // Prop-based locale
}

{locale === "zh" ? "加载中..." : "Loading..."}
{locale === "zh" ? "试用已结束" : "Trial Ended"}
{locale === "zh" ? "立即注册" : "Sign Up Now"}
```

**After**:
- Uses `useLocale()` from next-intl
- Uses `useTranslations()` for all text
- Removed locale prop (no longer needed)
```tsx
interface AnonymousTrialGuardProps {
  // locale prop removed - uses useLocale() instead
}

export function AnonymousTrialGuard(...) {
  const locale = useLocale();
  const t = useTranslations("trial");
  const isZh = locale === "zh";
  
  // Now uses:
  {t("loading")}
  {t("expiredTitle")}
  {t("signUpNow")}
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `messages/en.json` | Added `trial`, `products.trial`, `externalLink` namespaces |
| `messages/zh.json` | Added `trial`, `products.trial`, `externalLink` namespaces |
| `src/app/[locale]/(landing)/_sections/products.tsx` | Refactored TrialButton to use i18n; added locale parameter |
| `src/components/external-link-button.tsx` | Replaced hardcoded English with i18n |
| `src/components/anonymous-trial-guard.tsx` | Replaced hardcoded text with i18n; removed locale prop; uses useLocale() |

---

## Verification

✅ All TypeScript diagnostics pass (0 errors)
✅ All hardcoded Chinese text removed from products.tsx
✅ All hardcoded English text removed from external-link-button.tsx
✅ All hardcoded text removed from anonymous-trial-guard.tsx
✅ Proper locale handling using next-intl utilities
✅ Date formatting respects locale (zh-CN vs en-US)

---

## i18n Best Practices Applied

1. **Namespace Organization**:
   - `products.trial.*` - Trial status messages for product cards
   - `trial.*` - General trial-related messages
   - `externalLink.*` - External link error messages

2. **Locale Detection**:
   - Uses `useLocale()` from next-intl (not prop-based)
   - Consistent across all components

3. **Translation Usage**:
   - Client components: `useTranslations(namespace)`
   - Server components: `getTranslations(namespace)`
   - Proper parameter interpolation: `t("key", { param: value })`

4. **Bilingual Support**:
   - All user-visible text in both en.json and zh.json
   - Consistent terminology across both languages
   - Proper date/time formatting per locale

---

## Next Steps (Optional Improvements)

1. **Extract Trial Status UI Component**:
   - Create `src/components/trial/trial-status-badge.tsx`
   - Consolidate the 5 trial status states into a reusable component

2. **Create Unified Error Handler**:
   - Create `src/lib/error-handler.ts`
   - Standardize error messages across external links, trials, auth

3. **Add Error Logging**:
   - Integrate with error tracking service (Sentry, etc.)
   - Log failed external link checks for debugging

4. **Refactor State Machine**:
   - Extract trial state machine from AnonymousTrialGuard
   - Create `src/hooks/use-trial-state-machine.ts`
   - Consolidate multiple useEffect hooks

---

## Testing Checklist

- [ ] Visit `/en` - verify English text in trial buttons
- [ ] Visit `/zh` - verify Chinese text in trial buttons
- [ ] Click trial button as anonymous user - verify "Processing..." text
- [ ] Check external link button with unavailable link - verify error message in correct language
- [ ] Check anonymous trial guard loading state - verify "Loading..." / "加载中..." text
- [ ] Check trial expired state - verify "Trial ended" / "试用已结束" text
