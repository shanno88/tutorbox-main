# Tutorbox i18n, Billing & License Files – Complete Index

## 📋 Files Found & Extracted

This document indexes all i18n, billing/subscription, and license/limit related files in the tutorbox repository.

---

## 1️⃣ I18N / ROUTING FILES

### Core i18n Configuration
- **`src/i18n/routing.ts`** – Defines locales (en, zh) and default locale
- **`src/i18n/request.ts`** – Loads messages based on locale, sets timezone to Asia/Shanghai

### Messages (Translations)
- **`messages/en.json`** – English translations (brand, nav, hero, pricing, products, footer, etc.)
- **`messages/zh.json`** – Chinese translations (same structure as en.json)

### Locale-Specific Layouts
- **`src/app/[locale]/layout.tsx`** – Main locale layout with i18n setup, Header, Footer
- **`src/app/layout.tsx`** – Root layout with global styles and providers

---

## 2️⃣ BILLING / SUBSCRIPTION FRONTEND

### User Dashboard Pages
- **`src/app/dashboard/billing/page.tsx`** – User billing summary (read-only)
  - Shows current plan, status, next billing date, provider
  - Calls `GET /api/me/billing`

- **`src/app/dashboard/api-keys/page.tsx`** – User API keys management
  - Lists user's API keys with masked display
  - Shows monthly usage progress bar
  - Calls `GET /api/me/api-keys`

- **`src/app/dashboard/api-keys/rotate-button.tsx`** – Rotate button component
  - Rotate action with confirmation dialog
  - Shows new key in modal (one-time display)
  - Calls `POST /api/me/api-keys/rotate`

### Admin Billing Pages
- **`src/app/admin/billing/page.tsx`** – Admin billing dashboard
  - Search form + user details layout

- **`src/app/admin/billing/search-form.tsx`** – Search users by email/ID
  - Debounced search (300ms)
  - Calls `GET /api/admin/billing/search?q=<query>`

- **`src/app/admin/billing/user-details.tsx`** – Display user info, subscriptions, API keys
  - Shows subscription status, period dates
  - Shows API keys with usage bars
  - Calls `GET /api/admin/billing/user/[userId]`

- **`src/app/admin/billing/api-key-actions.tsx`** – Revoke/Rotate buttons
  - Revoke: `POST /api/admin/billing/api-keys/revoke`
  - Rotate: `POST /api/admin/billing/api-keys/rotate`

---

## 3️⃣ LICENSE / LIMIT / QUOTA COMPONENTS

### Trial & Access Control
- **`src/components/trial-guard.tsx`** – Server component that checks user access
  - Uses `checkUserAccess()` from `@/lib/access`
  - Shows trial banner if trial access
  - Redirects if no access

- **`src/components/anonymous-trial-banner.tsx`** – Client component for anonymous trial countdown
  - Shows minutes remaining
  - Bilingual (en/zh)
  - Dismissible banner

- **`src/components/anonymous-trial-expired-modal.tsx`** – Modal when trial expires

### Configuration & Utilities
- **`src/config/anonymous-trial.ts`** – Anonymous trial config
  - Duration: 30 minutes (configurable via env)
  - Supported products: grammar-master, cast-master
  - Cookie name: tutorbox_anon_trial

- **`src/config/products.ts`** – Product definitions
  - 9 products with en/zh names, descriptions, features
  - Trial enabled/disabled per product
  - Status: live, beta, coming-soon

- **`src/lib/access.ts`** – Access control logic
  - `checkUserAccess(userId, product)` – Returns access result
  - Checks productGrants (paid) or trial status
  - Trial duration: 7 days

- **`src/lib/limits.ts`** – Rate limiting & quota enforcement
  - `checkRateLimit()` – Per-minute rate limiting (Redis)
  - `checkAndConsumeQuota()` – Monthly quota tracking (Postgres)
  - `enforceLimits()` – Combined check

- **`src/lib/anonymous-trial.ts`** – Anonymous trial state management
  - JWT-based trial state in cookies
  - `createAnonymousTrialState()`, `verifyTrialState()`, `getAnonymousTrialState()`
  - `checkAnonymousAccess()` – Check if user has trial access

- **`src/lib/trials.ts`** – Trial utilities (TODO: not fully implemented)

- **`src/lib/entitlements.ts`** – Entitlement checking
  - `checkEntitlement(email, product)` – Calls `/api/entitlements/check`

---

## 4️⃣ SUBSCRIPTIONS & PRODUCTS

- **`src/use-cases/subscriptions.ts`** – Subscription use cases (deprecated)
  - Old functions return false (subscriptions table removed)
  - Use `checkUserAccess()` instead

- **`src/lib/products.ts`** – Product catalog
  - 9 products with full metadata
  - `getProductBySlug(slug)` helper

---

## 📊 Summary Table

| Category | Files | Purpose |
|----------|-------|---------|
| **i18n** | 4 | Routing, messages (en/zh), locale layout |
| **Billing UI** | 6 | User dashboard, admin dashboard, components |
| **License/Trial** | 7 | Trial guard, anonymous trial, access control, limits |
| **Config** | 3 | Products, anonymous trial, apps |
| **Utilities** | 4 | Subscriptions, trials, entitlements, limits |
| **Total** | 24 | All i18n, billing, license files |

---

## 🔗 API Endpoints Called

### User APIs
- `GET /api/me/billing` – User's subscription info
- `GET /api/me/api-keys` – User's API keys
- `POST /api/me/api-keys/rotate` – Rotate user's key

### Admin APIs
- `GET /api/admin/billing/search?q=<query>` – Search users
- `GET /api/admin/billing/user/[userId]` – User details
- `POST /api/admin/billing/api-keys/revoke` – Revoke key
- `POST /api/admin/billing/api-keys/rotate` – Rotate key

### Other APIs
- `POST /api/entitlements/check` – Check entitlement

---

## 📝 Next Steps

All files have been extracted and are ready for:
1. **i18n Restructuring** – Organize messages with billing/license keys
2. **Billing Copy** – Add billing-specific translations
3. **License/Trial Copy** – Add trial, quota, limit messages
4. **Component Refactoring** – Update components to use new i18n keys
