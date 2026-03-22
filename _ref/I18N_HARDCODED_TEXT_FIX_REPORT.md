# i18n Hardcoded Text Fix – ROOT CAUSE & SOLUTION

**Date**: March 21, 2026  
**Status**: ✅ FIXED

---

## Problem Summary

The homepage product cards section was displaying Chinese text on `/en` routes despite having correct English translations in `messages/en.json`. The issue was **NOT** a fallback problem, but rather **hardcoded Chinese text** in the component.

---

## Root Cause Analysis

### What Was Wrong

The `src/app/[locale]/(landing)/_sections/featured-products.tsx` component had **all product card text hardcoded directly in JSX** instead of using `useTranslations()`:

```typescript
// ❌ WRONG - Hardcoded Chinese text
<h2 className="text-3xl md:text-4xl font-bold mb-3 dark:text-white">
  把一个小产品，变成能赚钱的产品
</h2>
<p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
  从具体应用，到试用判断大脑，再到全球支付工具，一站打通"卖出去 + 收得到 + 控好权限"的闭环。
</p>
```

This meant:
- ❌ No i18n loading at all
- ❌ Always displays Chinese regardless of locale
- ❌ `messages/en.json` was never consulted
- ❌ No fallback issue – just ignored the i18n system entirely

### Why This Happened

The component was created with hardcoded text and never refactored to use `useTranslations()`. The i18n infrastructure (routing, request config, messages files) was all correct, but the component wasn't using it.

---

## Verification of i18n Infrastructure

✅ **`src/i18n/routing.ts`**: Correctly configured
```typescript
export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en'  // ✅ Correct default
});
```

✅ **`src/i18n/request.ts`**: Correctly loads locale-specific messages
```typescript
messages: (await import(`../../messages/${locale}.json`)).default,
```

✅ **`messages/en.json`**: Has all required keys
- `products.sectionHeadline`
- `products.sectionDescription`
- `products.enCards.*`
- `products.trialJudgment.*`
- `products.paddlePayment.*`

✅ **`messages/zh.json`**: Has all required keys (same structure as en.json)

---

## Solution Applied

### Changed: `src/app/[locale]/(landing)/_sections/featured-products.tsx`

**Before**: Hardcoded Chinese text
```typescript
export function FeaturedProductsSection() {
  return (
    <section>
      <h2>把一个小产品，变成能赚钱的产品</h2>
      <p>从具体应用，到试用判断大脑...</p>
      {/* More hardcoded Chinese text */}
    </section>
  );
}
```

**After**: Using `useTranslations()` to load locale-specific text
```typescript
import { useTranslations } from "next-intl";

export function FeaturedProductsSection() {
  const t = useTranslations("products");

  return (
    <section>
      <h2>{t("sectionHeadline")}</h2>
      <p>{t("sectionDescription")}</p>
      
      {/* Card 1: EN Cards */}
      <CardTitle>{t("enCards.name")}</CardTitle>
      <CardDescription>{t("enCards.tagline")}</CardDescription>
      <p>{t("enCards.description")}</p>
      <div>{t("enCards.status")}</div>
      <Button>{t("enCards.cta")}</Button>

      {/* Card 2: Trial Judgment Platform */}
      <CardTitle>{t("trialJudgment.name")}</CardTitle>
      <CardDescription>{t("trialJudgment.tagline")}</CardDescription>
      <p>{t("trialJudgment.description")}</p>
      <div>{t("trialJudgment.status")}</div>
      <Button>{t("trialJudgment.cta")}</Button>

      {/* Card 3: Paddle Payment Tool */}
      <CardTitle>{t("paddlePayment.name")}</CardTitle>
      <CardDescription>{t("paddlePayment.tagline")}</CardDescription>
      <p>{t("paddlePayment.description")}</p>
      <div>{t("paddlePayment.status")}</div>
      <Button>{t("paddlePayment.cta")}</Button>
    </section>
  );
}
```

---

## Expected Behavior After Fix

### `/en` Route
- ✅ Section headline: "Turn a small product into one that makes money"
- ✅ Section description: "From concrete apps to a trial decision engine..."
- ✅ Card 1: "EN Cards · English memory decks"
- ✅ Card 2: "Trial Decision Engine"
- ✅ Card 3: "Paddle Payment Toolkit"
- ✅ All text in English

### `/zh` Route
- ✅ Section headline: "把一个小产品，变成能赚钱的产品"
- ✅ Section description: "从具体应用，到试用判断大脑..."
- ✅ Card 1: "EN Cards · 英语记忆卡片"
- ✅ Card 2: "试用判断台"
- ✅ Card 3: "Paddle 支付工具"
- ✅ All text in Chinese

---

## Files Modified

| File | Change | Status |
|------|--------|--------|
| `src/app/[locale]/(landing)/_sections/featured-products.tsx` | Replaced hardcoded text with `useTranslations()` | ✅ Fixed |
| `messages/en.json` | Already correct (no changes needed) | ✅ Verified |
| `messages/zh.json` | Already correct (no changes needed) | ✅ Verified |
| `src/i18n/routing.ts` | Already correct (no changes needed) | ✅ Verified |
| `src/i18n/request.ts` | Already correct (no changes needed) | ✅ Verified |

---

## Verification

✅ Component compiles without TypeScript errors  
✅ All `useTranslations()` calls use correct namespace: `"products"`  
✅ All keys match exactly between `messages/en.json` and `messages/zh.json`  
✅ i18n infrastructure verified as correct  
✅ No hardcoded text remains in component  

---

## Testing Instructions

1. **Clear browser cache** (or use incognito mode)
2. **Restart dev server**: `pnpm dev` or `npm run dev`
3. **Visit `/en`**: Should see English product cards
4. **Visit `/zh`**: Should see Chinese product cards
5. **Verify each card**:
   - Card 1 (EN Cards): Check title, tagline, description
   - Card 2 (Trial Decision Engine): Check title, tagline, description
   - Card 3 (Paddle Payment Toolkit): Check title, tagline, description

---

## Key Lessons

1. **Always use i18n hooks**: Never hardcode text that should be translatable
2. **Verify component implementation**: Even if i18n infrastructure is correct, components must use it
3. **Check for hardcoded strings**: Search for Chinese/English text directly in JSX
4. **Use consistent namespaces**: All product-related text should use `useTranslations("products")`

---

## Summary

The issue was **not** a fallback problem or i18n configuration issue. The component simply wasn't using the i18n system at all. By refactoring it to use `useTranslations()`, the component now correctly loads locale-specific text from `messages/en.json` and `messages/zh.json`.

**Result**: `/en` now displays English text, `/zh` displays Chinese text, as expected.
