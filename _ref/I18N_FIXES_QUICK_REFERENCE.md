# i18n Hardcoded Text Fixes - Quick Reference

## What Was Fixed

### 1. **products.tsx - TrialButton Component**
- ❌ Before: `"开始中..."`, `"免费试用 7 天"`, `"试用中 · 到期：..."`, `"试用已结束"`, `"✓ 已购买"`
- ✅ After: Uses `useTranslations("products.trial")` with keys: `processing`, `freeTrialCta`, `trialActive`, `trialExpired`, `purchased`

### 2. **external-link-button.tsx**
- ❌ Before: Hardcoded English error messages
- ✅ After: Uses `useTranslations("externalLink")` with keys: `unavailableTitle`, `unavailableMessage`, `errorMessage`, `errorLabel`

### 3. **anonymous-trial-guard.tsx**
- ❌ Before: Hardcoded text + `locale` prop parameter
- ✅ After: Uses `useLocale()` + `useTranslations("trial")` with keys: `loading`, `expiredTitle`, `signUpNow`

---

## i18n Keys Added

### messages/en.json
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

### messages/zh.json
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

---

## Component Changes

### TrialButton (products.tsx)
```tsx
// Before
{starting ? "开始中..." : "免费试用 7 天"}

// After
const t = useTranslations("products.trial");
{starting ? t("processing") : t("freeTrialCta")}
```

### ExternalLinkButton
```tsx
// Before
alert("The partner's trial page is currently unavailable...")

// After
const t = useTranslations("externalLink");
alert(t("errorMessage"))
```

### AnonymousTrialGuard
```tsx
// Before
interface Props {
  locale?: "en" | "zh";
}
{locale === "zh" ? "加载中..." : "Loading..."}

// After
const locale = useLocale();
const t = useTranslations("trial");
{t("loading")}
```

---

## Testing

All changes verified:
- ✅ TypeScript diagnostics: 0 errors
- ✅ All hardcoded text removed
- ✅ Proper locale handling with useLocale()
- ✅ i18n keys properly organized in namespaces
- ✅ Date formatting respects locale

---

## Files Changed

1. `messages/en.json` - Added 3 namespaces
2. `messages/zh.json` - Added 3 namespaces
3. `src/app/[locale]/(landing)/_sections/products.tsx` - Refactored TrialButton
4. `src/components/external-link-button.tsx` - Added i18n support
5. `src/components/anonymous-trial-guard.tsx` - Refactored to use useLocale() + i18n
