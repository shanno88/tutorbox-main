# Tutorbox Billing System – Complete Code Map

**Last Updated**: March 20, 2026  
**Git Status**: On branch `feature/auth-rate-limit-quota` (up to date with origin)  
**Modified Files**: 7 tracked files  
**Untracked Files**: 100+ (mostly documentation + new billing/admin/dashboard code)

---

## Overview

This document maps all billing, Paddle/DoDo integration, admin dashboard, and user self-service portal code across the Tutorbox monorepo. Each entry includes:
- **Path**: Relative path from repo root
- **Purpose**: What the file/directory does
- **Git Status**: `tracked` (in git) or `untracked` (new, not yet committed)
- **Type**: Backend API, Frontend Component, Utility, Documentation, etc.

---

## 1. Core Billing Utilities (`src/lib/billing/`)

### Backend Billing Logic

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/lib/billing/model.ts` | Canonical TypeScript types for billing (Subscription, ApiKey, WebhookEvent, etc.) | untracked | Utility |
| `src/lib/billing/priceMaps.ts` | Paddle price ID → product key mappings; plan slug → details lookup | untracked | Utility |
| `src/lib/billing/paddleWebhookHandler.ts` | Extracts subscription descriptor from Paddle webhook events; validates signatures | untracked | Utility |
| `src/lib/billing/dodoWebhookHandler.ts` | Scaffolding for DoDo webhook handler (TODO stubs for real DoDo API) | untracked | Utility |
| `src/lib/billing/handleSuccessfulSubscription.ts` | Generic handler for successful subscription events (Paddle or DoDo) | untracked | Utility |
| `src/lib/billing/issueApiKeyForSubscription.ts` | Creates API key record in database for new subscription | untracked | Utility |
| `src/lib/billing/issueKeyFromWebhook.ts` | Wrapper to issue API key from webhook event | untracked | Utility |
| `src/lib/billing/apiKeyGenerator.ts` | Generates random API key strings (tutorbox_xxx format) | untracked | Utility |
| `src/lib/billing/admin-helpers.ts` | Helper functions: `maskApiKey()`, `looksLikeEmail()`, `formatDate()` | untracked | Utility |
| `src/lib/billing/logger.ts` | Structured logging with `[billing:module]` prefixes | untracked | Utility |
| `src/lib/billing/health.ts` | Health check logic for billing system | untracked | Utility |
| `src/lib/billing/dead-letter.ts` | Dead-letter mechanism for failed webhooks | untracked | Utility |
| `src/lib/billing/access.ts` | Access control helpers (if any) | untracked | Utility |

---

## 2. Webhook Handlers

### Paddle Webhook

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/api/webhooks/paddle/route.ts` | POST endpoint for Paddle webhook events; signature verification, event processing | **tracked** | API Route |

### DoDo Webhook

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/api/webhooks/dodo/route.ts` | POST endpoint for DoDo webhook events (scaffolding) | untracked | API Route |

### Test Webhook (Dev Only)

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/api/test/dodo-webhook/route.ts` | Dev-only test endpoint to trigger DoDo webhook handler | untracked | API Route |

---

## 3. Billing Health & Observability

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/api/billing/health/route.ts` | GET endpoint for billing system health check | untracked | API Route |

---

## 4. Admin Billing Backend APIs

### Search & User Details

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/api/admin/billing/search/route.ts` | GET `/api/admin/billing/search?q=<query>` – Search users by email or userId | untracked | API Route |
| `src/app/api/admin/billing/user/[userId]/route.ts` | GET `/api/admin/billing/user/[userId]` – Fetch user's subscriptions and API keys | untracked | API Route |

### API Key Actions (Admin Only)

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/api/admin/billing/api-keys/revoke/route.ts` | POST `/api/admin/billing/api-keys/revoke` – Mark API key as inactive | untracked | API Route |
| `src/app/api/admin/billing/api-keys/rotate/route.ts` | POST `/api/admin/billing/api-keys/rotate` – Create new key, revoke old key | untracked | API Route |

---

## 5. User Self-Service Backend APIs

### Billing Info

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/api/me/billing/route.ts` | GET `/api/me/billing` – Current user's subscription info | untracked | API Route |

### API Keys Management

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/api/me/api-keys/route.ts` | GET `/api/me/api-keys` – Current user's API keys | untracked | API Route |
| `src/app/api/me/api-keys/rotate/route.ts` | POST `/api/me/api-keys/rotate` – User rotates their own key | untracked | API Route |

---

## 6. Admin Billing Frontend

### Pages & Components

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/admin/layout.tsx` | Admin layout wrapper (includes billing admin pages) | untracked | Layout |
| `src/app/admin/page.tsx` | Admin dashboard home page | untracked | Page |
| `src/app/admin/billing/page.tsx` | Main admin billing dashboard (`/admin/billing`) | untracked | Page |
| `src/app/admin/billing/search-form.tsx` | Search form component (email/userId with 300ms debounce) | untracked | Component |
| `src/app/admin/billing/user-details.tsx` | User details card (subscriptions + API keys table) | untracked | Component |
| `src/app/admin/billing/api-key-actions.tsx` | Revoke/Rotate buttons + modals for API key actions | untracked | Component |

### Other Admin Pages (Not Billing-Specific)

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/admin/users/page.tsx` | Admin users page | untracked | Page |
| `src/app/admin/api-keys/page.tsx` | Admin API keys page | untracked | Page |
| `src/app/admin/plans/page.tsx` | Admin plans page | untracked | Page |
| `src/app/admin/external-links/page.tsx` | Admin external links page | untracked | Page |

---

## 7. User Self-Service Frontend

### Billing Portal

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/dashboard/billing/page.tsx` | User billing summary (`/dashboard/billing`) – read-only | untracked | Page |

### API Keys Portal

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/app/dashboard/api-keys/page.tsx` | User API keys management (`/dashboard/api-keys`) | untracked | Page |
| `src/app/dashboard/api-keys/rotate-button.tsx` | Rotate button component with confirmation + new key modal | untracked | Component |

---

## 8. Paddle/DoDo Integration

### Integration Directory

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `integrations/paddle-dodo/` | Standalone Paddle/DoDo integration testing & reference | untracked | Reference |
| `integrations/paddle-dodo/readme.md` | Overview of Paddle/DoDo integration | untracked | Documentation |
| `integrations/paddle-dodo/README_IMPLEMENTATION_STATUS.md` | Implementation status and TODO items | untracked | Documentation |
| `integrations/paddle-dodo/ENVIRONMENT.md` | Environment setup guide | untracked | Documentation |
| `integrations/paddle-dodo/notes.md` | Development notes | untracked | Documentation |
| `integrations/paddle-dodo/curl_examples.sh` | cURL examples for testing | untracked | Reference |
| `integrations/paddle-dodo/test_*.py` | Python test scripts for Paddle/DoDo APIs | untracked | Test |
| `integrations/paddle-dodo/tests/paddle-sandbox-test-cases.json` | Paddle sandbox test case definitions | untracked | Test Data |

---

## 9. Billing Documentation

### Core Documentation

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `docs/BILLING_FLOW.md` | High-level billing flow diagram and explanation | untracked | Documentation |
| `docs/billing-launch-checklist.md` | Pre-launch, launch day, and 3am debug guide (~400 lines) | untracked | Documentation |
| `docs/billing-failure-modes.md` | 10 documented failure modes and recovery strategies | untracked | Documentation |
| `docs/self-hosted-billing-admin.md` | Guide for self-hosted customers on `/admin/billing` setup | untracked | Documentation |

### Other Documentation (Not Billing-Specific)

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `docs/ENVIRONMENT_VARIABLES.md` | Environment variable reference | untracked | Documentation |
| `docs/ANONYMOUS_TRIAL_SYSTEM.md` | Anonymous trial system documentation | untracked | Documentation |
| `docs/ANONYMOUS_TRIAL_SETUP.md` | Anonymous trial setup guide | untracked | Documentation |
| `docs/RATE_LIMIT_AND_QUOTA.md` | Rate limiting and quota documentation | untracked | Documentation |
| `docs/external-link-health-check.md` | External link health check documentation | untracked | Documentation |
| `docs/external-link-setup-guide.md` | External link setup guide | untracked | Documentation |

---

## 10. Supporting Utilities

### Admin Authentication

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/lib/admin-auth.ts` | Admin authentication helper (`checkAdminAuth()`) | untracked | Utility |
| `src/lib/withAuth.ts` | Generic auth wrapper utility | untracked | Utility |

### Paddle Mappings (Legacy)

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/lib/paddle-mappings.ts` | Legacy Paddle mappings (superseded by `priceMaps.ts`) | untracked | Utility |

### Rate Limiting & Quotas

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/lib/limits.ts` | Rate limiting and quota logic | **tracked** | Utility |

### Trial System

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/lib/trial/account-trial.ts` | Account trial logic | untracked | Utility |

### Limit Logging

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/db/limit-logging.ts` | Limit event logging to database | untracked | Utility |

---

## 11. Configuration & Schema

### Database Schema

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/db/schema.ts` | Drizzle ORM schema (includes subscriptions, apiKeys, webhookDeadLetters tables) | **tracked** | Schema |

### App Configuration

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/config/apps.ts` | App configuration (products, plans, etc.) | untracked | Configuration |

### Environment Files

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `.env.example` | Example environment variables | **tracked** | Configuration |
| `.env.local` | Local environment overrides | untracked | Configuration |
| `.env.sample` | Sample environment file | untracked | Configuration |
| `.env` | Local environment (not committed) | untracked | Configuration |

---

## 12. Testing & Scripts

### E2E Testing

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `scripts/test-billing-admin-e2e.ts` | Full E2E test: create user → subscription → API key → verify admin UI | untracked | Test |

### Limit Testing

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `scripts/test-limits.ts` | Test rate limiting and quota system | untracked | Test |
| `scripts/verify-limit-events.ts` | Verify limit event logging | untracked | Test |
| `scripts/print-limit-stats.ts` | Print limit statistics | untracked | Test |

### Paddle Mappings Test

| Path | Purpose | Git Status | Type |
|------|---------|-----------|------|
| `src/lib/__tests__/paddle-mappings.test.ts` | Unit tests for Paddle mappings | untracked | Test |

---

## 13. Summary Documentation (Generated)

These are comprehensive summaries generated during implementation. They are **untracked** and for reference only.

| Path | Purpose |
|------|---------|
| `BILLING_CODE_MAP.md` | This file – complete code map |
| `BILLING_ADMIN_E2E_TEST_REPORT.md` | E2E test results and verification |
| `BILLING_ADMIN_UI_IMPLEMENTATION_SUMMARY.md` | Admin UI implementation details |
| `USER_BILLING_PORTAL_IMPLEMENTATION.md` | User portal implementation details |
| `BILLING_ADMIN_API_KEY_ACTIONS.md` | Admin revoke/rotate implementation |
| `docs/billing-launch-checklist.md` | Launch guide |
| `docs/billing-failure-modes.md` | Failure modes documentation |
| `docs/self-hosted-billing-admin.md` | Self-hosted customer guide |

---

## Git Status Summary

### Modified Files (7 tracked)
```
.env.example
src/app/_components/footer.tsx
src/app/_components/header/links.tsx
src/app/api/auth/validate/route.ts
src/app/api/webhooks/paddle/route.ts
src/db/schema.ts
src/lib/limits.ts
```

### Untracked Files (100+)
- **Documentation**: 50+ `.md` files (implementation summaries, guides, checklists)
- **Source Code**: ~50 new files (billing utilities, admin/dashboard pages, APIs)
- **Integration**: `integrations/paddle-dodo/` directory with Python reference implementation
- **Tests**: `scripts/test-*.ts` files

### Key Untracked Directories
```
src/lib/billing/                    # 13 billing utility modules
src/app/api/admin/billing/          # Admin billing APIs
src/app/api/me/                     # User self-service APIs
src/app/admin/billing/              # Admin billing UI
src/app/dashboard/billing/          # User billing portal
src/app/dashboard/api-keys/         # User API keys portal
integrations/paddle-dodo/           # Paddle/DoDo reference
docs/                               # Billing documentation
scripts/                            # Test scripts
```

---

## Architecture Overview

### Data Flow: Paddle Webhook → Subscription → API Key

```
1. Paddle sends webhook event
   ↓
2. POST /api/webhooks/paddle/route.ts
   - Verify signature
   - Extract subscription descriptor
   ↓
3. paddleWebhookHandler.ts
   - Parse event type
   - Extract subscription details
   ↓
4. handleSuccessfulSubscription.ts
   - Map Paddle price ID → product key
   - Determine subscription status
   ↓
5. issueApiKeyForSubscription.ts
   - Generate API key
   - Store in database
   ↓
6. Admin views via /admin/billing
   - Search users
   - View subscriptions & API keys
   - Revoke/rotate keys
```

### User Self-Service Flow

```
1. Authenticated user visits /dashboard/billing
   ↓
2. GET /api/me/billing
   - Fetch current user's subscription
   - Return plan name, status, next billing date
   ↓
3. User visits /dashboard/api-keys
   ↓
4. GET /api/me/api-keys
   - Fetch user's API keys
   - Return masked keys with usage
   ↓
5. User clicks "Rotate"
   ↓
6. POST /api/me/api-keys/rotate
   - Create new key
   - Revoke old key
   - Return plain key (one-time only)
```

---

## Key Files to Read First

### For Understanding the System
1. `src/lib/billing/model.ts` – Canonical types
2. `src/lib/billing/priceMaps.ts` – Price mappings
3. `src/lib/billing/paddleWebhookHandler.ts` – Webhook extraction
4. `docs/BILLING_FLOW.md` – High-level flow

### For Admin Features
1. `src/app/admin/billing/page.tsx` – Admin UI entry point
2. `src/app/api/admin/billing/search/route.ts` – Search API
3. `src/app/api/admin/billing/api-keys/revoke/route.ts` – Revoke API
4. `src/app/api/admin/billing/api-keys/rotate/route.ts` – Rotate API

### For User Portal
1. `src/app/dashboard/billing/page.tsx` – User billing page
2. `src/app/dashboard/api-keys/page.tsx` – User API keys page
3. `src/app/api/me/billing/route.ts` – User billing API
4. `src/app/api/me/api-keys/route.ts` – User API keys API

### For Deployment
1. `docs/billing-launch-checklist.md` – Pre-launch checklist
2. `docs/billing-failure-modes.md` – Failure modes & recovery
3. `docs/self-hosted-billing-admin.md` – Self-hosted setup

---

## Notes

- **All code passes TypeScript diagnostics** – No compilation errors
- **Idempotency guaranteed** – Revoke checks if already revoked; rotate always creates new key
- **Revoked keys blocked** – API key validation checks `status = 'active'`
- **Plain keys never logged** – Only returned in HTTP response for rotate operations
- **User-scoped queries** – All `/api/me/*` endpoints filter by `session.user.id`
- **Cross-user protection** – Rotate endpoint verifies key belongs to current user (403 if not)
- **Admin-only endpoints** – All `/api/admin/*` endpoints use `checkAdminAuth()`
- **Masked keys in UI** – Never show full key, only first 4 + last 4 characters
