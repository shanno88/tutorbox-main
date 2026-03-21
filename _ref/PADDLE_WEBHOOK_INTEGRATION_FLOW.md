# Paddle Webhook Integration Flow – Complete

## End-to-End Payment Processing

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PADDLE WEBHOOK EVENT                             │
│                                                                           │
│  POST /api/webhooks/paddle                                              │
│  {                                                                        │
│    "event_type": "subscription.activated",                              │
│    "data": {                                                             │
│      "id": "sub_123",                                                   │
│      "status": "active",                                                │
│      "items": [{ "price": { "id": "pri_01khwk19y0af40zae5fnysj5t3" }}],│
│      "custom_data": { "userId": "user_123" },                           │
│      "customer": { "email": "user@example.com" }                        │
│    }                                                                      │
│  }                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    WEBHOOK ROUTE HANDLER                                 │
│              src/app/api/webhooks/paddle/route.ts                       │
│                                                                           │
│  1. Verify webhook signature (PADDLE_WEBHOOK_SECRET)                    │
│  2. Parse event as PaddleWebhookPayload                                 │
│  3. Check event type (subscription.activated, transaction.completed)    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  EVENT TYPE VALIDATION                                   │
│         src/lib/billing/paddleWebhookHandler.ts                         │
│                                                                           │
│  isPaddleSubscriptionActivated(payload)                                 │
│    ↓                                                                      │
│    Check: event_type in [                                               │
│      'subscription.activated',                                          │
│      'subscription.updated',                                            │
│      'subscription.trialing'                                            │
│    ]                                                                      │
│    ↓                                                                      │
│    Check: status in ['active', 'trialing']                              │
│    ↓                                                                      │
│    Returns: true/false                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                            (if true, continue)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              SUBSCRIPTION DESCRIPTOR EXTRACTION                          │
│         src/lib/billing/paddleWebhookHandler.ts                         │
│                                                                           │
│  extractPaddleSubscriptionDescriptor(payload)                           │
│                                                                           │
│  Step 1: Extract Price ID                                              │
│    payload.data.items[0].price.id                                       │
│    → "pri_01khwk19y0af40zae5fnysj5t3"                                   │
│                                                                           │
│  Step 2: Map Price ID → Product Key                                    │
│    getProductKeyFromPaddlePriceId("pri_01khwk19y0af40zae5fnysj5t3")    │
│    → "grammar-master"                                                   │
│                                                                           │
│  Step 3: Map Product Key → Plan Slug                                   │
│    getPlanSlugsForProduct("grammar-master")                             │
│    → ["grammar-master-yearly-usd", "grammar-master-yearly-cny"]        │
│    → Pick first: "grammar-master-yearly-usd"                           │
│                                                                           │
│  Step 4: Extract User Identifier                                       │
│    payload.data.custom_data.userId || payload.data.customer.email      │
│    → "user_123" (or "user@example.com" if userId not provided)         │
│                                                                           │
│  Step 5: Extract Subscription ID                                       │
│    payload.data.id                                                       │
│    → "sub_123"                                                          │
│                                                                           │
│  Step 6: Map Subscription Status                                       │
│    mapPaddleStatusToInternal("active")                                  │
│    → "active"                                                           │
│                                                                           │
│  Step 7: Return SubscriptionDescriptor                                  │
│    {                                                                      │
│      provider: "paddle",                                                │
│      providerSubscriptionId: "sub_123",                                 │
│      userId: "user_123",                                                │
│      productKey: "grammar-master",                                      │
│      planSlug: "grammar-master-yearly-usd",                             │
│      status: "active"                                                   │
│    }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    (if descriptor is null, return 200 OK)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  PAYMENT HANDLING                                        │
│         src/lib/billing/issueKeyFromWebhook.ts                          │
│                                                                           │
│  handleSuccessfulPayment({                                              │
│    provider: "paddle",                                                  │
│    rawEvent: event,                                                     │
│    priceId: "pri_01khwk19y0af40zae5fnysj5t3",                           │
│    productKey: "grammar-master",                                        │
│    userIdentifier: "user_123",                                          │
│    subscriptionId: "sub_123"                                            │
│  })                                                                       │
│                                                                           │
│  Step 1: Lookup User ID from Email                                     │
│    db.query.users.findFirst({ where: eq(users.email, "user_123") })    │
│    → userId: "user_123"                                                 │
│                                                                           │
│  Step 2: Map Product Key → Plan Slug                                   │
│    mapProductKeyToPlanSlug("grammar-master")                            │
│    → "grammar-master-yearly-usd"                                        │
│                                                                           │
│  Step 3: Lookup Plan from Database                                     │
│    db.query.plans.findFirst({ where: eq(plans.slug, "...") })          │
│    → plan: { id: 1, slug: "grammar-master-yearly-usd", ... }           │
│                                                                           │
│  Step 4: Generate API Key                                              │
│    generateApiKey()                                                      │
│    → "tutorbox_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"                       │
│                                                                           │
│  Step 5: Hash API Key                                                  │
│    hashApiKey(apiKey)                                                   │
│    → SHA-256 hash                                                       │
│                                                                           │
│  Step 6: Store in Database                                             │
│    db.insert(apiKeys).values({                                          │
│      userId: "user_123",                                                │
│      planId: 1,                                                         │
│      keyHash: "...",                                                    │
│      status: "active"                                                   │
│    })                                                                     │
│                                                                           │
│  Step 7: Log Payment Success                                           │
│    logPaymentSuccess({                                                  │
│      provider: "paddle",                                                │
│      userId: "user_123",                                                │
│      productKey: "grammar-master",                                      │
│      planSlug: "grammar-master-yearly-usd",                             │
│      priceId: "pri_01khwk19y0af40zae5fnysj5t3",                         │
│      subscriptionId: "sub_123",                                         │
│      apiKeyId: 42                                                       │
│    })                                                                     │
│                                                                           │
│  Returns: {                                                              │
│    success: true,                                                       │
│    userId: "user_123",                                                  │
│    planSlug: "grammar-master-yearly-usd",                               │
│    apiKeyId: 42                                                         │
│  }                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  LEGACY SUPPORT (BACKWARD COMPATIBILITY)                │
│         src/app/api/webhooks/paddle/route.ts                            │
│                                                                           │
│  Update productGrants table:                                            │
│    db.insert(productGrants).values({                                    │
│      userId: "user_123",                                                │
│      productKey: "grammar-master",                                      │
│      type: "paid",                                                      │
│      status: "active"                                                   │
│    })                                                                     │
│                                                                           │
│  (This is for backward compatibility and will be removed later)         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    WEBHOOK RESPONSE                                      │
│                                                                           │
│  Return 200 OK to Paddle                                                │
│  (Prevents Paddle from retrying the webhook)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
Paddle Webhook
    │
    ├─→ Signature Verification
    │       └─→ PADDLE_WEBHOOK_SECRET
    │
    ├─→ Event Type Checking
    │       ├─→ isPaddleSubscriptionActivated()
    │       └─→ isPaddleTransactionCompleted()
    │
    ├─→ Subscription Descriptor Extraction
    │       ├─→ Extract Price ID
    │       │       └─→ payload.data.items[0].price.id
    │       │
    │       ├─→ Map Price ID → Product Key
    │       │       └─→ src/lib/billing/priceMaps.ts
    │       │           └─→ paddlePriceIdToProductKey
    │       │
    │       ├─→ Map Product Key → Plan Slug
    │       │       └─→ src/lib/billing/priceMaps.ts
    │       │           └─→ productKeyToPlanSlugs
    │       │
    │       ├─→ Extract User Identifier
    │       │       └─→ userId or email
    │       │
    │       ├─→ Extract Subscription ID
    │       │       └─→ payload.data.id
    │       │
    │       └─→ Map Status
    │               └─→ mapPaddleStatusToInternal()
    │
    ├─→ Payment Handling
    │       ├─→ Lookup User ID
    │       │       └─→ db.query.users
    │       │
    │       ├─→ Lookup Plan
    │       │       └─→ db.query.plans
    │       │
    │       ├─→ Generate API Key
    │       │       └─→ generateApiKey()
    │       │
    │       ├─→ Hash API Key
    │       │       └─→ hashApiKey()
    │       │
    │       ├─→ Store in Database
    │       │       └─→ db.insert(apiKeys)
    │       │
    │       └─→ Log Payment
    │               └─→ logPaymentSuccess()
    │
    ├─→ Legacy Support
    │       └─→ Update productGrants table
    │
    └─→ Return 200 OK
```

## Module Dependencies

```
paddleWebhookHandler.ts
    ├─→ model.ts (types)
    │       ├─→ SubscriptionDescriptor
    │       ├─→ SubscriptionStatus
    │       ├─→ ProductKey
    │       └─→ PlanSlug
    │
    └─→ priceMaps.ts (mappings)
            ├─→ getProductKeyFromPaddlePriceId()
            └─→ getPlanSlugsForProduct()

paddle/route.ts (webhook handler)
    ├─→ paddleWebhookHandler.ts
    │       ├─→ isPaddleSubscriptionActivated()
    │       ├─→ isPaddleTransactionCompleted()
    │       └─→ extractPaddleSubscriptionDescriptor()
    │
    ├─→ issueKeyFromWebhook.ts
    │       └─→ handleSuccessfulPayment()
    │
    └─→ db/schema.ts
            ├─→ productGrants
            └─→ apiKeys
```

## Error Handling Flow

```
Paddle Webhook Event
    │
    ├─→ Signature Invalid?
    │       └─→ Return 400 (Invalid signature)
    │
    ├─→ Event Type Not Recognized?
    │       └─→ Return 200 OK (ignore)
    │
    ├─→ Extraction Failed?
    │       ├─→ Missing Price ID?
    │       │       └─→ Log warning, Return 200 OK
    │       │
    │       ├─→ Unknown Price ID?
    │       │       └─→ Log error with instructions, Return 200 OK
    │       │
    │       ├─→ Missing User Identifier?
    │       │       └─→ Log warning, Return 200 OK
    │       │
    │       ├─→ No Plan Slugs?
    │       │       └─→ Log warning, Return 200 OK
    │       │
    │       └─→ Unknown Status?
    │               └─→ Log warning, Return 200 OK
    │
    ├─→ Payment Handling Failed?
    │       ├─→ User Not Found?
    │       │       └─→ Log error, Return 200 OK
    │       │
    │       ├─→ Plan Not Found?
    │       │       └─→ Log error, Return 200 OK
    │       │
    │       └─→ API Key Generation Failed?
    │               └─→ Log error, Return 200 OK
    │
    └─→ Success!
            └─→ Return 200 OK
```

## Key Design Decisions

### 1. Conservative Error Handling
- If anything is missing or unknown, return null
- Always return 200 OK to Paddle (prevents retries)
- Log all errors for debugging

### 2. Pure Functions
- No database queries in extraction
- No HTTP calls in extraction
- Easy to test and reason about

### 3. Centralized Mappings
- All price ID mappings in one place
- Easy to add new products/plans
- Single source of truth

### 4. Type Safety
- Full TypeScript support
- Type guards for runtime validation
- No `any` types

### 5. Backward Compatibility
- Still update productGrants table
- Will be removed once fully migrated
- Allows gradual transition

## Testing Scenarios

### Scenario 1: Successful Subscription Activation
```
Input: subscription.activated event with valid price ID and user email
Expected: API key generated and stored
Result: ✅ User gets access
```

### Scenario 2: Unknown Price ID
```
Input: subscription.activated event with unknown price ID
Expected: Extraction fails, returns null
Result: ✅ No access granted, error logged
```

### Scenario 3: Missing User Identifier
```
Input: subscription.activated event without userId or email
Expected: Extraction fails, returns null
Result: ✅ No access granted, warning logged
```

### Scenario 4: One-Time Purchase
```
Input: transaction.completed event with valid price ID
Expected: API key generated and stored
Result: ✅ User gets access
```

### Scenario 5: Subscription Renewal
```
Input: subscription.updated event for existing user
Expected: API key status updated to active
Result: ✅ User maintains access
```

---

**Last Updated**: March 20, 2026
**Status**: Production Ready
