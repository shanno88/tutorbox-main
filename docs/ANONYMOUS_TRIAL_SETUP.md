<<<<<<< HEAD
# Anonymous Trial System - Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install jose
```

### 2. Set Environment Variable

Add to `.env.local`:

```bash
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=30
NEXTAUTH_SECRET=your-secret-key-here
```

### 3. Test the System

```bash
# Start dev server
npm run dev

# Visit Grammar Master page
open http://localhost:3000/products/grammar-master

# Check that:
# - Banner shows "30 min remaining"
# - You can use the tool without logging in
# - After 30 minutes, modal prompts signup
```

## Integration Checklist

### ✅ Grammar Master
- [x] Wrapped with `AnonymousTrialGuard`
- [x] API route updated to check anonymous access
- [x] Banner shows countdown
- [x] Modal prompts signup on expiry

### ✅ Cast Master (Broadcast Master)
- [x] API route updated to check anonymous access
- [ ] Product page needs `AnonymousTrialGuard` wrapper (if exists)

### Configuration

**Current Settings**:
- Trial Duration: 30 minutes (configurable)
- Supported Products: Grammar Master, Cast Master
- Auto-start: Yes
- Show Banner: Yes
- Block on Expired: No (shows modal instead)

## Testing Scenarios

### Scenario 1: New Anonymous User

1. Visit `/products/grammar-master` (not logged in)
2. **Expected**: Trial starts automatically
3. **Expected**: Banner shows "30 min remaining"
4. **Expected**: Can use Grammar Master features
5. Wait 30 minutes or change `NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=1`
6. **Expected**: Modal appears prompting signup
7. **Expected**: Features are blocked after dismissing modal

### Scenario 2: Authenticated User

1. Log in with email
2. Visit `/products/grammar-master`
3. **Expected**: No trial banner (uses account trial instead)
4. **Expected**: Full access via 7-day account trial

### Scenario 3: Trial Expiry

1. Start anonymous trial
2. Wait for expiry (or set duration to 1 minute)
3. **Expected**: Modal shows "30-minute trial has ended"
4. Click "Sign Up with Email"
5. **Expected**: Redirected to `/en/login?redirect=/products/grammar-master`
6. Complete signup
7. **Expected**: Redirected back to product page
8. **Expected**: Now has 7-day account trial

## Configuration Options

### Change Trial Duration

```bash
# .env.local
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=45  # 45 minutes
```

### Disable Auto-Start

```tsx
<AnonymousTrialGuard
  product="grammar-master"
  autoStart={false}  // User must click "Start Trial" button
  // ...
>
```

### Hide Banner

```tsx
<AnonymousTrialGuard
  product="grammar-master"
  showBanner={false}  // No countdown banner
  // ...
>
```

### Block Content on Expiry

```tsx
<AnonymousTrialGuard
  product="grammar-master"
  blockOnExpired={true}  // Show blocked state instead of content
  // ...
>
```

## API Integration

### Check Access in Your API Routes

```typescript
// src/app/api/your-feature/route.ts
import { checkAnonymousAccess } from "@/lib/anonymous-trial";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  const session = await getServerSession();
  const isAuthenticated = !!session?.user;

  // Check anonymous trial
  const access = await checkAnonymousAccess(
    isAuthenticated,
    "grammar-master"
  );

  if (!access.hasAccess) {
    return NextResponse.json(
      { error: "Trial expired. Please sign up." },
      { status: 403 }
    );
  }

  // Process request
  // ...
}
```

### Increment Action Count (Optional)

```typescript
import { incrementAnonymousTrialAction } from "@/lib/anonymous-trial";

// After successful action
await incrementAnonymousTrialAction("grammar-master");
```

## Troubleshooting

### Issue: Trial not starting

**Solution**:
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES` is set
3. Check cookie is being set: `document.cookie`
4. Test API: `curl http://localhost:3000/api/anonymous-trial/state`

### Issue: Modal not showing on expiry

**Solution**:
1. Check `hasSeenExpiredModal` flag in state
2. Clear cookie: `document.cookie = "tutorbox_anon_trial=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"`
3. Refresh page

### Issue: Banner shows wrong time

**Solution**:
1. Verify system time is correct
2. Check `expiryTimestamp` in cookie
3. Refresh state: Call `refreshState()` from hook

## Production Deployment

### Environment Variables

```bash
# .env.production
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=30
NEXTAUTH_SECRET=production-secret-key-change-this
```

### Security Checklist

- [x] `NEXTAUTH_SECRET` is strong and unique
- [x] Cookies use `secure: true` in production
- [x] JWT tokens are signed and verified
- [x] No sensitive data in trial state
- [x] Rate limiting on trial creation (optional)

### Monitoring

Add analytics events:

```typescript
// When trial starts
analytics.track("anonymous_trial_started", {
  product: "grammar-master",
  duration: 30,
});

// When trial expires
analytics.track("anonymous_trial_expired", {
  product: "grammar-master",
  timeUsed: 30,
});

// When user signs up after trial
analytics.track("anonymous_trial_converted", {
  product: "grammar-master",
});
```

## Next Steps

1. ✅ Test anonymous trial flow end-to-end
2. ✅ Verify authenticated users bypass anonymous trial
3. ✅ Test trial expiry and signup flow
4. ⬜ Add analytics tracking
5. ⬜ Monitor conversion rates
6. ⬜ A/B test different trial durations
7. ⬜ Add usage-based limits (optional)

## Support

For issues or questions:
- Documentation: `docs/ANONYMOUS_TRIAL_SYSTEM.md`
- Code: `src/lib/anonymous-trial.ts`
- Examples: `src/app/products/grammar-master/page.tsx`
=======
# Anonymous Trial System - Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install jose
```

### 2. Set Environment Variable

Add to `.env.local`:

```bash
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=30
NEXTAUTH_SECRET=your-secret-key-here
```

### 3. Test the System

```bash
# Start dev server
npm run dev

# Visit Grammar Master page
open http://localhost:3000/products/grammar-master

# Check that:
# - Banner shows "30 min remaining"
# - You can use the tool without logging in
# - After 30 minutes, modal prompts signup
```

## Integration Checklist

### ✅ Grammar Master
- [x] Wrapped with `AnonymousTrialGuard`
- [x] API route updated to check anonymous access
- [x] Banner shows countdown
- [x] Modal prompts signup on expiry

### ✅ Cast Master (Broadcast Master)
- [x] API route updated to check anonymous access
- [ ] Product page needs `AnonymousTrialGuard` wrapper (if exists)

### Configuration

**Current Settings**:
- Trial Duration: 30 minutes (configurable)
- Supported Products: Grammar Master, Cast Master
- Auto-start: Yes
- Show Banner: Yes
- Block on Expired: No (shows modal instead)

## Testing Scenarios

### Scenario 1: New Anonymous User

1. Visit `/products/grammar-master` (not logged in)
2. **Expected**: Trial starts automatically
3. **Expected**: Banner shows "30 min remaining"
4. **Expected**: Can use Grammar Master features
5. Wait 30 minutes or change `NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=1`
6. **Expected**: Modal appears prompting signup
7. **Expected**: Features are blocked after dismissing modal

### Scenario 2: Authenticated User

1. Log in with email
2. Visit `/products/grammar-master`
3. **Expected**: No trial banner (uses account trial instead)
4. **Expected**: Full access via 7-day account trial

### Scenario 3: Trial Expiry

1. Start anonymous trial
2. Wait for expiry (or set duration to 1 minute)
3. **Expected**: Modal shows "30-minute trial has ended"
4. Click "Sign Up with Email"
5. **Expected**: Redirected to `/en/login?redirect=/products/grammar-master`
6. Complete signup
7. **Expected**: Redirected back to product page
8. **Expected**: Now has 7-day account trial

## Configuration Options

### Change Trial Duration

```bash
# .env.local
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=45  # 45 minutes
```

### Disable Auto-Start

```tsx
<AnonymousTrialGuard
  product="grammar-master"
  autoStart={false}  // User must click "Start Trial" button
  // ...
>
```

### Hide Banner

```tsx
<AnonymousTrialGuard
  product="grammar-master"
  showBanner={false}  // No countdown banner
  // ...
>
```

### Block Content on Expiry

```tsx
<AnonymousTrialGuard
  product="grammar-master"
  blockOnExpired={true}  // Show blocked state instead of content
  // ...
>
```

## API Integration

### Check Access in Your API Routes

```typescript
// src/app/api/your-feature/route.ts
import { checkAnonymousAccess } from "@/lib/anonymous-trial";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
  const session = await getServerSession();
  const isAuthenticated = !!session?.user;

  // Check anonymous trial
  const access = await checkAnonymousAccess(
    isAuthenticated,
    "grammar-master"
  );

  if (!access.hasAccess) {
    return NextResponse.json(
      { error: "Trial expired. Please sign up." },
      { status: 403 }
    );
  }

  // Process request
  // ...
}
```

### Increment Action Count (Optional)

```typescript
import { incrementAnonymousTrialAction } from "@/lib/anonymous-trial";

// After successful action
await incrementAnonymousTrialAction("grammar-master");
```

## Troubleshooting

### Issue: Trial not starting

**Solution**:
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES` is set
3. Check cookie is being set: `document.cookie`
4. Test API: `curl http://localhost:3000/api/anonymous-trial/state`

### Issue: Modal not showing on expiry

**Solution**:
1. Check `hasSeenExpiredModal` flag in state
2. Clear cookie: `document.cookie = "tutorbox_anon_trial=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"`
3. Refresh page

### Issue: Banner shows wrong time

**Solution**:
1. Verify system time is correct
2. Check `expiryTimestamp` in cookie
3. Refresh state: Call `refreshState()` from hook

## Production Deployment

### Environment Variables

```bash
# .env.production
NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES=30
NEXTAUTH_SECRET=production-secret-key-change-this
```

### Security Checklist

- [x] `NEXTAUTH_SECRET` is strong and unique
- [x] Cookies use `secure: true` in production
- [x] JWT tokens are signed and verified
- [x] No sensitive data in trial state
- [x] Rate limiting on trial creation (optional)

### Monitoring

Add analytics events:

```typescript
// When trial starts
analytics.track("anonymous_trial_started", {
  product: "grammar-master",
  duration: 30,
});

// When trial expires
analytics.track("anonymous_trial_expired", {
  product: "grammar-master",
  timeUsed: 30,
});

// When user signs up after trial
analytics.track("anonymous_trial_converted", {
  product: "grammar-master",
});
```

## Next Steps

1. ✅ Test anonymous trial flow end-to-end
2. ✅ Verify authenticated users bypass anonymous trial
3. ✅ Test trial expiry and signup flow
4. ⬜ Add analytics tracking
5. ⬜ Monitor conversion rates
6. ⬜ A/B test different trial durations
7. ⬜ Add usage-based limits (optional)

## Support

For issues or questions:
- Documentation: `docs/ANONYMOUS_TRIAL_SYSTEM.md`
- Code: `src/lib/anonymous-trial.ts`
- Examples: `src/app/products/grammar-master/page.tsx`
>>>>>>> origin/main
