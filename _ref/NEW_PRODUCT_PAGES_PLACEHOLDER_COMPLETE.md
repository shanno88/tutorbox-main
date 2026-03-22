# New Product Pages - Placeholder Implementation Complete

## Overview
Created placeholder detail pages for two new products (Trial Decision Engine and Paddle Payment Toolkit) with proper routing, bilingual content, and reserved space for future Paddle integration.

## Project Structure

### New Routes Created

#### 1. Trial Decision Engine
- **Chinese Route**: `/zh/trial-decision`
- **English Route**: `/en/trial-decision`
- **File**: `src/app/[locale]/trial-decision/page.tsx`

#### 2. Paddle Payment Toolkit
- **Chinese Route**: `/zh/paddle-toolkit`
- **English Route**: `/en/paddle-toolkit`
- **File**: `src/app/[locale]/paddle-toolkit/page.tsx`

## Page Content

### Trial Decision Engine Page

**Title**:
- ZH: "试用判断台"
- EN: "Trial Decision Engine"

**Subtitle**:
- ZH: "鉴权 / 分层体验"
- EN: "Auth & tiered experience"

**Description**:
- ZH: "判断网站访客是免费、试用还是付费用户的大脑，为每一次访问自动匹配对应的功能与体验。帮你无代码区分不同用户层级，控制可用功能、额度和提示文案，让升级路径清晰又不打扰。"
- EN: "The brain that decides whether a visitor is free, on trial, or paying, and automatically matches the right features and experience on every visit. Segment users without touching code, control features, quotas, and upgrade prompts so the path to paid feels clear, not pushy."

**CTA Button**:
- ZH: "敬请期待" (Stay tuned)
- EN: "Stay tuned"
- Status: "早鸟体验 · 即将开放" (Early access · Coming soon)

**Pricing Section**:
- Placeholder text indicating pricing coming soon with Paddle support
- Reserved for future PaddleCheckoutButton integration

### Paddle Payment Toolkit Page

**Title**:
- ZH: "Paddle 支付工具"
- EN: "Paddle Payment Toolkit"

**Subtitle**:
- ZH: "虚拟产品支付"
- EN: "Digital product payments"

**Description**:
- ZH: "Paddle 虚拟产品支付管家，面向全球市场的一站式支付工具，支持订阅、一次性购买和多币种结算，你只管卖虚拟产品，收款和对账交给它。集成体验对标 Stripe，是出海虚拟产品的主力收款通道之一。"
- EN: "A payment butler for your digital products. Handle subscriptions, one-off purchases, and multi-currency checkout for a global audience while you focus on building. Stripe-level DX and one of the go-to payment rails for indie builders going global."

**CTA Button**:
- ZH: "敬请期待" (Stay tuned)
- EN: "Stay tuned"
- Status: "Dev Toolkit · Coming soon"

**Pricing Section**:
- Placeholder text indicating pricing coming soon with Paddle support
- Reserved for future PaddleCheckoutButton integration

## Implementation Details

### Page Structure
Both pages follow the same layout pattern as `grammar-master`:
- Gradient background (`from-background to-background/80`)
- Centered content with max-width container
- Header section with title, subtitle
- Main content card with product description
- CTA section with button
- Pricing placeholder section

### Bilingual Support
- Uses `useLocale()` hook to detect current locale
- `isZh` boolean for conditional rendering
- All user-visible text uses ternary expressions: `isZh ? zh : en`
- No hardcoded text mixing Chinese and English

### CTA Button
- Placeholder function `handleComingSoon()` shows alert
- Button disabled state during loading
- Ready for future integration with email signup or redirect

### Pricing Section
- Clearly marked as placeholder
- Includes note about Paddle integration
- Ready for future `PaddleCheckoutButton` component integration
- Comment indicates where to add priceId logic

## Homepage Integration

### Featured Products Section Updates
**File**: `src/app/[locale]/(landing)/_sections/featured-products.tsx`

Updated CTA links to point to new product pages:

**Trial Decision Engine Card**:
- Old: `href="#"` (placeholder)
- New: `href="./trial-decision"` (relative link to new page)

**Paddle Payment Toolkit Card**:
- Old: `href="#"` (placeholder)
- New: `href="./paddle-toolkit"` (relative link to new page)

**Button Text**: Unchanged (stays as "敬请期待" / "Stay tuned")

## Future Paddle Integration

### Placeholder Locations

#### Trial Decision Engine (`src/app/[locale]/trial-decision/page.tsx`)
```typescript
// Future: Add priceId for trial-decision product
const priceId = isZh
  ? process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_TRIAL_DECISION_CNY
  : process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_TRIAL_DECISION_USD;

// Replace handleComingSoon button with:
// <PaddleCheckoutButton
//   priceId={priceId}
//   userId={userId}
//   className="w-full"
// >
//   {isZh ? "立即购买" : "Buy now"}
// </PaddleCheckoutButton>
```

#### Paddle Payment Toolkit (`src/app/[locale]/paddle-toolkit/page.tsx`)
```typescript
// Future: Add priceId for paddle-toolkit product
const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PADDLE_TOOLKIT_USD;

// Replace handleComingSoon button with:
// <PaddleCheckoutButton
//   priceId={priceId}
//   userId={userId}
//   className="w-full"
// >
//   {isZh ? "立即购买" : "Buy now"}
// </PaddleCheckoutButton>
```

### Environment Variables to Add
When ready for Paddle integration, add to `.env`:
```bash
# Trial Decision Engine
NEXT_PUBLIC_PADDLE_PRICE_ID_TRIAL_DECISION_CNY=pri_xxxxx
NEXT_PUBLIC_PADDLE_PRICE_ID_TRIAL_DECISION_USD=pri_xxxxx

# Paddle Payment Toolkit
NEXT_PUBLIC_PADDLE_PRICE_ID_PADDLE_TOOLKIT_USD=pri_xxxxx
```

## Files Created

1. **src/app/[locale]/trial-decision/page.tsx** (NEW)
   - Placeholder page for Trial Decision Engine
   - Bilingual support (ZH/EN)
   - Reserved space for Paddle integration

2. **src/app/[locale]/paddle-toolkit/page.tsx** (NEW)
   - Placeholder page for Paddle Payment Toolkit
   - Bilingual support (ZH/EN)
   - Reserved space for Paddle integration

## Files Modified

1. **src/app/[locale]/(landing)/_sections/featured-products.tsx**
   - Updated Trial Decision Engine CTA: `href="./trial-decision"`
   - Updated Paddle Payment Toolkit CTA: `href="./paddle-toolkit"`

## Testing Checklist

- [ ] Visit `/zh/trial-decision` → Page loads with Chinese content
- [ ] Visit `/en/trial-decision` → Page loads with English content
- [ ] Visit `/zh/paddle-toolkit` → Page loads with Chinese content
- [ ] Visit `/en/paddle-toolkit` → Page loads with English content
- [ ] Click "Stay tuned" button → Shows alert (placeholder behavior)
- [ ] Homepage Trial Decision card CTA → Links to `/trial-decision`
- [ ] Homepage Paddle Payment card CTA → Links to `/paddle-toolkit`
- [ ] Pricing section visible on both pages
- [ ] All text properly localized (no mixed Chinese/English)
- [ ] Layout matches grammar-master page style
- [ ] No TypeScript errors or warnings

## Routing Summary

### Trial Decision Engine
- `/zh/trial-decision` → Chinese version
- `/en/trial-decision` → English version
- Homepage card CTA → `./trial-decision` (relative link)

### Paddle Payment Toolkit
- `/zh/paddle-toolkit` → Chinese version
- `/en/paddle-toolkit` → English version
- Homepage card CTA → `./paddle-toolkit` (relative link)

## Next Steps for Paddle Integration

1. Get Paddle price IDs for both products
2. Add environment variables to `.env`
3. Import `PaddleCheckoutButton` component
4. Replace `handleComingSoon` button with `PaddleCheckoutButton`
5. Add session check and login redirect (like grammar-master)
6. Test checkout flow with Paddle sandbox
7. Update pricing section with actual prices

## Summary

Two new product detail pages have been created as placeholders:
- ✅ Trial Decision Engine (`/[locale]/trial-decision`)
- ✅ Paddle Payment Toolkit (`/[locale]/paddle-toolkit`)
- ✅ Bilingual support (Chinese/English)
- ✅ Homepage CTA links updated
- ✅ Pricing section reserved for future Paddle integration
- ✅ Ready for future feature implementation

All pages follow the same design pattern as existing product pages and are ready for Paddle integration when price IDs are available.
