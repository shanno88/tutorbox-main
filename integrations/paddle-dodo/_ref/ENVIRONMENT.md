# Paddle/DoDo Environment Variables Inventory

This document lists all environment variables related to Paddle and DoDo payment integrations across the Tutorbox monorepo.

## Quick Reference

| Variable | Scope | Required | Location |
|----------|-------|----------|----------|
| `PADDLE_API_KEY` | Paddle only | ❌ Dev, ✅ Prod | Backend webhook handler |
| `PADDLE_WEBHOOK_SECRET` | Paddle only | ❌ Dev, ✅ Prod | Backend webhook handler |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle only | ❌ Dev, ✅ Prod | Frontend checkout |
| `NEXT_PUBLIC_PADDLE_ENV` | Paddle only | ❌ Dev, ✅ Prod | Frontend checkout |
| `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY` | Paddle only | ❌ Dev, ✅ Prod | Grammar Master (CNY) |
| `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD` | Paddle only | ❌ Dev, ✅ Prod | Grammar Master (USD) |
| `NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY` | Paddle only | ❌ Dev, ✅ Prod | Cast Master (CNY) |
| `NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD` | Paddle only | ❌ Dev, ✅ Prod | Lease AI (USD) |

---

## Production Webhook Handler Variables

### PADDLE_API_KEY

**Variable Name**: `PADDLE_API_KEY`

**Type**: Server-side (secret)

**Scope**: Paddle only

**Required**: 
- ❌ Development (optional)
- ✅ Production (required)

**Purpose**: 
Paddle API authentication key used by the backend to verify webhook signatures and make API calls to Paddle.

**Location(s)**:
- `src/env.ts` - Defined in server-side environment schema
- `src/lib/paddle-server.ts` - Used for webhook signature verification
- `src/app/api/webhooks/paddle/route.ts` - Webhook handler (checks if configured)

**Usage Example**:
```typescript
// src/env.ts
PADDLE_API_KEY: z.string().min(1).optional(),

// src/app/api/webhooks/paddle/route.ts
if (!env.PADDLE_WEBHOOK_SECRET) {
  console.error("[webhooks/paddle] PADDLE_WEBHOOK_SECRET not configured");
  return new Response("Server configuration error", { status: 503 });
}
```

**How to Get**:
1. Log in to [Paddle Dashboard](https://dashboard.paddle.com)
2. Go to Settings → API Keys
3. Create or copy your API key
4. Add to `.env.local`: `PADDLE_API_KEY=your_key_here`

**Notes**:
- Keep this secret; never commit to version control
- Different keys for sandbox vs production environments
- Used for webhook verification and API calls

---

### PADDLE_WEBHOOK_SECRET

**Variable Name**: `PADDLE_WEBHOOK_SECRET`

**Type**: Server-side (secret)

**Scope**: Paddle only

**Required**: 
- ❌ Development (optional)
- ✅ Production (required)

**Purpose**: 
Secret key used to verify that webhook events are genuinely from Paddle (HMAC-SHA256 signature verification).

**Location(s)**:
- `src/env.ts` - Defined in server-side environment schema
- `src/lib/paddle-server.ts` - Used for webhook signature verification
- `src/app/api/webhooks/paddle/route.ts` - Webhook handler

**Usage Example**:
```typescript
// src/lib/paddle-server.ts
export async function verifyPaddleWebhook(
  rawBody: string,
  signature: string
): Promise<boolean> {
  const secret = env.PADDLE_WEBHOOK_SECRET ?? "";
  if (!secret) return false;
  // ... HMAC-SHA256 verification
}

// src/app/api/webhooks/paddle/route.ts
const isValid = await verifyPaddleWebhook(rawBody, signature);
if (!isValid) {
  console.warn("[webhooks/paddle] Invalid webhook signature");
  return new Response("Invalid signature", { status: 400 });
}
```

**How to Get**:
1. Log in to [Paddle Dashboard](https://dashboard.paddle.com)
2. Go to Settings → Webhooks
3. Find your webhook endpoint
4. Copy the "Signing Secret"
5. Add to `.env.local`: `PADDLE_WEBHOOK_SECRET=your_secret_here`

**Notes**:
- Keep this secret; never commit to version control
- Used to verify webhook authenticity
- Different secrets for sandbox vs production
- Webhook endpoint must be configured in Paddle Dashboard

---

## Frontend Checkout Variables

### NEXT_PUBLIC_PADDLE_CLIENT_TOKEN

**Variable Name**: `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`

**Type**: Client-side (public)

**Scope**: Paddle only

**Required**: 
- ❌ Development (optional)
- ✅ Production (required)

**Purpose**: 
Public token used by the frontend to initialize the Paddle JavaScript SDK for checkout functionality.

**Location(s)**:
- `src/env.ts` - Defined in client-side environment schema
- `src/lib/paddle.ts` - Used to initialize Paddle SDK
- `src/components/paddle-checkout-button.tsx` - Checkout button component

**Usage Example**:
```typescript
// src/lib/paddle.ts
export async function getPaddle(): Promise<Paddle | null> {
  const token = env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const envValue = env.NEXT_PUBLIC_PADDLE_ENV;

  if (!token || !envValue) {
    console.warn("[Paddle] Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN or NEXT_PUBLIC_PADDLE_ENV");
    return null;
  }

  const p = await initializePaddle({
    environment: envValue as "production" | "sandbox",
    token,
  });
  return p ?? null;
}
```

**How to Get**:
1. Log in to [Paddle Dashboard](https://dashboard.paddle.com)
2. Go to Settings → API Keys
3. Find "Client Token" (different from API Key)
4. Copy the token
5. Add to `.env.local`: `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_token_here`

**Notes**:
- This is public; safe to expose in frontend code
- Required for Paddle checkout to work
- Different tokens for sandbox vs production
- Prefix `NEXT_PUBLIC_` makes it available in browser

---

### NEXT_PUBLIC_PADDLE_ENV

**Variable Name**: `NEXT_PUBLIC_PADDLE_ENV`

**Type**: Client-side (public)

**Scope**: Paddle only

**Required**: 
- ❌ Development (optional, defaults to "sandbox")
- ✅ Production (required)

**Purpose**: 
Specifies whether to use Paddle's sandbox (testing) or production environment.

**Location(s)**:
- `src/env.ts` - Defined in client-side environment schema with enum validation
- `src/lib/paddle.ts` - Used to initialize Paddle SDK

**Usage Example**:
```typescript
// src/env.ts
NEXT_PUBLIC_PADDLE_ENV: z.enum(["production", "sandbox"]).optional(),

// src/lib/paddle.ts
const p = await initializePaddle({
  environment: envValue as "production" | "sandbox",
  token,
});
```

**Valid Values**:
- `sandbox` - Testing environment (default in development)
- `production` - Live environment (use in production only)

**How to Set**:
- Development: `NEXT_PUBLIC_PADDLE_ENV=sandbox`
- Production: `NEXT_PUBLIC_PADDLE_ENV=production`

**Notes**:
- Must match the environment of your API keys and client token
- Sandbox and production have separate credentials
- Default is "sandbox" if not specified

---

## Product Price ID Variables

These variables store Paddle price IDs for different products and currencies. They are used by the frontend to initiate checkout and by the backend to map webhook events to products.

### NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY

**Variable Name**: `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY`

**Type**: Client-side (public)

**Scope**: Paddle only

**Product**: Grammar Master

**Billing**: Yearly subscription

**Currency**: Chinese Yuan (CNY)

**Required**: 
- ❌ Development (optional)
- ✅ Production (required for Chinese users)

**Purpose**: 
Paddle price ID for Grammar Master yearly subscription in Chinese Yuan.

**Location(s)**:
- `src/env.ts` - Defined in client-side environment schema
- `src/config/apps.ts` - Used in appRegistry for Grammar Master product configuration
- `src/app/[locale]/grammar-master/page.tsx` - Used in checkout button
- `src/app/[locale]/(landing)/_sections/pricing.tsx` - Used in pricing display
- `src/app/api/webhooks/paddle/route.ts` - Used to map webhook events to product

**Usage Example**:
```typescript
// src/config/apps.ts
prices: [
  {
    type: "yearly",
    currency: "CNY",
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY || "",
  },
]

// src/app/[locale]/grammar-master/page.tsx
const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY;
```

**How to Get**:
1. Log in to [Paddle Dashboard](https://dashboard.paddle.com)
2. Go to Products → Grammar Master
3. Find the yearly CNY price
4. Copy the price ID (format: `pri_xxxxx`)
5. Add to `.env.local`: `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY=pri_xxxxx`

**Notes**:
- Format: `pri_xxxxx` (Paddle price ID)
- Used for Chinese market
- Yearly billing cycle
- Mapped to productKey `grammar-master` in webhook handler

---

### NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD

**Variable Name**: `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD`

**Type**: Client-side (public)

**Scope**: Paddle only

**Product**: Grammar Master

**Billing**: Yearly subscription

**Currency**: US Dollar (USD)

**Required**: 
- ❌ Development (optional)
- ✅ Production (required for international users)

**Purpose**: 
Paddle price ID for Grammar Master yearly subscription in US Dollars.

**Location(s)**:
- `src/env.ts` - Defined in client-side environment schema
- `src/config/apps.ts` - Used in appRegistry for Grammar Master product configuration
- `src/app/[locale]/grammar-master/page.tsx` - Used in checkout button
- `src/app/[locale]/(landing)/_sections/pricing.tsx` - Used in pricing display
- `src/app/api/webhooks/paddle/route.ts` - Used to map webhook events to product

**Usage Example**:
```typescript
// src/app/[locale]/grammar-master/page.tsx
const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD;
if (!priceId) {
  setError("Purchase is not available at this time.");
  return;
}
await openCheckout({ priceId, userId: session.user.id });
```

**How to Get**:
1. Log in to [Paddle Dashboard](https://dashboard.paddle.com)
2. Go to Products → Grammar Master
3. Find the yearly USD price
4. Copy the price ID (format: `pri_xxxxx`)
5. Add to `.env.local`: `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD=pri_xxxxx`

**Notes**:
- Format: `pri_xxxxx` (Paddle price ID)
- Used for international market
- Yearly billing cycle
- Mapped to productKey `grammar-master` in webhook handler

---

### NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY

**Variable Name**: `NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY`

**Type**: Client-side (public)

**Scope**: Paddle only

**Product**: Cast Master (Broadcast Master / Prompter)

**Billing**: Yearly subscription

**Currency**: Chinese Yuan (CNY)

**Required**: 
- ❌ Development (optional)
- ✅ Production (required for Chinese users)

**Purpose**: 
Paddle price ID for Cast Master yearly subscription in Chinese Yuan.

**Location(s)**:
- `src/env.ts` - Defined in client-side environment schema
- `src/config/apps.ts` - Used in appRegistry for Cast Master product configuration
- `src/app/[locale]/cast-master/page.tsx` - Used in checkout button
- `src/app/api/webhooks/paddle/route.ts` - Used to map webhook events to product

**Usage Example**:
```typescript
// src/config/apps.ts
prices: [
  {
    type: "yearly",
    currency: "CNY",
    priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY || "",
  },
]
```

**How to Get**:
1. Log in to [Paddle Dashboard](https://dashboard.paddle.com)
2. Go to Products → Cast Master (or Prompter)
3. Find the yearly CNY price
4. Copy the price ID (format: `pri_xxxxx`)
5. Add to `.env.local`: `NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY=pri_xxxxx`

**Notes**:
- Format: `pri_xxxxx` (Paddle price ID)
- Used for Chinese market
- Yearly billing cycle
- Mapped to productKey `ai-prompter` in webhook handler

---

### NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD

**Variable Name**: `NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD`

**Type**: Client-side (public)

**Scope**: Paddle only

**Product**: Lease AI Review

**Billing**: One-time purchase

**Currency**: US Dollar (USD)

**Required**: 
- ❌ Development (optional)
- ✅ Production (required)

**Purpose**: 
Paddle price ID for Lease AI Review one-time purchase in US Dollars.

**Location(s)**:
- `src/env.ts` - Defined in client-side environment schema
- `src/config/apps.ts` - Used in appRegistry for Lease AI product configuration
- `src/app/[locale]/lease-ai/page.tsx` - Used in checkout button
- `src/app/[locale]/(landing)/_sections/pricing.tsx` - Used in pricing display
- `src/app/api/webhooks/paddle/route.ts` - Used to map webhook events to product

**Usage Example**:
```typescript
// src/app/[locale]/lease-ai/page.tsx
const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD;
if (!priceId) {
  setError("Purchase is not available at this time.");
  return;
}
await openCheckout({ priceId, userId: session.user.id });
```

**How to Get**:
1. Log in to [Paddle Dashboard](https://dashboard.paddle.com)
2. Go to Products → Lease AI Review
3. Find the one-time USD price
4. Copy the price ID (format: `pri_xxxxx`)
5. Add to `.env.local`: `NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD=pri_xxxxx`

**Notes**:
- Format: `pri_xxxxx` (Paddle price ID)
- One-time purchase (not subscription)
- USD currency
- Mapped to productKey `lease-ai` in webhook handler

---

## Experimental Backend Variables

These variables are used by the experimental FastAPI backend in `integrations/paddle-dodo/`. They are **NOT** used by the production app.

### PADDLE_ENV (Experimental)

**Variable Name**: `PADDLE_ENV`

**Type**: Server-side

**Scope**: Paddle only

**Location**: `integrations/paddle-dodo/app/config.py`

**Purpose**: 
Specifies whether the experimental backend uses Paddle's sandbox or production environment.

**Valid Values**:
- `sandbox` - Testing environment
- `live` - Production environment

**Default**: `sandbox`

**Usage Example**:
```python
# integrations/paddle-dodo/app/config.py
paddle_env: str = "sandbox"

# integrations/paddle-dodo/app/services/paddle_client.py
if self.env == "live":
    self.base_url = "https://api.paddle.com"
else:
    self.base_url = "https://sandbox-api.paddle.com"
```

**Notes**:
- Experimental code only
- Not used by production app
- Used to select correct Paddle API endpoint

---

### PADDLE_API_KEY (Experimental)

**Variable Name**: `PADDLE_API_KEY`

**Type**: Server-side (secret)

**Scope**: Paddle only

**Location**: `integrations/paddle-dodo/app/config.py`, `integrations/paddle-dodo/app/services/paddle_client.py`

**Purpose**: 
API key for the experimental backend to authenticate with Paddle API.

**Usage Example**:
```python
# integrations/paddle-dodo/app/config.py
paddle_api_key: str

# integrations/paddle-dodo/app/services/paddle_client.py
self.api_key = settings.paddle_api_key
self.session.headers.update({
    "Authorization": f"Bearer {self.api_key}",
})
```

**Notes**:
- Experimental code only
- Not used by production app
- Required for experimental backend to work

---

### PADDLE_WEBHOOK_SECRET (Experimental)

**Variable Name**: `PADDLE_WEBHOOK_SECRET`

**Type**: Server-side (secret)

**Scope**: Paddle only

**Location**: `integrations/paddle-dodo/app/config.py`

**Purpose**: 
Secret key for the experimental backend to verify webhook signatures from Paddle.

**Usage Example**:
```python
# integrations/paddle-dodo/app/config.py
paddle_webhook_secret: str | None = None
```

**Notes**:
- Experimental code only
- Not used by production app
- Webhook handler not yet implemented (`webhook_paddle.py` is empty)

---

### PADDLE_VENDOR_ID (Experimental)

**Variable Name**: `PADDLE_VENDOR_ID`

**Type**: Server-side

**Scope**: Paddle only

**Location**: `integrations/paddle-dodo/app/config.py`

**Purpose**: 
Optional Paddle vendor ID for the experimental backend (depends on Paddle API version).

**Usage Example**:
```python
# integrations/paddle-dodo/app/config.py
paddle_vendor_id: str | None = None
```

**Notes**:
- Experimental code only
- Optional (may not be needed depending on Paddle API version)
- Not used by production app

---

### PADDLE_PRICE_ID_BASIC (Experimental)

**Variable Name**: `PADDLE_PRICE_ID_BASIC`

**Type**: Server-side

**Scope**: Paddle only

**Location**: `integrations/paddle-dodo/app/config.py`

**Purpose**: 
Paddle price ID for the "Basic" plan in the experimental backend.

**Usage Example**:
```python
# integrations/paddle-dodo/app/config.py
paddle_price_id_basic: str | None = None
```

**Notes**:
- Experimental code only
- Hardcoded plan names (not dynamic like production)
- Not used by production app

---

### PADDLE_PRICE_ID_PRO (Experimental)

**Variable Name**: `PADDLE_PRICE_ID_PRO`

**Type**: Server-side

**Scope**: Paddle only

**Location**: `integrations/paddle-dodo/app/config.py`

**Purpose**: 
Paddle price ID for the "Pro" plan in the experimental backend.

**Usage Example**:
```python
# integrations/paddle-dodo/app/config.py
paddle_price_id_pro: str | None = None
```

**Notes**:
- Experimental code only
- Hardcoded plan names (not dynamic like production)
- Not used by production app

---

## Setup Checklist

### Development Environment

- [ ] Copy `.env.example` to `.env.local`
- [ ] (Optional) Add `PADDLE_API_KEY` for webhook testing
- [ ] (Optional) Add `PADDLE_WEBHOOK_SECRET` for webhook testing
- [ ] (Optional) Add `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` for checkout testing
- [ ] (Optional) Set `NEXT_PUBLIC_PADDLE_ENV=sandbox` for testing
- [ ] (Optional) Add price IDs for testing checkout

### Production Environment

- [ ] ✅ Add `PADDLE_API_KEY` (required)
- [ ] ✅ Add `PADDLE_WEBHOOK_SECRET` (required)
- [ ] ✅ Add `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (required)
- [ ] ✅ Set `NEXT_PUBLIC_PADDLE_ENV=production` (required)
- [ ] ✅ Add all price IDs:
  - `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY`
  - `NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD`
  - `NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY`
  - `NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD`
- [ ] ✅ Configure webhook endpoint in Paddle Dashboard
- [ ] ✅ Test webhook delivery
- [ ] ✅ Verify all checkout flows work

---

## Troubleshooting

### Checkout Not Working

**Symptoms**: Checkout button doesn't open or shows error

**Check**:
1. Is `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` set?
2. Is `NEXT_PUBLIC_PADDLE_ENV` set correctly?
3. Are you using the correct environment (sandbox vs production)?
4. Check browser console for errors

### Webhook Not Processing

**Symptoms**: Payment received but user doesn't get access

**Check**:
1. Is `PADDLE_WEBHOOK_SECRET` set?
2. Is webhook endpoint configured in Paddle Dashboard?
3. Check server logs for webhook errors
4. Verify webhook signature verification is working

### Price ID Not Found

**Symptoms**: "Purchase is not available at this time" error

**Check**:
1. Is the price ID environment variable set?
2. Is the price ID correct (format: `pri_xxxxx`)?
3. Is the price ID for the correct environment (sandbox vs production)?
4. Does the price exist in Paddle Dashboard?

---

## References

- **Paddle Documentation**: https://developer.paddle.com/
- **Paddle Dashboard**: https://dashboard.paddle.com
- **Production Webhook Handler**: `src/app/api/webhooks/paddle/route.ts`
- **Price Mappings**: `src/lib/paddle-mappings.ts`
- **App Registry**: `src/config/apps.ts`
- **Experimental Backend**: `integrations/paddle-dodo/`

---

## Related Documentation

- **README**: `integrations/paddle-dodo/README.md` - Overview of experimental code
- **Notes**: `integrations/paddle-dodo/notes.md` - TODOs and risks
- **Environment Variables**: `docs/ENVIRONMENT_VARIABLES.md` - All app environment variables
