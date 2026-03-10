# Grammar Master CTA Cleanup Summary

## Task
Remove all old trial copy ("立即开始 7 天免费试用") and replace with new system references.

## Files Modified

### 1. `src/lib/products.ts`
**Changes:**
- Changed Grammar Master CTA from `'立即开始 7 天免费试用'` to `'开始使用'`
- Changed Cast Master CTA from `'立即开始 7 天免费试用'` to `'开始使用'`
- Updated CTA type definition to remove old text and add `'开始使用'`

**Old:**
```typescript
cta: '立即开始 7 天免费试用',
```

**New:**
```typescript
cta: '开始使用',
```

---

### 2. `src/app/[locale]/(landing)/_sections/products.tsx`
**Changes:**
- Removed the red notice text: "注册后可立即开始 7 天免费试用，试用期内不限次数使用语法大师全部功能。"
- Updated button logic to handle new `'开始使用'` CTA instead of checking for old trial text
- Applied to both Cast Master button and regular product buttons

**Old:**
```tsx
{isZh && product.slug === "grammar-master" ? (
  <p className="mt-2 text-xs text-red-500">
    注册后可立即开始 7 天免费试用，试用期内不限次数使用语法大师全部功能。
  </p>
) : null}
```

**New:**
```tsx
// Removed completely
```

**Old button logic:**
```tsx
{product.cta
  ? product.cta === "立即开始 7 天免费试用"
    ? product.cta
    : t(...)
```

**New button logic:**
```tsx
{product.cta
  ? t(
      product.cta === "申请接入"
        ? "cta.applyIntegration"
        : product.cta === "加入内测"
          ? "cta.joinBeta"
          : product.cta === "了解更多"
            ? "cta.learnMore"
            : product.cta === "开始使用"
              ? "cta.tryNow"
              : "cta.tryNow"
    )
```

---

### 3. `src/app/products/[slug]/page.tsx`
**Changes:**
- Updated Grammar Master status text from "可立即开始 7 天免费试用" to "新版试用系统：匿名 30 分钟 + 注册后 3 天"
- Updated CTA text from "立即开始 7 天免费试用" to "开始使用语法大师"

**Old:**
```typescript
'grammar-master': {
  name: 'Grammar Master · 语法大师',
  description: '英文写作助手，告别 Chinglish',
  status: '可立即开始 7 天免费试用',
  cta: '立即开始 7 天免费试用',
  url: '/products/grammar-master',
},
```

**New:**
```typescript
'grammar-master': {
  name: 'Grammar Master · 语法大师',
  description: '英文写作助手，告别 Chinglish',
  status: '新版试用系统：匿名 30 分钟 + 注册后 3 天',
  cta: '开始使用语法大师',
  url: '/products/grammar-master',
},
```

---

### 4. `src/app/(landing)/_sections/products.tsx`
**Changes:**
- Updated Cast Master ExternalLinkButton text from "立即开始 7 天免费试用" to "开始使用"

**Old:**
```tsx
<ExternalLinkButton
  linkId="cast_master_trial"
  url="https://tl.tutorbox.cc/"
  variant="outline"
  className="w-full group"
>
  立即开始 7 天免费试用
  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
</ExternalLinkButton>
```

**New:**
```tsx
<ExternalLinkButton
  linkId="cast_master_trial"
  url="https://tl.tutorbox.cc/"
  variant="outline"
  className="w-full group"
>
  开始使用
  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
</ExternalLinkButton>
```

---

### 5. `src/app/products/grammar-master/page.tsx`
**Changes:**
- Updated trial expired notice from "你的 7 天免费试用已经用完" to "你的试用已经用完"

**Old:**
```tsx
<p className="text-sm text-gray-700 mb-3">
  你的 7 天免费试用已经用完。升级为语法大师 Pro 版后，你可以继续无限次使用语法大师的所有功能。
</p>
```

**New:**
```tsx
<p className="text-sm text-gray-700 mb-3">
  你的试用已经用完。升级为语法大师 Pro 版后，你可以继续无限次使用语法大师的所有功能。
</p>
```

---

### 6. `src/app/products/_components/cast-master-landing.tsx`
**Changes:**
- Updated badge text from "已上线 · 7 天免费试用" to "已上线 · 新版试用系统"

**Old:**
```tsx
<div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
  已上线 · 7 天免费试用
</div>
```

**New:**
```tsx
<div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
  已上线 · 新版试用系统
</div>
```

---

## Verification

Searched entire codebase (excluding .md files) for:
- `7 天免费试用`
- `7天免费试用`
- `立即开始 7 天`

**Result:** ✅ No matches found

---

## Summary

All old trial copy has been removed from the codebase. The new system uses:
- Generic CTA text: "开始使用" (Start Using)
- Status descriptions reference the new trial system
- No more hardcoded "7 天免费试用" text anywhere in the code
- Grammar Master page already has the correct implementation with "开始使用语法大师（新试用系统）" button

The actual trial logic is handled by:
- `AnonymousTrialGuard` component (30-minute anonymous trial)
- Backend API routes that check account-based trials
- No UI text needs to mention specific trial durations anymore
