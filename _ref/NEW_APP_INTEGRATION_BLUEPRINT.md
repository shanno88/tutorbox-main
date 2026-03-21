before deploying to production
5. **Document** the new process for team

ces | 0 (auto-generated) |
| Navigation updates | Manual | Automatic |
| Webhook mappings | Manual | Automatic |
| Landing page template | Copy-paste | Reusable component |
| Single source of truth | No | Yes (registry) |
| CLI scaffolding | No | Yes (optional) |

---

## 11. NEXT STEPS

1. **Review this plan** with your team
2. **Prioritize:** Refactoring (high impact, 4 hours) vs. CLI (nice-to-have, 2 hours)
3. **Start with Phase 1-2** (registry + webhook mappings) for immediate benefit
4. **Test thoroughly**  **Create Paddle Price** (10 min)
   - Go to Paddle dashboard, create price

4. **Update Env Vars** (5 min)
   - Add priceId to `.env`

5. **Test** (30 min)
   - Test auth flow
   - Test payment webhook
   - Test trial logic

6. **Deploy** (10 min)
   - Build and deploy

**Total:** ~90 minutes

---

## 10. SUMMARY TABLE

| Aspect | Current | After Refactoring |
|--------|---------|-------------------|
| Files to modify | 8 | 1 (registry) |
| Time to add app | 4-6 hours | < 2 hours |
| Hardcoded mappings | 5+ plaipts/scaffold-app.ts`
- [ ] Test scaffolding with new test app
- [ ] Document CLI usage

### Week 3: Documentation (1 hour)
- [ ] Update README with new app integration guide
- [ ] Create template for new app landing pages
- [ ] Document env var requirements

---

## 9. FASTEST PATH TO NEW APP (AFTER REFACTORING)

### Time Estimate: < 2 hours

1. **Update Registry** (5 min)
   - Add entry to `src/config/apps.ts`

2. **Customize Landing Page** (30 min)
   - Copy template, update title/description/features

3. price, get priceId

# 4. Update env vars
# Add priceId to .env

# 5. Deploy
npm run build && npm run deploy
```

---

## 8. IMPLEMENTATION ROADMAP

### Week 1: Refactoring (4 hours)
- [ ] Create `src/config/apps.ts` registry
- [ ] Create `src/lib/paddle-mappings.ts`
- [ ] Create `src/components/app-landing-template.tsx`
- [ ] Update webhook handler to use auto-generated mappings
- [ ] Update header to use dynamic navigation
- [ ] Test existing apps still work

### Week 2: CLI Scaffolding (2 hours)
- [ ] Create `scrstry
- Generate webhook mapping
- Update env schema
- Update navigation

### Requires Human Decision ⚠️
- Product name, description, features
- Pricing strategy
- Trial type and duration
- External domain (if applicable)
- UI customization (colors, layout)
- Feature-specific logic

### Ideal Workflow
```bash
# 1. Scaffold new app
npm run scaffold-app --slug my-app --name "My App" --price 49

# 2. Customize landing page
# Edit: src/app/[locale]/my-app/page.tsx

# 3. Create Paddle price
# Go to Paddle dashboard, createrice-usd 49 \
  --price-cny 299 \
  --trial 3days
```

**What it does:**
1. Adds entry to `src/config/apps.ts`
2. Creates `src/app/[locale]/my-app/page.tsx` from template
3. Creates `src/app/api/my-app/access/route.ts` from template
4. Updates `src/env.ts` with new env vars
5. Generates `.env.local` template
6. Outputs: "App scaffolded! Now customize the landing page."

---

## 7. AUTOMATION POTENTIAL

### Fully Automatable ✅
- Create landing page from template
- Create access control API
- Add product to regi   </nav>
    </header>
  );
}
```

### Benefits After Refactoring
✅ Single source of truth for app configuration
✅ Adding new app requires only updating `appRegistry`
✅ Webhook mappings auto-generated
✅ Trial config auto-generated
✅ Navigation auto-generated
✅ Landing pages use shared template
✅ Env variables centralized

---

## 6. CLI SCAFFOLDING SCRIPT (OPTIONAL, 30 min)

**File:** `scripts/scaffold-app.ts`

```bash
npm run scaffold-app -- \
  --slug my-app \
  --name "My App" \
  --name-cn "我的应用" \
  --p"cast-master": 5,
    // Add more as needed
  },
  
  cookie: { ... },
};
```

### Phase 5: Update Header Navigation (10 min)

**File:** `src/app/_components/header/header.tsx`

```typescript
import { appRegistry } from '@/config/apps';

export function Header() {
  return (
    <header>
      <nav>
        {appRegistry
          .filter(app => app.status === 'live')
          .map(app => (
            <Link key={app.slug} href={`/${app.slug}`}>
              {app.name}
            </Link>
          ))}
   se 4: Update Trial Config (15 min)

**File:** `src/config/anonymous-trial.ts`

```typescript
import { appRegistry } from './apps';

export const ANONYMOUS_TRIAL_CONFIG = {
  durationMinutes: parseInt(process.env.NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES || "30", 10),
  cookieName: "tutorbox_anon_trial",
  
  // Auto-generate from registry
  supportedProducts: appRegistry
    .filter(app => app.trialType === 'anonymous_30min')
    .map(app => app.productKey) as const,
  
  maxActions: {
    "grammar-master": 10,
    lg border bg-card p-6">
            <p>{feature.en}</p>
          </div>
        ))}
      </section>

      {/* CTA Buttons */}
      <div className="flex gap-4">
        {app.trialType !== 'none' && (
          <Button onClick={handleStartTrial} disabled={isLoading}>
            Start Trial
          </Button>
        )}
        {app.paddlePriceIdUsd && (
          <Button onClick={handleBuy} disabled={isLoading}>
            Buy Now
          </Button>
        )}
      </div>
    </main>
  );
}
```

### Phapush(`/${locale}/login?redirect=/${locale}/${app.slug}`);
      return;
    }
    // Purchase logic here
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold mb-4">{app.name}</h1>
      <p className="text-gray-700 mb-4">{app.tagline}</p>

      {/* Custom content */}
      {children}

      {/* Features */}
      <section className="grid md:grid-cols-2 gap-6 mb-12">
        {app.features.map((feature, i) => (
          <div key={i} className="rounded-ion
}

export function AppLandingTemplate({ app, children }: AppLandingTemplateProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTrial = async () => {
    if (!session?.user?.id) {
      router.push(`/${locale}/login?redirect=/${locale}/${app.slug}`);
      return;
    }
    // Trial logic here
  };

  const handleBuy = async () => {
    if (!session?.user?.id) {
      router. Handler:**
```typescript
// src/app/api/webhooks/paddle/route.ts
import { getPriceToProductMapping } from '@/lib/paddle-mappings';

const priceToProduct = getPriceToProductMapping();
const productKey = priceToProduct[priceId];

if (productKey) {
  // Write to productGrants
}
```

### Phase 3: Create Reusable Landing Template (30 min)

**File:** `src/components/app-landing-template.tsx` (NEW)

```typescript
interface AppLandingTemplateProps {
  app: AppConfig;
  children?: ReactNode;  // Custom content secte Webhook Mappings (15 min)

**File:** `src/lib/paddle-mappings.ts` (NEW)

```typescript
import { appRegistry } from '@/config/apps';

export function getPriceToProductMapping(): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  appRegistry.forEach(app => {
    if (app.paddlePriceIdUsd) {
      mapping[app.paddlePriceIdUsd] = app.productKey;
    }
    if (app.paddlePriceIdCny) {
      mapping[app.paddlePriceIdCny] = app.productKey;
    }
  });
  
  return mapping;
}
```

**Update Webhook1kggqdgjrgyryb19xs3veb1js',
    trialType: 'account_3days',
    trialDays: 3,
    externalUrl: 'https://gm.tutorbox.cc',
    features: [...],
    icon: 'pen-tool',
    status: 'live',
  },
  // ... more apps
];

export function getAppBySlug(slug: string): AppConfig | undefined {
  return appRegistry.find(app => app.slug === slug);
}

export function getAppByProductKey(productKey: string): AppConfig | undefined {
  return appRegistry.find(app => app.productKey === productKey);
}
```

### Phase 2: Auto-Generat  // Paddle price ID
  trialType: 'none' | 'anonymous_30min' | 'account_3days';
  trialDays?: number;
  externalUrl?: string;            // If redirects to external domain
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
    paddlePriceIdCny: 'pri_0Use registry as single source of truth

---

## 5. RECOMMENDED REFACTOR PLAN (< 2 HOURS)

### Phase 1: Create Centralized App Registry (30 min)

**File:** `src/config/apps.ts` (NEW)

```typescript
export interface AppConfig {
  slug: string;                    // URL slug: "my-app"
  productKey: string;              // DB key: "my-app"
  name: string;                    // "My App"
  nameCn: string;                  // "我的应用"
  paddlePriceIdUsd?: string;       // Paddle price ID
  paddlePriceIdCny?: string;     act:** Can't reuse for other products
- **Fix:** Make generic with productKey parameter

**5. Landing Pages are Copy-Paste Templates**
- **Problem:** Each app duplicates auth checks, trial logic, purchase flow
- **Impact:** High maintenance burden, inconsistency
- **Fix:** Create reusable AppLandingTemplate component

**6. Product Registry Not Used for Routing**
- **Problem:** Products defined in `src/lib/products.ts` but not used for routing
- **Impact:** Redundant definitions, hard to keep in sync
- **Fix:** ddle/route.ts`
- **Problem:** Must add priceId → productKey mapping for each product
- **Impact:** Error-prone, requires code change
- **Fix:** Auto-generate from registry

**3. Environment Variables Scattered**
- **Problem:** Paddle price IDs spread across `.env` and `src/env.ts`
- **Impact:** No single source of truth
- **Fix:** Centralize in registry

**4. Trial Logic is Hardcoded per Product**
- **File:** `src/lib/trial/account-trial.ts`
- **Problem:** Only handles `grammar_master` (hardcoded type)
- **Imp `src/env.ts` - Env schema
7. `.env` / `.env.example` - Env variables
8. `src/app/_components/header/header.tsx` - Navigation

**Total Time:** 4-6 hours

---

## 4. BOTTLENECKS & PAIN POINTS

### 🔴 Critical Issues

**1. Hardcoded App Links in Header**
- **File:** `src/app/_components/header/header.tsx`
- **Problem:** Must manually add link for each new app
- **Impact:** Easy to forget, breaks navigation
- **Fix:** Use dynamic registry

**2. Webhook Price Mapping is Manual**
- **File:** `src/app/api/webhooks/pamaster", "my-app"] as const,
```

### Step 8: Update Header Navigation (5 min)
**File:** `src/app/_components/header/header.tsx`

Add link:
```typescript
{ href: '/my-app', label: 'My App' }
```

### Files That Need Changes
1. `src/lib/products.ts` - Product definition
2. `src/app/[locale]/my-app/page.tsx` - Landing page (NEW)
3. `src/app/api/my-app/access/route.ts` - Access control (NEW)
4. `src/app/api/webhooks/paddle/route.ts` - Webhook mapping
5. `src/config/anonymous-trial.ts` - Trial config (if applicable)
6.nd(
      eq(productGrants.userId, session.user.id),
      eq(productGrants.productKey, "my-app"),
      eq(productGrants.status, "active")
    ),
  });

  if (grant) {
    return NextResponse.json({ ok: true, code: "OK" }, { status: 200 });
  }

  return NextResponse.json({ ok: false, code: "NO_ACCESS" }, { status: 403 });
}
```

### Step 7: Add Trial Config (if applicable) (5 min)
**File:** `src/config/anonymous-trial.ts`

Add to `supportedProducts`:
```typescript
supportedProducts: ["grammar-master", "cast-"
}
```

### Step 6: Create Access Control API (15 min)
**File:** `src/app/api/my-app/access/route.ts`

Copy from `src/app/api/lease/access/route.ts` (simplest pattern):
```typescript
export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, code: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  // Check productGrants for "my-app"
  const grant = await db.query.productGrants.findFirst({
    where: a
NEXT_PUBLIC_PADDLE_PRICE_ID_MY_APP_USD: z.string().optional(),
NEXT_PUBLIC_PADDLE_PRICE_ID_MY_APP_CNY: z.string().optional(),
```

### Step 5: Add Webhook Mapping (5 min)
**File:** `src/app/api/webhooks/paddle/route.ts`

Add priceId → productKey mapping:
```typescript
const MY_APP_PRICE_IDS = [
  env.NEXT_PUBLIC_PADDLE_PRICE_ID_MY_APP_USD,
  env.NEXT_PUBLIC_PADDLE_PRICE_ID_MY_APP_CNY,
].filter(Boolean);

if (priceId && MY_APP_PRICE_IDS.includes(priceId)) {
  // Write to productGrants with productKey: "my-app/page.tsx`), customize:
- Title, description
- Features section
- Trial/purchase buttons
- Auth checks

### Step 3: Configure Payment (10 min)
1. Create price in Paddle dashboard
2. Get priceId (e.g., `pri_01kgrhp2wtthebpgwmn8eh5ssy`)
3. Add to `.env`:
   ```env
   NEXT_PUBLIC_PADDLE_PRICE_ID_MY_APP_USD=pri_01kgrhp2wtthebpgwmn8eh5ssy
   NEXT_PUBLIC_PADDLE_PRICE_ID_MY_APP_CNY=pri_01kgrhp2wtthebpgwmn8eh5ssy
   ```

### Step 4: Update Env Schema (5 min)
**File:** `src/env.ts`

Add to client section:
```typescriptO ADD A NEW APP (CURRENT PROCESS)

### Step 1: Register Product (5 min)
**File:** `src/lib/products.ts`

Add to `products` array:
```typescript
{
  slug: 'my-app',
  name: 'My App',
  nameCn: '我的应用',
  tagline: 'Description',
  taglineCn: '描述',
  description: '...',
  descriptionCn: '...',
  icon: 'icon-name',
  status: 'live',
  features: [
    { en: 'Feature 1', cn: '功能 1' },
  ],
}
```

### Step 2: Create Landing Page (30 min)
**File:** `src/app/[locale]/my-app/page.tsx`

Copy from existing app (e.g., `lease-ain/ui)
- Button, Card, Dialog, Tabs, Toast, etc.
- Trial guards: `trial-guard.tsx`, `anonymous-trial-guard.tsx`
- Auth components: `src/components/auth/`

### 2.7 Navigation ⚠️ HARDCODED
**Location:** `src/app/_components/header/header.tsx`

**Problem:** App links are hardcoded, not dynamic
```typescript
// Current: hardcoded links
const links = [
  { href: '/grammar-master', label: 'Grammar Master' },
  { href: '/lease-ai', label: 'Lease AI' },
  // Must manually add new app here
];
```

---

## 3. EXACT STEPS Tckout Button:** `src/components/paddle/checkout-button.tsx`
```tsx
<PaddleCheckoutButton
  priceId={priceId}
  userId={userId}
  className="w-full"
>
  Buy Now
</PaddleCheckoutButton>
```

**Webhook Handler:** `src/app/api/webhooks/paddle/route.ts`
- Receives Paddle events
- Verifies signature
- Maps priceId → productKey
- Writes to productGrants table

**Problem:** priceId → productKey mapping is hardcoded in webhook handler

### 2.6 Shared UI Components ✅ FULLY REUSABLE
**Location:** `src/components/ui/` (shadchema.ts` (productGrants table)

**How it works:**
```typescript
productGrants = pgTable("product_grant", {
  userId: text("userId"),
  productKey: text("productKey"),  // "grammar-master", "ai-prompter", etc.
  type: text("type"),              // "trial" | "paid" | "gift"
  status: text("status"),          // "active" | "expired"
  trialStartsAt: timestamp(...),
  trialEndsAt: timestamp(...),
});
```

**Usage:** All access control APIs query this table

### 2.5 Payment System (Paddle) ✅ MOSTLY REUSABLE
**Cheurrent use:** Landing page product cards only

**What it contains:**
```typescript
export const products: Product[] = [
  {
    slug: 'grammar-master',
    name: 'Grammar Master',
    nameCn: '语法大师',
    tagline: '...',
    icon: 'pen-tool',
    status: 'live',
    features: [...],
  },
  // ... more products
];
```

**Problem:** Not used for routing, access control, or payment mappings. Redundant definitions exist elsewhere.

### 2.4 Product Grants (Access Control) ✅ FULLY REUSABLE
**Location:** `src/db/scJWT cookie (`tutorbox_anon_trial`)
- No login required
- Configurable: `NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES`
- Supported products: grammar-master, cast-master

**B) Account Trial (3 days)**
- Location: `src/lib/trial/account-trial.ts`
- Storage: User table (trialStart, trialEnd, hasUsedTrial)
- Auto-starts on first access after login
- **PROBLEM:** Only handles grammar-master (hardcoded)
- **NEEDS REFACTORING** for other products

### 2.3 Product Registry ⚠️ INCOMPLETE
**Location:** `src/lib/products.ts`

**Centication System ✅ FULLY REUSABLE
**Location:** `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/`

**How it works:**
- Email-based magic links (no passwords)
- Session stored in database
- Centralized, works for all apps

**Usage:**
```typescript
// Frontend
const { data: session } = useSession();

// Backend
const session = await getServerSession(authConfig);
```

### 2.2 Trial System ✅ PARTIALLY REUSABLE
**Two types:**

**A) Anonymous Trial (30 min)**
- Location: `src/lib/anonymous-trial.ts`
- Storage: ├── lease/access/route.ts        ← Access control
│   ├── my-new-app/access/route.ts   ← Add here
│   └── webhooks/paddle/route.ts     ← Webhook handler
└── (landing)/                       ← Landing page sections
```

**Key Pattern:** Each app has:
1. A landing page at `[locale]/[app-slug]/page.tsx`
2. An access control API at `api/[app-slug]/access/route.ts`
3. An entry in the product registry
4. Paddle price IDs in environment variables

---

## 2. SHARED INFRASTRUCTURE (WHAT YOU CAN REUSE)

### 2.1 Authrizzle ORM
- **Auth:** NextAuth.js v5 (email magic links via Resend)
- **Payments:** Paddle (not Stripe)
- **i18n:** next-intl (EN/ZH)

### How Apps Are Organized
Apps are **NOT separate folders** but route-based:
```
src/app/
├── [locale]/
│   ├── grammar-master/page.tsx      ← Landing page
│   ├── lease-ai/page.tsx            ← Landing page
│   ├── cast-master/page.tsx         ← Landing page
│   └── my-new-app/page.tsx          ← Add here
├── api/
│   ├── grammar/access/route.ts      ← Access control
│   ECUTIVE SUMMARY

**Current State:** Adding a new app takes 4-6 hours due to manual steps, hardcoded configurations, and copy-paste templates.

**Goal:** Reduce to < 2 hours with a registry-based approach and CLI scaffolding.

**Key Finding:** The codebase is well-structured but lacks a single source of truth for app configuration. Hardcoded mappings exist in 5+ places.

---

## 1. CURRENT ARCHITECTURE OVERVIEW

### Project Structure
- **Framework:** Next.js 14 App Router + TypeScript
- **Database:** PostgreSQL + D# Tutorbox: Fastest Path to Adding New Mini-Apps

## EX