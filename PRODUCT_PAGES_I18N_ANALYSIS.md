# Product Pages i18n Analysis – Grammar Master, Cast Master, Lease AI

**Date**: March 21, 2026  
**Analysis**: Text content handling and i18n implementation in three product pages

---

## Summary

All three product pages use **hardcoded bilingual text** (English + Chinese mixed directly in JSX) rather than using `useTranslations()` from the i18n system. They do NOT read from `messages/en.json` or `messages/zh.json`.

---

## 1️⃣ Grammar Master (`src/app/[locale]/grammar-master/page.tsx`)

### Text Content Approach
**❌ NOT using i18n** – All text is hardcoded directly in JSX

### Key Findings

| Element | Implementation | Text |
|---------|-----------------|------|
| Page Title | Hardcoded | `"Grammar Master · 语法大师"` |
| Subtitle (EN) | Hardcoded | `"English writing assistant for non-native speakers"` |
| Subtitle (ZH) | Hardcoded | `"告别 Chinglish，写出地道英文"` |
| Card Title | Hardcoded | `"开始使用语法大师"` |
| Card Subtitle | Hardcoded | `"7 天免费试用，无需信用卡"` |
| Trial Button | Hardcoded | `"开始 7 天免费试用"` |
| Buy Button | Hardcoded | `"立即购买 Pro 版"` |
| Error Messages | Hardcoded | `"You have already used your trial. Please purchase to continue."` |
| Pricing Section | Hardcoded | `"Pricing"` / `"$49 USD / 年"` / `"或 199 元人民币，买断一年，无自动续费"` |

### Code Pattern
```typescript
// NO useTranslations() hook
// NO reading from messages/en.json or messages/zh.json
// NO locale-based conditional rendering

// Direct hardcoded text:
<h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
  Grammar Master · 语法大师
</h1>
<p className="text-lg sm:text-xl text-muted-foreground mb-2">
  English writing assistant for non-native speakers
</p>
<p className="text-base text-muted-foreground">
  告别 Chinglish，写出地道英文
</p>
```

### Issues
- ❌ Text is hardcoded, not translatable
- ❌ No i18n integration
- ❌ Bilingual text mixed in single strings
- ❌ Cannot easily update translations without code changes

---

## 2️⃣ Cast Master (`src/app/[locale]/cast-master/page.tsx`)

### Text Content Approach
**❌ NOT using i18n** – All text is hardcoded directly in JSX

### Key Findings

| Element | Implementation | Text |
|---------|-----------------|------|
| Page Title | Hardcoded | `"Cast Master · 播感大师"` |
| Subtitle (EN) | Hardcoded | `"AI assistant for short-form video creators"` |
| Subtitle (ZH) | Hardcoded | `"短视频创作者的 AI 助手"` |
| Card Title | Hardcoded | `"开始使用播感大师"` |
| Card Subtitle | Hardcoded | `"Start your free trial today"` |
| Trial Button | Hardcoded | `"开始免费试用"` |
| Buy Button | Hardcoded | `"立即购买"` |
| Pricing Section | Hardcoded | `"Pricing"` / `"$49 USD / 年"` / `"或 199 元人民币，买断一年，无自动续费"` |

### Code Pattern
```typescript
// NO useTranslations() hook
// NO reading from messages/en.json or messages/zh.json
// NO locale-based conditional rendering

// Direct hardcoded text:
<h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
  Cast Master · 播感大师
</h1>
<p className="text-lg sm:text-xl text-muted-foreground mb-2">
  AI assistant for short-form video creators
</p>
<p className="text-base text-muted-foreground">
  短视频创作者的 AI 助手
</p>
```

### Issues
- ❌ Text is hardcoded, not translatable
- ❌ No i18n integration
- ❌ Bilingual text mixed in single strings
- ❌ Cannot easily update translations without code changes

---

## 3️⃣ Lease AI (`src/app/[locale]/lease-ai/page.tsx`)

### Text Content Approach
**⚠️ PARTIALLY using i18n** – Uses `locale` variable for conditional rendering, but NOT using `useTranslations()`

### Key Findings

| Element | Implementation | Pattern |
|---------|-----------------|---------|
| Locale Detection | ✅ Using `useLocale()` | `const isZh = locale === "zh"` |
| Conditional Rendering | ✅ Using `isZh` variable | `{isZh ? "中文" : "English"}` |
| Error Messages | ✅ Locale-aware | `setError(isZh ? "你已经使用过试用..." : "You have already used...")` |
| Feature Descriptions | ✅ Locale-aware | `{isZh ? "30 秒极速分析" : "30-Second Analysis"}` |
| Pricing Text | ✅ Locale-aware | `{isZh ? "价格" : "Pricing"}` |

### Code Pattern
```typescript
// ✅ Using locale detection
const isZh = locale === "zh";

// ✅ Conditional rendering based on locale
<h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
  Lease AI Review
</h1>
<p className="text-lg sm:text-xl text-muted-foreground mb-1">
  {isZh ? "美国租房合同智能审核" : "Smart US Lease Contract Review"}
</p>

// ✅ Ternary operator for bilingual content
<h4 className="font-semibold mb-1">
  {isZh ? "30 秒极速分析" : "30-Second Analysis"}
</h4>
<p className="text-sm text-muted-foreground">
  {isZh ? "AI 快速扫描全部条款，识别潜在风险" : "AI scans all clauses and flags risks instantly"}
</p>
```

### Issues
- ⚠️ NOT using `useTranslations()` from next-intl
- ⚠️ NOT reading from `messages/en.json` or `messages/zh.json`
- ⚠️ Text is still hardcoded in JSX, just with conditional rendering
- ⚠️ Cannot easily add more languages (would need to add more ternary conditions)
- ⚠️ Maintenance burden: text scattered throughout component

### Advantages over Grammar Master & Cast Master
- ✅ At least supports locale-aware rendering
- ✅ Easier to add more languages (just add more conditions)
- ✅ Better than hardcoded bilingual strings

---

## Comparison Table

| Feature | Grammar Master | Cast Master | Lease AI |
|---------|-----------------|-------------|----------|
| Uses `useTranslations()` | ❌ No | ❌ No | ❌ No |
| Reads from `messages/en.json` | ❌ No | ❌ No | ❌ No |
| Uses `useLocale()` | ❌ No | ❌ No | ✅ Yes |
| Locale-aware rendering | ❌ No | ❌ No | ✅ Yes (ternary) |
| Hardcoded text | ✅ Yes | ✅ Yes | ✅ Yes |
| Bilingual strings mixed | ✅ Yes | ✅ Yes | ⚠️ Partially (ternary) |
| i18n Compliant | ❌ No | ❌ No | ⚠️ Partial |

---

## Recommendations

### For Grammar Master & Cast Master
These pages should be refactored to use the i18n system:

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function GrammarMasterPage() {
  const t = useTranslations("products.grammarMaster");
  
  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("subtitle.en")}</p>
      <p>{t("subtitle.zh")}</p>
      <h3>{t("card.title")}</h3>
      <p>{t("card.subtitle")}</p>
      <button>{t("buttons.trial")}</button>
      <button>{t("buttons.buy")}</button>
    </div>
  );
}
```

### For Lease AI
Should be refactored to use `useTranslations()` instead of ternary operators:

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function LeaseAIPage() {
  const t = useTranslations("products.leaseAi");
  
  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
      <h4>{t("features.analysis.title")}</h4>
      <p>{t("features.analysis.description")}</p>
      {/* ... */}
    </div>
  );
}
```

### New i18n Namespace Structure
Add to `messages/en.json` and `messages/zh.json`:

```json
{
  "products": {
    "grammarMaster": {
      "title": "Grammar Master",
      "subtitle": {
        "en": "English writing assistant for non-native speakers",
        "zh": "告别 Chinglish，写出地道英文"
      },
      "card": {
        "title": "开始使用语法大师",
        "subtitle": "7 天免费试用，无需信用卡"
      },
      "buttons": {
        "trial": "开始 7 天免费试用",
        "buy": "立即购买 Pro 版"
      },
      "pricing": {
        "title": "Pricing",
        "price": "$49 USD / 年",
        "description": "或 199 元人民币，买断一年，无自动续费"
      }
    },
    "castMaster": {
      "title": "Cast Master",
      "subtitle": {
        "en": "AI assistant for short-form video creators",
        "zh": "短视频创作者的 AI 助手"
      },
      "card": {
        "title": "开始使用播感大师",
        "subtitle": "Start your free trial today"
      },
      "buttons": {
        "trial": "开始免费试用",
        "buy": "立即购买"
      },
      "pricing": {
        "title": "Pricing",
        "price": "$49 USD / 年",
        "description": "或 199 元人民币，买断一年，无自动续费"
      }
    },
    "leaseAi": {
      "title": "Lease AI Review",
      "subtitle": "Smart US Lease Contract Review",
      "subtitleZh": "美国租房合同智能审核",
      "description": "Understand lease traps in 30 seconds",
      "descriptionZh": "30 秒读懂合同陷阱，保护你的租房权益",
      "features": {
        "analysis": {
          "title": "30-Second Analysis",
          "titleZh": "30 秒极速分析",
          "description": "AI scans all clauses and flags risks instantly",
          "descriptionZh": "AI 快速扫描全部条款，识别潜在风险"
        },
        "detection": {
          "title": "Trap Detection",
          "titleZh": "陷阱条款识别",
          "description": "Spot hidden fees, unfair clauses & penalties",
          "descriptionZh": "识别隐藏费用、不公平条款和违约风险"
        },
        "support": {
          "title": "Bilingual Support",
          "titleZh": "中英双语解释",
          "description": "Understand English leases in plain Chinese",
          "descriptionZh": "用中文读懂英文合同，无需法律背景"
        }
      },
      "pricing": {
        "title": "Pricing",
        "titleZh": "价格",
        "price": "$9.9 USD",
        "description": "Unlimited lease contract reviews · one-time payment",
        "descriptionZh": "无限次合同审核，一次付清，无自动续费"
      }
    }
  }
}
```

---

## Conclusion

**Current State**:
- ❌ Grammar Master: Fully hardcoded, no i18n
- ❌ Cast Master: Fully hardcoded, no i18n
- ⚠️ Lease AI: Partially locale-aware, but not using i18n system

**Recommendation**: Refactor all three pages to use `useTranslations()` from next-intl for consistency with the rest of the application and to enable proper i18n management.
