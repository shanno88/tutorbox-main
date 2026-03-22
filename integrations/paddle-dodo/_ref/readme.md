# Paddle/DoDo Integration Experiments

## Overview

This folder contains **experimental code and helper scripts** for Paddle and DoDo payment integrations. It is **NOT production code**.

### What This Folder Is For

- **Experiments**: Testing Paddle API integration patterns, webhook handling, and subscription flows
- **Helper Scripts**: Python utilities for testing, debugging, and local development
- **Documentation**: Phase-by-phase guides showing incremental development of payment features
- **Reference**: Examples of how to structure payment backends with FastAPI

### What This Folder Is NOT

- **Not production code**: The real webhook handlers live in the main app (see below)
- **Not deployed**: This FastAPI backend is for local development and testing only
- **Not the source of truth**: Production payment logic is in `src/app/api/webhooks/paddle/route.ts`

---

## Production Webhook Handlers

The **real** payment webhook handlers that process Paddle events are located in the main Tutorbox app:

- **Paddle Webhooks**: `src/app/api/webhooks/paddle/route.ts`
  - Handles `subscription.activated`, `subscription.updated`, `subscription.canceled`
  - Handles `transaction.completed` (one-time purchases)
  - Uses `getProductKeyFromPriceId()` from `src/lib/paddle-mappings.ts` to map price IDs to product keys
  - Updates `productGrants` table in the main database

### Key Difference

| Aspect | Experimental (This Folder) | Production |
|--------|---------------------------|-----------|
| **Location** | `integrations/paddle-dodo/` | `src/app/api/webhooks/paddle/route.ts` |
| **Language** | Python (FastAPI) | TypeScript (Next.js) |
| **Database** | SQLite (local) | Drizzle ORM + main DB |
| **Purpose** | Learning, testing, prototyping | Handles real payment events |
| **Deployment** | Local dev only | Production |

---

## High-Level Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Purchases on Paddle Checkout                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Paddle Sends Webhook Event                                  │
│ (subscription.activated, transaction.completed, etc.)       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Production Webhook Handler                                  │
│ src/app/api/webhooks/paddle/route.ts                        │
│                                                             │
│ 1. Verify webhook signature                                │
│ 2. Extract priceId from event                              │
│ 3. Map priceId → productKey using paddle-mappings.ts       │
│ 4. Update productGrants table                              │
│ 5. Log results                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ User Gets Access to Product                                │
│ (via productGrants table)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
integrations/paddle-dodo/
├── README.md                          # This file
├── notes.md                           # TODOs, risks, and warnings
├── readme.md                          # Original Chinese documentation (legacy)
│
├── app/                               # FastAPI backend (experimental)
│   ├── main.py                        # FastAPI app entry point
│   ├── config.py                      # Configuration (env vars)
│   ├── db.py                          # SQLAlchemy setup
│   ├── models.py                      # Database models (User, Plan, Subscription)
│   ├── schemas.py                     # Pydantic schemas
│   ├── deps.py                        # Dependencies (JWT, auth)
│   │
│   ├── routes/
│   │   ├── auth.py                    # User registration/login
│   │   ├── plans.py                   # Plan management
│   │   ├── billing.py                 # Subscription queries
│   │   ├── practice.py                # Practice routes
│   │   ├── webhook_paddle.py          # ⚠️ EMPTY - not implemented
│   │   └── dodo/                      # DoDo product routes
│   │       └── __init__.py            # Free/Pro access control
│   │
│   ├── services/
│   │   ├── paddle_client.py           # Paddle API client (incomplete)
│   │   └── subscriptions.py           # Subscription logic
│   │
│   └── dependencies/
│       └── subscriptions.py           # Permission checks (get_current_user, require_pro_subscription)
│
├── python/                            # Python utility scripts (if any)
│
├── tests/                             # Test scripts
│   ├── test_auth.py
│   ├── test_dodo_routes.py
│   ├── test_phase4_complete.py
│   ├── test_pro_route.py
│   ├── test_subscriptions.py
│   └── curl_examples.sh               # cURL examples for manual testing
│
├── PHASE_*.md                         # Phase-by-phase development guides
│   ├── PHASE_2_GUIDE.md
│   ├── PHASE_2_SUMMARY.md
│   ├── PHASE_3_GUIDE.md
│   ├── PHASE_3_SUMMARY.md
│   ├── PHASE_4_GUIDE.md
│   └── PHASE_4_SUMMARY.md
│
├── requirements.txt                   # Python dependencies
├── .env.example                       # Environment variables template
├── .env                               # Local environment (git-ignored)
├── app.db                             # SQLite database (git-ignored)
└── tree.txt                           # Directory tree snapshot
```

---

## Quick Start (Local Development)

### Prerequisites

- Python 3.8+ (3.10/3.11 recommended)
- pip or uv package manager

### Setup

```bash
cd integrations/paddle-dodo

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your Paddle credentials (optional for local testing)
```

### Run the Server

```bash
uvicorn app.main:app --reload
```

The server will start at `http://127.0.0.1:8000`

- **Health check**: `http://127.0.0.1:8000/health`
- **API docs**: `http://127.0.0.1:8000/docs` (Swagger UI)

### Test Endpoints

See `curl_examples.sh` for cURL examples, or use the Swagger UI at `/docs`.

---

## Key Files to Understand

### Production Reference

- **`src/lib/paddle-mappings.ts`** (main app)
  - Generates dynamic price ID → product key mappings from `appRegistry`
  - Used by production webhook handler to identify which product was purchased

- **`src/app/api/webhooks/paddle/route.ts`** (main app)
  - Production webhook handler
  - Verifies Paddle signature
  - Maps price IDs to product keys
  - Updates `productGrants` table

### Experimental Code

- **`app/routes/webhook_paddle.py`** ⚠️
  - **EMPTY** - not implemented
  - This is where webhook handling would go in the experimental backend
  - See production handler for reference on what should be implemented

- **`app/services/paddle_client.py`**
  - Incomplete Paddle API client
  - Uses pseudo-code structure
  - Needs to be updated based on actual Paddle API version

- **`app/config.py`**
  - Hardcoded JWT secret (change in production)
  - Hardcoded price IDs (should be dynamic like production)

---

## Important Warnings

### ⚠️ Do NOT Use Directly in Production

1. **Webhook validation is incomplete**
   - `webhook_paddle.py` is empty
   - No signature verification implemented
   - See production handler for proper implementation

2. **Security issues**
   - JWT secret is hardcoded in `config.py`
   - No rate limiting
   - No input validation on some endpoints
   - Database is SQLite (not suitable for production)

3. **Incomplete implementations**
   - `paddle_client.py` uses pseudo-code
   - Paddle API endpoints may not match actual API
   - Error handling is minimal

4. **Hardcoded values**
   - Price IDs are hardcoded in `.env`
   - Should use dynamic mapping like production (see `paddle-mappings.ts`)

5. **No audit logging**
   - Payment events are not logged for compliance
   - No way to trace payment history

### ✅ Safe to Use For

- Local development and testing
- Learning how payment integrations work
- Prototyping new features
- Understanding the flow before implementing in production

---

## Next Steps

### To Implement Production Webhook Handler

1. **Reference the production handler**: `src/app/api/webhooks/paddle/route.ts`
2. **Use the mapping system**: `src/lib/paddle-mappings.ts`
3. **Verify signatures**: Use `verifyPaddleWebhook()` from `src/lib/paddle-server`
4. **Update database**: Use Drizzle ORM to update `productGrants` table
5. **Add logging**: Log all webhook events for debugging and compliance

### To Extend This Experimental Backend

1. Implement `webhook_paddle.py` with proper signature verification
2. Complete `paddle_client.py` based on actual Paddle API docs
3. Add more test scripts for different scenarios
4. Add database persistence for projects and workflows
5. Implement caching for performance

---

## Related Documentation

- **Phase Guides**: See `PHASE_*.md` files for step-by-step development
- **Environment Variables**: See `.env.example` for configuration options
- **Original Chinese Docs**: See `readme.md` (legacy)
- **Production Webhook**: See `src/app/api/webhooks/paddle/route.ts` in main app
- **Price Mappings**: See `src/lib/paddle-mappings.ts` in main app

---

## Questions?

- Check `notes.md` for known issues and TODOs
- Review the PHASE guides for context on what's been implemented
- Look at test scripts for usage examples
- Compare with production handler for best practices
