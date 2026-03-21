<<<<<<< HEAD
# Anonymous 30-Minute Trial System

## Overview

The anonymous trial system allows new visitors to use Grammar Master and Broadcast Master (Cast Master) immediately without signing up, for a 30-minute time window. After the trial expires, users are prompted to sign up for a full 3-day account-based trial.

## Key Features

- **Instant Access**: No signup required to start using the tools
- **30-Minute Window**: Configurable trial duration (default: 30 minutes)
- **Tamper-Resistant**: Uses signed JWT tokens to prevent manipulation
- **Seamless Transition**: After signup, users move to account-based 3-day trial
- **Bilingual Support**: English and Chinese UI
- **Real-Time Countdown**: Shows remaining time in banner
- **Graceful Expiry**: Modal prompts users to sign up when trial ends

## Architecture

### Client-Side

**Hook**: `useAnonymousTrial(product)`
- Manages trial state
- Auto-starts trial on first visit
- Provides access control logic
- Handles countdown and expiry

**Components**:
- `AnonymousTrialGuard` - Wraps product pages, handles access control
- `AnonymousTrialBanner` - Shows countdown timer
- `AnonymousTrialExpiredModal` - Prompts signup when expired

### Server-Side

**Library**: `src/lib/anonymous-trial.ts`
- Creates and signs JWT tokens
- Verifies trial state
- Manages cookie storage
- Checks access permissions

**API Routes**:
- `GET /api/anonymous-trial/state` - Get current trial state
- `POST /api/anonymous-trial/start` - Start new trial
- `POST /api/anonymous-trial/mark-seen` - Mark modal as seen
- `POST /api/anonymous-trial/increment` - Increment action count

### Configuration

**File**: `src/config/anonymous-trial.ts`

```typescript
{
  durationMinutes: 30, // Configurable via NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES
  supportedProducts: ["grammar-master", "cast-master"],
  maxActions: {
    "grammar-master": 10,
    "cast-master": 5,
  },
}
```

## Trial State Structure

```typescript
interface AnonymousTrialState {
  type: "anonymous_30min";
  startTimestamp: number; // Unix timestamp (ms)
  expiryTimestamp: number; // Unix timestamp (ms)
  hasSeenExpiredModal: boolean;
  actionsUsed: {
    "grammar-master"?: number;
    "cast-master"?: number;
  };
}
```

## Usage

### Wrap Product Page

```tsx
import { AnonymousTrialGuard } from "@/components/anonymous-trial-guard";

export default function GrammarMasterPage() {
  return (
    <AnonymousTrialGuard
      product="grammar-master"
      productName="Grammar Master"
      productNameCN="语法大师"
      locale="zh"
      autoStart={true}
      showBanner={true}
      blockOnExpired={false}
    >
      {/* Your product content */}
    </AnonymousTrialGuard>
  );
}
```

### Check Access in API Routes

```typescript
import { checkAnonymousAccess } from "@/lib/anonymous-trial";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);
  const isAuthenticated = !!session?.user;

  const access = await checkAnonymousAccess(isAuthenticated, "grammar-master");

  if (!access.hasAccess) {
    return NextResponse.json(
      { error: "Trial expired" },
      { status: 403 }
    );
  }

  // Allow access
  return NextResponse.json({ ok: true });
}
```

### Use Hook in Components

```tsx
import { useAnonymousTrial } from "@/hooks/use-anonymous-trial";

function MyComponent() {
  const {
    hasAccess,
    isExpired,
    minutesRemaining,
    isAuthenticated,
    startTrial,
  } = useAnonymousTrial("grammar-master");

  if (!hasAccess) {
    return <div>Trial expired. Please sign up.</div>;
  }

  return <div>Time remaining: {minutesRemaining} minutes</div>;
}
```

## Configuration

### Environment Variables

```bash
# .env.local or .env.production
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=30  # Default: 30 minutes
NEXTAUTH_SECRET=your-secret-key         # Required for JWT signing
```

### Adjust Trial Duration

Change in `.env`:
```bash
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=45  # 45 minutes
```

Or modify config directly:
```typescript
// src/config/anonymous-trial.ts
export const ANONYMOUS_TRIAL_CONFIG = {
  durationMinutes: 45, // Change here
  // ...
};
```

### Add Usage Limits (Future)

```typescript
// src/config/anonymous-trial.ts
maxActions: {
  "grammar-master": 10, // Max 10 grammar checks
  "cast-master": 5,     // Max 5 broadcasts
},
```

Then check in API:
```typescript
const state = await getAnonymousTrialState();
const actionsUsed = state?.actionsUsed["grammar-master"] || 0;

if (actionsUsed >= 10) {
  return NextResponse.json(
    { error: "Action limit reached" },
    { status: 429 }
  );
}

await incrementAnonymousTrialAction("grammar-master");
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User visits Grammar Master / Cast Master page               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │ Authenticated? │
            └────┬───────┬───┘
                 │       │
            Yes  │       │ No
                 │       │
                 ▼       ▼
         ┌───────────┐  ┌──────────────────┐
         │ Use       │  │ Check anonymous  │
         │ account   │  │ trial cookie     │
         │ trial     │  └────┬─────────────┘
         └───────────┘       │
                             ▼
                    ┌────────────────┐
                    │ Trial exists?  │
                    └────┬───────┬───┘
                         │       │
                    Yes  │       │ No
                         │       │
                         ▼       ▼
                ┌────────────┐  ┌──────────────┐
                │ Expired?   │  │ Auto-start   │
                └──┬─────┬───┘  │ new trial    │
                   │     │      └──────────────┘
              Yes  │     │ No
                   │     │
                   ▼     ▼
         ┌──────────┐  ┌──────────────────┐
         │ Show     │  │ Show banner      │
         │ expired  │  │ Allow access     │
         │ modal    │  │ (30 min timer)   │
         └──────────┘  └──────────────────┘
```

## Security

### JWT Token Signing

Tokens are signed using HS256 with `NEXTAUTH_SECRET`:

```typescript
const token = await new SignJWT({ ...state })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime(expiryTime)
  .sign(SECRET_KEY);
```

### Cookie Security

```typescript
{
  httpOnly: false,  // Need client-side access
  secure: true,     // HTTPS only in production
  sameSite: "lax",  // CSRF protection
  maxAge: 30 days,  // Longer than trial to track "seen" state
}
```

### Tampering Prevention

- JWT signature prevents modification
- Expiry timestamp is server-verified
- Cookie is re-validated on every request
- Invalid tokens are rejected

## Testing

### Manual Testing

1. **Start Trial**:
   ```bash
   # Visit product page
   open http://localhost:3000/products/grammar-master
   
   # Check cookie
   document.cookie
   ```

2. **Check State**:
   ```bash
   curl http://localhost:3000/api/anonymous-trial/state
   ```

3. **Simulate Expiry**:
   ```typescript
   // Temporarily change duration to 1 minute
   NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=1
   ```

### Unit Tests

```bash
npm test src/lib/__tests__/anonymous-trial.test.ts
```

### Integration Tests

See `src/lib/__tests__/anonymous-trial-integration.test.ts`

## Transition to Account Trial

When user signs up after anonymous trial:

1. User clicks "Sign Up" in expired modal
2. Redirected to `/en/login?redirect=/products/grammar-master`
3. After email verification and login:
   - `isAuthenticated` becomes `true`
   - Anonymous trial logic is bypassed
   - Account-based 7-day trial starts automatically
   - User gets full access via `checkUserAccess()`

## Monitoring

### Check Trial Usage

```sql
-- Count active anonymous trials (via cookie analysis)
-- Note: Anonymous trials are cookie-based, not in database
```

### Track Conversions

```typescript
// Add analytics event when trial starts
await startAnonymousTrial();
analytics.track("anonymous_trial_started", {
  product: "grammar-master",
  duration: 30,
});

// Track when user signs up after trial
analytics.track("anonymous_trial_converted", {
  product: "grammar-master",
  timeUsed: minutesUsed,
});
```

## Troubleshooting

### Trial Not Starting

1. Check cookie is being set:
   ```javascript
   document.cookie
   ```

2. Verify API response:
   ```bash
   curl -X POST http://localhost:3000/api/anonymous-trial/start \
     -H "Content-Type: application/json" \
     -d '{"product":"grammar-master"}'
   ```

3. Check browser console for errors

### Trial Expires Immediately

1. Verify `NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES` is set correctly
2. Check system time is accurate
3. Verify JWT signing is working:
   ```typescript
   const state = await getAnonymousTrialState();
   console.log(state);
   ```

### Modal Not Showing

1. Check `hasSeenExpiredModal` flag:
   ```bash
   curl http://localhost:3000/api/anonymous-trial/state
   ```

2. Clear cookie and retry:
   ```javascript
   document.cookie = "tutorbox_anon_trial=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
   ```

## Future Enhancements

- [ ] Usage-based limits (max actions per trial)
- [ ] A/B testing different trial durations
- [ ] Analytics dashboard for trial metrics
- [ ] Email capture before trial starts
- [ ] Progressive disclosure (show signup prompt at 50% time)
- [ ] Trial extension for engaged users
- [ ] Device fingerprinting to prevent abuse
- [ ] Rate limiting on trial creation

## API Reference

### `useAnonymousTrial(product)`

**Parameters**:
- `product`: `"grammar-master" | "cast-master"`

**Returns**:
```typescript
{
  trialState: AnonymousTrialState | null;
  isLoading: boolean;
  hasAccess: boolean;
  isExpired: boolean;
  minutesRemaining: number;
  isAuthenticated: boolean;
  startTrial: () => Promise<void>;
  markModalAsSeen: () => Promise<void>;
  incrementAction: (product) => Promise<void>;
  refreshState: () => Promise<void>;
}
```

### `checkAnonymousAccess(isAuthenticated, product)`

**Parameters**:
- `isAuthenticated`: `boolean`
- `product`: `"grammar-master" | "cast-master"`

**Returns**:
```typescript
{
  hasAccess: boolean;
  reason: "anonymous_trial" | "authenticated" | "expired" | "not_started";
  trialState?: AnonymousTrialState;
  minutesRemaining?: number;
}
```

## Files Reference

### Core Files
- `src/config/anonymous-trial.ts` - Configuration
- `src/lib/anonymous-trial.ts` - Server-side logic
- `src/hooks/use-anonymous-trial.ts` - Client-side hook

### Components
- `src/components/anonymous-trial-guard.tsx` - Page wrapper
- `src/components/anonymous-trial-banner.tsx` - Countdown banner
- `src/components/anonymous-trial-expired-modal.tsx` - Expiry modal

### API Routes
- `src/app/api/anonymous-trial/state/route.ts`
- `src/app/api/anonymous-trial/start/route.ts`
- `src/app/api/anonymous-trial/mark-seen/route.ts`
- `src/app/api/anonymous-trial/increment/route.ts`

### Updated Files
- `src/app/products/grammar-master/page.tsx`
- `src/app/api/grammar/access/route.ts`
- `src/app/api/teleprompter/access/route.ts`
=======
# Anonymous 30-Minute Trial System

## Overview

The anonymous trial system allows new visitors to use Grammar Master and Broadcast Master (Cast Master) immediately without signing up, for a 30-minute time window. After the trial expires, users are prompted to sign up for a full 3-day account-based trial.

## Key Features

- **Instant Access**: No signup required to start using the tools
- **30-Minute Window**: Configurable trial duration (default: 30 minutes)
- **Tamper-Resistant**: Uses signed JWT tokens to prevent manipulation
- **Seamless Transition**: After signup, users move to account-based 3-day trial
- **Bilingual Support**: English and Chinese UI
- **Real-Time Countdown**: Shows remaining time in banner
- **Graceful Expiry**: Modal prompts users to sign up when trial ends

## Architecture

### Client-Side

**Hook**: `useAnonymousTrial(product)`
- Manages trial state
- Auto-starts trial on first visit
- Provides access control logic
- Handles countdown and expiry

**Components**:
- `AnonymousTrialGuard` - Wraps product pages, handles access control
- `AnonymousTrialBanner` - Shows countdown timer
- `AnonymousTrialExpiredModal` - Prompts signup when expired

### Server-Side

**Library**: `src/lib/anonymous-trial.ts`
- Creates and signs JWT tokens
- Verifies trial state
- Manages cookie storage
- Checks access permissions

**API Routes**:
- `GET /api/anonymous-trial/state` - Get current trial state
- `POST /api/anonymous-trial/start` - Start new trial
- `POST /api/anonymous-trial/mark-seen` - Mark modal as seen
- `POST /api/anonymous-trial/increment` - Increment action count

### Configuration

**File**: `src/config/anonymous-trial.ts`

```typescript
{
  durationMinutes: 30, // Configurable via NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES
  supportedProducts: ["grammar-master", "cast-master"],
  maxActions: {
    "grammar-master": 10,
    "cast-master": 5,
  },
}
```

## Trial State Structure

```typescript
interface AnonymousTrialState {
  type: "anonymous_30min";
  startTimestamp: number; // Unix timestamp (ms)
  expiryTimestamp: number; // Unix timestamp (ms)
  hasSeenExpiredModal: boolean;
  actionsUsed: {
    "grammar-master"?: number;
    "cast-master"?: number;
  };
}
```

## Usage

### Wrap Product Page

```tsx
import { AnonymousTrialGuard } from "@/components/anonymous-trial-guard";

export default function GrammarMasterPage() {
  return (
    <AnonymousTrialGuard
      product="grammar-master"
      productName="Grammar Master"
      productNameCN="语法大师"
      locale="zh"
      autoStart={true}
      showBanner={true}
      blockOnExpired={false}
    >
      {/* Your product content */}
    </AnonymousTrialGuard>
  );
}
```

### Check Access in API Routes

```typescript
import { checkAnonymousAccess } from "@/lib/anonymous-trial";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);
  const isAuthenticated = !!session?.user;

  const access = await checkAnonymousAccess(isAuthenticated, "grammar-master");

  if (!access.hasAccess) {
    return NextResponse.json(
      { error: "Trial expired" },
      { status: 403 }
    );
  }

  // Allow access
  return NextResponse.json({ ok: true });
}
```

### Use Hook in Components

```tsx
import { useAnonymousTrial } from "@/hooks/use-anonymous-trial";

function MyComponent() {
  const {
    hasAccess,
    isExpired,
    minutesRemaining,
    isAuthenticated,
    startTrial,
  } = useAnonymousTrial("grammar-master");

  if (!hasAccess) {
    return <div>Trial expired. Please sign up.</div>;
  }

  return <div>Time remaining: {minutesRemaining} minutes</div>;
}
```

## Configuration

### Environment Variables

```bash
# .env.local or .env.production
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=30  # Default: 30 minutes
NEXTAUTH_SECRET=your-secret-key         # Required for JWT signing
```

### Adjust Trial Duration

Change in `.env`:
```bash
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=45  # 45 minutes
```

Or modify config directly:
```typescript
// src/config/anonymous-trial.ts
export const ANONYMOUS_TRIAL_CONFIG = {
  durationMinutes: 45, // Change here
  // ...
};
```

### Add Usage Limits (Future)

```typescript
// src/config/anonymous-trial.ts
maxActions: {
  "grammar-master": 10, // Max 10 grammar checks
  "cast-master": 5,     // Max 5 broadcasts
},
```

Then check in API:
```typescript
const state = await getAnonymousTrialState();
const actionsUsed = state?.actionsUsed["grammar-master"] || 0;

if (actionsUsed >= 10) {
  return NextResponse.json(
    { error: "Action limit reached" },
    { status: 429 }
  );
}

await incrementAnonymousTrialAction("grammar-master");
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User visits Grammar Master / Cast Master page               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │ Authenticated? │
            └────┬───────┬───┘
                 │       │
            Yes  │       │ No
                 │       │
                 ▼       ▼
         ┌───────────┐  ┌──────────────────┐
         │ Use       │  │ Check anonymous  │
         │ account   │  │ trial cookie     │
         │ trial     │  └────┬─────────────┘
         └───────────┘       │
                             ▼
                    ┌────────────────┐
                    │ Trial exists?  │
                    └────┬───────┬───┘
                         │       │
                    Yes  │       │ No
                         │       │
                         ▼       ▼
                ┌────────────┐  ┌──────────────┐
                │ Expired?   │  │ Auto-start   │
                └──┬─────┬───┘  │ new trial    │
                   │     │      └──────────────┘
              Yes  │     │ No
                   │     │
                   ▼     ▼
         ┌──────────┐  ┌──────────────────┐
         │ Show     │  │ Show banner      │
         │ expired  │  │ Allow access     │
         │ modal    │  │ (30 min timer)   │
         └──────────┘  └──────────────────┘
```

## Security

### JWT Token Signing

Tokens are signed using HS256 with `NEXTAUTH_SECRET`:

```typescript
const token = await new SignJWT({ ...state })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime(expiryTime)
  .sign(SECRET_KEY);
```

### Cookie Security

```typescript
{
  httpOnly: false,  // Need client-side access
  secure: true,     // HTTPS only in production
  sameSite: "lax",  // CSRF protection
  maxAge: 30 days,  // Longer than trial to track "seen" state
}
```

### Tampering Prevention

- JWT signature prevents modification
- Expiry timestamp is server-verified
- Cookie is re-validated on every request
- Invalid tokens are rejected

## Testing

### Manual Testing

1. **Start Trial**:
   ```bash
   # Visit product page
   open http://localhost:3000/products/grammar-master
   
   # Check cookie
   document.cookie
   ```

2. **Check State**:
   ```bash
   curl http://localhost:3000/api/anonymous-trial/state
   ```

3. **Simulate Expiry**:
   ```typescript
   // Temporarily change duration to 1 minute
   NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=1
   ```

### Unit Tests

```bash
npm test src/lib/__tests__/anonymous-trial.test.ts
```

### Integration Tests

See `src/lib/__tests__/anonymous-trial-integration.test.ts`

## Transition to Account Trial

When user signs up after anonymous trial:

1. User clicks "Sign Up" in expired modal
2. Redirected to `/en/login?redirect=/products/grammar-master`
3. After email verification and login:
   - `isAuthenticated` becomes `true`
   - Anonymous trial logic is bypassed
   - Account-based 7-day trial starts automatically
   - User gets full access via `checkUserAccess()`

## Monitoring

### Check Trial Usage

```sql
-- Count active anonymous trials (via cookie analysis)
-- Note: Anonymous trials are cookie-based, not in database
```

### Track Conversions

```typescript
// Add analytics event when trial starts
await startAnonymousTrial();
analytics.track("anonymous_trial_started", {
  product: "grammar-master",
  duration: 30,
});

// Track when user signs up after trial
analytics.track("anonymous_trial_converted", {
  product: "grammar-master",
  timeUsed: minutesUsed,
});
```

## Troubleshooting

### Trial Not Starting

1. Check cookie is being set:
   ```javascript
   document.cookie
   ```

2. Verify API response:
   ```bash
   curl -X POST http://localhost:3000/api/anonymous-trial/start \
     -H "Content-Type: application/json" \
     -d '{"product":"grammar-master"}'
   ```

3. Check browser console for errors

### Trial Expires Immediately

1. Verify `NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES` is set correctly
2. Check system time is accurate
3. Verify JWT signing is working:
   ```typescript
   const state = await getAnonymousTrialState();
   console.log(state);
   ```

### Modal Not Showing

1. Check `hasSeenExpiredModal` flag:
   ```bash
   curl http://localhost:3000/api/anonymous-trial/state
   ```

2. Clear cookie and retry:
   ```javascript
   document.cookie = "tutorbox_anon_trial=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
   ```

## Future Enhancements

- [ ] Usage-based limits (max actions per trial)
- [ ] A/B testing different trial durations
- [ ] Analytics dashboard for trial metrics
- [ ] Email capture before trial starts
- [ ] Progressive disclosure (show signup prompt at 50% time)
- [ ] Trial extension for engaged users
- [ ] Device fingerprinting to prevent abuse
- [ ] Rate limiting on trial creation

## API Reference

### `useAnonymousTrial(product)`

**Parameters**:
- `product`: `"grammar-master" | "cast-master"`

**Returns**:
```typescript
{
  trialState: AnonymousTrialState | null;
  isLoading: boolean;
  hasAccess: boolean;
  isExpired: boolean;
  minutesRemaining: number;
  isAuthenticated: boolean;
  startTrial: () => Promise<void>;
  markModalAsSeen: () => Promise<void>;
  incrementAction: (product) => Promise<void>;
  refreshState: () => Promise<void>;
}
```

### `checkAnonymousAccess(isAuthenticated, product)`

**Parameters**:
- `isAuthenticated`: `boolean`
- `product`: `"grammar-master" | "cast-master"`

**Returns**:
```typescript
{
  hasAccess: boolean;
  reason: "anonymous_trial" | "authenticated" | "expired" | "not_started";
  trialState?: AnonymousTrialState;
  minutesRemaining?: number;
}
```

## Files Reference

### Core Files
- `src/config/anonymous-trial.ts` - Configuration
- `src/lib/anonymous-trial.ts` - Server-side logic
- `src/hooks/use-anonymous-trial.ts` - Client-side hook

### Components
- `src/components/anonymous-trial-guard.tsx` - Page wrapper
- `src/components/anonymous-trial-banner.tsx` - Countdown banner
- `src/components/anonymous-trial-expired-modal.tsx` - Expiry modal

### API Routes
- `src/app/api/anonymous-trial/state/route.ts`
- `src/app/api/anonymous-trial/start/route.ts`
- `src/app/api/anonymous-trial/mark-seen/route.ts`
- `src/app/api/anonymous-trial/increment/route.ts`

### Updated Files
- `src/app/products/grammar-master/page.tsx`
- `src/app/api/grammar/access/route.ts`
- `src/app/api/teleprompter/access/route.ts`
>>>>>>> origin/main
