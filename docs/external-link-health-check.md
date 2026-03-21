<<<<<<< HEAD
# External Link Health Check System

## Overview

This system automatically monitors external trial/product URLs to prevent users from encountering broken 404 pages. When an external link becomes unavailable, the UI gracefully handles it by disabling buttons and showing clear error messages.

## Problem Solved

External partner sites (like `https://tl.tutorbox.cc/`) or internal product pages may return 404 or become unreachable. Without health checking, users would click buttons and land on broken pages, creating a poor experience and confusion about whether the issue is with their account or the service.

## Architecture

### 1. Configuration (`src/config/external-links.ts`)

Central configuration file defining all external links:

```typescript
{
  id: "cast_master_trial",
  label: "Cast Master 7-day trial",
  url: "https://tl.tutorbox.cc/",
  productSlug: "cast-master",
  checkMethod: "HEAD",
  expectedStatus: [200, 301, 302],
  timeout: 5000
}
```

### 2. Database Schema (`prisma/schema.prisma`)

```prisma
model ExternalLinkHealth {
  id                  String   @id @default(cuid())
  linkId              String   @unique
  url                 String
  status              String   // "unknown" | "ok" | "unavailable"
  lastCheckedAt       DateTime
  lastStatusCode      Int?
  consecutiveFailures Int      @default(0)
  lastError           String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### 3. Health Check Logic (`src/lib/external-link-health.ts`)

- `checkExternalLink()`: Performs HTTP check for a single link
- `updateLinkHealth()`: Updates database with check results
- `checkAllExternalLinks()`: Checks all configured links
- Marks link as "unavailable" after 3 consecutive failures (configurable threshold)

### 4. API Routes

**GET `/api/external-links/health`**
- Returns current health status for all links
- Used by frontend to determine button state

**POST `/api/external-links/check`**
- Triggers manual health check
- Can be called by cron jobs or admin tools

### 5. Frontend Components

**`ExternalLinkButton` Component**
- Automatically checks link health before rendering
- Shows disabled button with tooltip when link is unavailable
- Displays user-friendly error message
- Can hide button entirely if `hideWhenUnavailable={true}`

**`useExternalLinkHealth()` Hook**
- React hook to fetch health status
- `useLinkHealth(linkId)` for specific link status

### 6. CI/Build Integration

**Script: `scripts/check-external-links.ts`**

```bash
# Check links during build (warning only)
npm run check:external-links

# Fail build if links are broken
STRICT_EXTERNAL_LINK_CHECK=true npm run check:external-links
```

Automatically runs before build via `prebuild` script in `package.json`.

## Usage

### Adding a New External Link

1. Add to `src/config/external-links.ts`:

```typescript
{
  id: "new_product_trial",
  label: "New Product Trial",
  labelCn: "新产品试用",
  url: "https://partner.example.com/trial",
  productSlug: "new-product",
  checkMethod: "HEAD",
  expectedStatus: [200, 301, 302],
}
```

2. Use in component:

```tsx
import { ExternalLinkButton } from "@/components/external-link-button";

<ExternalLinkButton
  linkId="new_product_trial"
  url="https://partner.example.com/trial"
  variant="default"
>
  Start Trial
</ExternalLinkButton>
```

### Customizing Unavailable Behavior

```tsx
// Hide button when unavailable
<ExternalLinkButton
  linkId="cast_master_trial"
  url="https://tl.tutorbox.cc/"
  hideWhenUnavailable={true}
>
  Start Trial
</ExternalLinkButton>

// Custom handler for unavailable links
<ExternalLinkButton
  linkId="cast_master_trial"
  url="https://tl.tutorbox.cc/"
  onUnavailableClick={() => {
    alert("Custom error message");
    // Or redirect to alternative page
    router.push("/contact-support");
  }}
>
  Start Trial
</ExternalLinkButton>
```

### Manual Health Check

Trigger health check via API:

```bash
curl -X POST http://localhost:3000/api/external-links/check
```

Or programmatically:

```typescript
import { checkAllExternalLinks } from "@/lib/external-link-health";

const results = await checkAllExternalLinks();
console.log(results);
```

## Periodic Health Checks

### Option 1: Cron Job (Recommended for Production)

Set up a cron job to call the health check API:

```bash
# Every 5 minutes
*/5 * * * * curl -X POST https://tutorbox.cc/api/external-links/check
```

### Option 2: Next.js API Route with Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/external-links/check",
    "schedule": "*/5 * * * *"
  }]
}
```

### Option 3: Background Worker

Create a background worker that runs health checks periodically.

## Configuration Options

### Failure Threshold

Change in `src/lib/external-link-health.ts`:

```typescript
const FAILURE_THRESHOLD = 3; // Mark unavailable after N failures
```

### Check Timeout

Per-link timeout in config:

```typescript
{
  id: "slow_link",
  url: "https://slow-site.com",
  timeout: 10000, // 10 seconds
}
```

### Expected Status Codes

```typescript
{
  id: "redirect_link",
  url: "https://example.com",
  expectedStatus: [200, 301, 302, 307, 308], // Accept redirects
}
```

## Testing

### Unit Tests

```bash
npm test src/lib/__tests__/external-link-health.test.ts
```

Tests cover:
- Status transitions (ok → unavailable)
- Consecutive failure counting
- Network error handling
- Redirect acceptance

### Manual Testing

1. Start dev server: `npm run dev`
2. Check health status: `curl http://localhost:3000/api/external-links/health`
3. Trigger check: `curl -X POST http://localhost:3000/api/external-links/check`
4. View button behavior in UI

### Testing Unavailable State

Temporarily change URL in config to a 404 page:

```typescript
{
  id: "cast_master_trial",
  url: "https://tl.tutorbox.cc/nonexistent-page", // Will return 404
}
```

Run health check and verify button shows as disabled with tooltip.

## Monitoring

### Database Queries

Check link health status:

```sql
SELECT linkId, status, lastCheckedAt, consecutiveFailures, lastError
FROM "ExternalLinkHealth"
ORDER BY lastCheckedAt DESC;
```

Find unavailable links:

```sql
SELECT * FROM "ExternalLinkHealth"
WHERE status = 'unavailable';
```

### Logging

Health check results are logged to console:

```
[external-links/check] Starting health check...
[external-links/check] Health check complete: { total: 2, ok: 1, unavailable: 1 }
```

## Troubleshooting

### Button always shows as unavailable

1. Check database: `SELECT * FROM "ExternalLinkHealth" WHERE linkId = 'your_link_id'`
2. Manually trigger check: `curl -X POST http://localhost:3000/api/external-links/check`
3. Verify URL is accessible: `curl -I https://your-external-url.com`

### Health check not running

1. Verify cron job is configured
2. Check API route is accessible
3. Review server logs for errors

### False positives (marking good links as unavailable)

1. Increase timeout in config
2. Adjust `expectedStatus` codes
3. Increase `FAILURE_THRESHOLD`

## Security Considerations

- Health check API is public (no auth required) - consider adding auth for production
- Rate limit the `/api/external-links/check` endpoint to prevent abuse
- Use HEAD requests instead of GET to minimize bandwidth
- Set reasonable timeouts to prevent hanging requests

## Future Enhancements

- [ ] Admin dashboard to view link health
- [ ] Email alerts when links become unavailable
- [ ] Historical health data and uptime statistics
- [ ] Automatic retry with exponential backoff
- [ ] Support for authenticated external links
- [ ] Webhook notifications for status changes
=======
# External Link Health Check System

## Overview

This system automatically monitors external trial/product URLs to prevent users from encountering broken 404 pages. When an external link becomes unavailable, the UI gracefully handles it by disabling buttons and showing clear error messages.

## Problem Solved

External partner sites (like `https://tl.tutorbox.cc/`) or internal product pages may return 404 or become unreachable. Without health checking, users would click buttons and land on broken pages, creating a poor experience and confusion about whether the issue is with their account or the service.

## Architecture

### 1. Configuration (`src/config/external-links.ts`)

Central configuration file defining all external links:

```typescript
{
  id: "cast_master_trial",
  label: "Cast Master 7-day trial",
  url: "https://tl.tutorbox.cc/",
  productSlug: "cast-master",
  checkMethod: "HEAD",
  expectedStatus: [200, 301, 302],
  timeout: 5000
}
```

### 2. Database Schema (`prisma/schema.prisma`)

```prisma
model ExternalLinkHealth {
  id                  String   @id @default(cuid())
  linkId              String   @unique
  url                 String
  status              String   // "unknown" | "ok" | "unavailable"
  lastCheckedAt       DateTime
  lastStatusCode      Int?
  consecutiveFailures Int      @default(0)
  lastError           String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### 3. Health Check Logic (`src/lib/external-link-health.ts`)

- `checkExternalLink()`: Performs HTTP check for a single link
- `updateLinkHealth()`: Updates database with check results
- `checkAllExternalLinks()`: Checks all configured links
- Marks link as "unavailable" after 3 consecutive failures (configurable threshold)

### 4. API Routes

**GET `/api/external-links/health`**
- Returns current health status for all links
- Used by frontend to determine button state

**POST `/api/external-links/check`**
- Triggers manual health check
- Can be called by cron jobs or admin tools

### 5. Frontend Components

**`ExternalLinkButton` Component**
- Automatically checks link health before rendering
- Shows disabled button with tooltip when link is unavailable
- Displays user-friendly error message
- Can hide button entirely if `hideWhenUnavailable={true}`

**`useExternalLinkHealth()` Hook**
- React hook to fetch health status
- `useLinkHealth(linkId)` for specific link status

### 6. CI/Build Integration

**Script: `scripts/check-external-links.ts`**

```bash
# Check links during build (warning only)
npm run check:external-links

# Fail build if links are broken
STRICT_EXTERNAL_LINK_CHECK=true npm run check:external-links
```

Automatically runs before build via `prebuild` script in `package.json`.

## Usage

### Adding a New External Link

1. Add to `src/config/external-links.ts`:

```typescript
{
  id: "new_product_trial",
  label: "New Product Trial",
  labelCn: "新产品试用",
  url: "https://partner.example.com/trial",
  productSlug: "new-product",
  checkMethod: "HEAD",
  expectedStatus: [200, 301, 302],
}
```

2. Use in component:

```tsx
import { ExternalLinkButton } from "@/components/external-link-button";

<ExternalLinkButton
  linkId="new_product_trial"
  url="https://partner.example.com/trial"
  variant="default"
>
  Start Trial
</ExternalLinkButton>
```

### Customizing Unavailable Behavior

```tsx
// Hide button when unavailable
<ExternalLinkButton
  linkId="cast_master_trial"
  url="https://tl.tutorbox.cc/"
  hideWhenUnavailable={true}
>
  Start Trial
</ExternalLinkButton>

// Custom handler for unavailable links
<ExternalLinkButton
  linkId="cast_master_trial"
  url="https://tl.tutorbox.cc/"
  onUnavailableClick={() => {
    alert("Custom error message");
    // Or redirect to alternative page
    router.push("/contact-support");
  }}
>
  Start Trial
</ExternalLinkButton>
```

### Manual Health Check

Trigger health check via API:

```bash
curl -X POST http://localhost:3000/api/external-links/check
```

Or programmatically:

```typescript
import { checkAllExternalLinks } from "@/lib/external-link-health";

const results = await checkAllExternalLinks();
console.log(results);
```

## Periodic Health Checks

### Option 1: Cron Job (Recommended for Production)

Set up a cron job to call the health check API:

```bash
# Every 5 minutes
*/5 * * * * curl -X POST https://tutorbox.cc/api/external-links/check
```

### Option 2: Next.js API Route with Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/external-links/check",
    "schedule": "*/5 * * * *"
  }]
}
```

### Option 3: Background Worker

Create a background worker that runs health checks periodically.

## Configuration Options

### Failure Threshold

Change in `src/lib/external-link-health.ts`:

```typescript
const FAILURE_THRESHOLD = 3; // Mark unavailable after N failures
```

### Check Timeout

Per-link timeout in config:

```typescript
{
  id: "slow_link",
  url: "https://slow-site.com",
  timeout: 10000, // 10 seconds
}
```

### Expected Status Codes

```typescript
{
  id: "redirect_link",
  url: "https://example.com",
  expectedStatus: [200, 301, 302, 307, 308], // Accept redirects
}
```

## Testing

### Unit Tests

```bash
npm test src/lib/__tests__/external-link-health.test.ts
```

Tests cover:
- Status transitions (ok → unavailable)
- Consecutive failure counting
- Network error handling
- Redirect acceptance

### Manual Testing

1. Start dev server: `npm run dev`
2. Check health status: `curl http://localhost:3000/api/external-links/health`
3. Trigger check: `curl -X POST http://localhost:3000/api/external-links/check`
4. View button behavior in UI

### Testing Unavailable State

Temporarily change URL in config to a 404 page:

```typescript
{
  id: "cast_master_trial",
  url: "https://tl.tutorbox.cc/nonexistent-page", // Will return 404
}
```

Run health check and verify button shows as disabled with tooltip.

## Monitoring

### Database Queries

Check link health status:

```sql
SELECT linkId, status, lastCheckedAt, consecutiveFailures, lastError
FROM "ExternalLinkHealth"
ORDER BY lastCheckedAt DESC;
```

Find unavailable links:

```sql
SELECT * FROM "ExternalLinkHealth"
WHERE status = 'unavailable';
```

### Logging

Health check results are logged to console:

```
[external-links/check] Starting health check...
[external-links/check] Health check complete: { total: 2, ok: 1, unavailable: 1 }
```

## Troubleshooting

### Button always shows as unavailable

1. Check database: `SELECT * FROM "ExternalLinkHealth" WHERE linkId = 'your_link_id'`
2. Manually trigger check: `curl -X POST http://localhost:3000/api/external-links/check`
3. Verify URL is accessible: `curl -I https://your-external-url.com`

### Health check not running

1. Verify cron job is configured
2. Check API route is accessible
3. Review server logs for errors

### False positives (marking good links as unavailable)

1. Increase timeout in config
2. Adjust `expectedStatus` codes
3. Increase `FAILURE_THRESHOLD`

## Security Considerations

- Health check API is public (no auth required) - consider adding auth for production
- Rate limit the `/api/external-links/check` endpoint to prevent abuse
- Use HEAD requests instead of GET to minimize bandwidth
- Set reasonable timeouts to prevent hanging requests

## Future Enhancements

- [ ] Admin dashboard to view link health
- [ ] Email alerts when links become unavailable
- [ ] Historical health data and uptime statistics
- [ ] Automatic retry with exponential backoff
- [ ] Support for authenticated external links
- [ ] Webhook notifications for status changes
>>>>>>> origin/main
