# Tutorbox: Fastest Path to Adding New Mini-Apps

## EXECUTIVE SUMMARY

**Current State:** 4-6 hours per new app (manual steps, hardcoded configs, copy-paste templates)

**Goal:** < 2 hours with registry-based approach

**Key Finding:** Well-structured codebase but lacks single source of truth for app configuration

---

## 1. CURRENT ARCHITECTURE

### Project Structure
- Next.js 14 App Router + TypeScript
- PostgreSQL + Drizzle ORM
- NextAuth.js v5 (email magic links)
- Paddle payments
- next-intl (EN/ZH)

### App Organization
Apps are route-based, NOT separate folders:
```
src/app/[locale]/
├── grammar-master/page.tsx
├── lease-ai/page.tsx
├── cast-master/page.tsx
└── my-new-app/page.tsx  ← Add here

src/app/api/
├── grammar/access/route.ts
├── lease/access/route.ts
└── my-new-app/access/route.ts  ← Add here
```

---

## 2. SHARED INFRASTRUCTURE (REUSABLE)

### ✅ Authentication
- **Location:** `src/lib/auth.ts`
- **Method:** Email magic links via Resend
- **Fully reusable** for all apps

### ✅ Product Grants (Access Control)
- **Location:** `src/db/schema.ts` (productGrants table)
- **Tracks:** userId, productKey, type (trial/paid/gift), status
- **Fully reusable** - all access APIs query this

### ✅ Payment System (Paddle)
- **Checkout:** `src/components/paddle/checkout-button.tsx`
- **Webhook:** `src/app/api/webhooks/paddle/route.ts`
- **Mostly reusable** - but priceId mapping is hardcoded

### ⚠️ Trial System
- **Anonymous (30 min):** `src/lib/anonymous-trial.ts` ✅ Reusable
- **Account (3 days):** `src/lib/trial/account-trial.ts` ⚠️ Hardcoded for grammar-master only

### ⚠️ Product Registry
- **Location:** `src/lib/products.ts`
- **Problem:** Only used for landing page cards, not for routing/access/payments
- **Redundant definitions** exist elsewhere

### ⚠️ Navigation
- **Location:** `src/app/_components/header/header.tsx`
- **Problem:** App links are hardcoded, not dynamic

---

## 3. EXACT STEPS TO ADD NEW APP (CURRENT)

### Files to Modify (8 files)
1. `src/lib/products.ts` - Add product definition
2. `src/app/[locale]/my-app/page.tsx` - Create landing page (NEW)
3. `src/app/api/my-app/access/route.ts` - Create access control (NEW)
4. `src/app/api/webhooks/paddle/route.ts` - Add webhook mapping
5. `src/config/anonymous-trial.ts` - Add trial config (if applicable)
6. `src/env.ts` - Add env schema
7. `.env` / `.env.example` - Add env variables
8. `src/app/_components/header/header.tsx` - Add navigation link

### Time Breakdown
- Register product: 5 min
- Create landing page: 30 min (copy-paste + customize)
- Configure payment: 10 min
- Update env schema: 5 min
- Add webhook mapping: 5 min
- Create access control API: 15 min
- Add trial config: 5 min
- Update navigation: 5 min
- **Total: 4-6 hours**

---

## 4. TOP 5 BOTTLENECKS

### 🔴 1. Hardcoded App Links in Header
- **File:** `src/app/_components/header/header.tsx`
- **Problem:** Must manually add link for each new app
- **Impact:** Easy to forget, breaks navigation

### 🔴 2. Webhook Price Mapping is Manual
- **File:** `src/app/api/webhooks/paddle/route.ts`
- **Problem:** Must add priceId → productKey mapping for each product
- **Impact:** Error-prone, requires code change

### 🔴 3. Environment Variables Scattered
- **Problem:** Paddle price IDs spread across `.env` and `src/env.ts`
- **Impact:** No single source of truth

### 🔴 4. Trial Logic Hardcoded per Product
- **File:** `src/lib/trial/account-trial.ts`
- **Problem:** Only handles `grammar_master` (hardcoded type)
- **Impact:** Can't reuse for other products

### 🔴 5. Landing Pages are Copy-Paste Templates
- **Problem:** Each app duplicates auth checks, trial logic, purchase flow
- **Impact:** High maintenance burden, inconsistency

---

## 5. RECOMMENDED REFACTOR (< 2 HOURS)

### Phase 1: Create App Registry (30 min)
**File:** `src/config/apps.ts` (NEW)

```typescript
export interface AppConfig {
  slug: string;
  productKey: string;
  name: string;
  nameCn: string;
  paddlePriceIdUsd?: string;
  paddlePriceIdCny?: string;
  trialType: 'none' | 'anonymous_30min' | 'account_3days';
  features: { en: string; cn: string }[];
  icon: string;
  status: 'live' | 'beta' | 'coming-soon';
}

export const appRegistry: AppConfig[] = [
  {
    slug: 'grammar-master',
    productKey: 'grammar-master',
    name: 'Grammar Master',
    nameCn: '语法大师',
    paddlePriceIdUsd: 'pri_01khwk19y0af40zae5fnysj5t3',
    paddlePriceIdCny: 'pri_01kggqdgjrgyryb19xs3veb1js',
    trialType: 'account_3days',
    features: [...],
    icon: 'pen-tool',
    status: 'live',
  },
  // ... more apps
];
```

### Phase 2: Auto-Generate Webhook Mappings (15 min)
**File:** `src/lib/paddle-mappings.ts` (NEW)

```typescript
import { appRegistry } from '@/config/apps';

export function getPriceToProductMapping(): Record<string, string> {
  const mapping: Record<string, string> = {};
  appRegistry.forEach(app => {
    if (app.paddlePriceIdUsd) mapping[app.paddlePriceIdUsd] = app.productKey;
    if (app.paddlePriceIdCny) mapping[app.paddlePriceIdCny] = app.productKey;
  });
  return mapping;
}
```

### Phase 3: Reusable Landing Template (30 min)
**File:** `src/components/app-landing-template.tsx` (NEW)

Shared component with:
- Auth checks
- Trial logic
- Purchase flow
- Customizable content section

### Phase 4: Update Trial Config (15 min)
Auto-generate from registry:
```typescript
supportedProducts: appRegistry
  .filter(app => app.trialType === 'anonymous_30min')
  .map(app => app.productKey)
```

### Phase 5: Dynamic Navigation (10 min)
```typescript
{appRegistry
  .filter(app => app.status === 'live')
  .map(app => <Link href={`/${app.slug}`}>{app.name}</Link>)}
```

---

## 6. AFTER REFACTORING: NEW APP IN < 2 HOURS

### Step 1: Update Registry (5 min)
Add entry to `src/config/apps.ts`

### Step 2: Customize Landing Page (30 min)
Copy template, update title/description/features

### Step 3: Create Paddle Price (10 min)
Go to Paddle dashboard, get priceId

### Step 4: Update Env Vars (5 min)
Add priceId to `.env`

### Step 5: Test (30 min)
- Auth flow
- Payment webhook
- Trial logic

### Step 6: Deploy (10 min)
Build and deploy

**Total: ~90 minutes**

---

## 7. AUTOMATION POTENTIAL

### Fully Automatable ✅
- Create landing page from template
- Create access control API
- Add product to registry
- Generate webhook mapping
- Update env schema
- Update navigation

### Requires Human Decision ⚠️
- Product name, description, features
- Pricing strategy
- Trial type and duration
- UI customization

### CLI Script (Optional)
```bash
npm run scaffold-app -- \
  --slug my-app \
  --name "My App" \
  --price-usd 49 \
  --trial 3days
```

---

## 8. IMPLEMENTATION ROADMAP

### Week 1: Refactoring (4 hours)
- [ ] Create `src/config/apps.ts`
- [ ] Create `src/lib/paddle-mappings.ts`
- [ ] Create `src/components/app-landing-template.tsx`
- [ ] Update webhook handler
- [ ] Update header navigation
- [ ] Test existing apps

### Week 2: CLI Scaffolding (2 hours)
- [ ] Create `scripts/scaffold-app.ts`
- [ ] Test with new app
- [ ] Document

### Week 3: Documentation (1 hour)
- [ ] Update README
- [ ] Create templates

---

## 9. SUMMARY

| Aspect | Current | After Refactoring |
|--------|---------|-------------------|
| Files to modify | 8 | 1 (registry) |
| Time per app | 4-6 hours | < 2 hours |
| Hardcoded mappings | 5+ places | 0 |
| Navigation updates | Manual | Automatic |
| Webhook mappings | Manual | Automatic |
| Landing template | Copy-paste | Reusable |
| Single source of truth | No | Yes |

---

## 10. NEXT STEPS

1. Review this plan
2. Prioritize: Refactoring (high impact) vs. CLI (nice-to-have)
3. Start with Phase 1-2 for immediate benefit
4. Test thoroughly
5. Document new process

