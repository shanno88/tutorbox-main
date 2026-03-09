# Grammar Master External Link Fix Summary

## Problem

Grammar Master was linking to `https://tutorbox.cc/en/pricing` which returns 404, and the external app URL `https://gm.tutorbox.cc` had no health checking, potentially leading users to broken pages.

## Solution

Integrated Grammar Master with the existing external link health check system to:
1. Monitor the Grammar Master application URL (`https://gm.tutorbox.cc`)
2. Prevent users from clicking through to unavailable services
3. Show clear error messages when the external service is down
4. Update all references from the broken `/en/pricing` URL

## Files Changed

### 1. `src/config/external-links.ts`

**Changes**:
- Updated `grammar_master_trial` URL from `https://tutorbox.cc/en/pricing` to `https://tutorbox.cc/products/grammar-master`
- Added new entry `grammar_master_app` for the external application URL

**New Configuration**:
```typescript
{
  id: "grammar_master_app",
  label: "Grammar Master Application",
  labelCn: "语法大师应用",
  url: "https://gm.tutorbox.cc",
  description: "Grammar Master web application - external app",
  productSlug: "grammar-master",
  checkMethod: "HEAD",
  expectedStatus: [200, 301, 302],
  timeout: 5000,
},
{
  id: "grammar_master_trial",
  label: "Grammar Master 7-day trial",
  labelCn: "语法大师 7 天试用",
  url: "https://tutorbox.cc/products/grammar-master",
  description: "Grammar Master trial page - internal product page",
  productSlug: "grammar-master",
  checkMethod: "HEAD",
  expectedStatus: [200, 301, 302],
  timeout: 5000,
}
```

### 2. `src/app/products/grammar-master/page.tsx`

**Changes**:
- Added `useLinkHealth` hook to check external app status
- Added health check before redirecting to external app
- Updated button to show disabled state when app is unavailable
- Added visual indicator (AlertCircle icon) when unavailable
- Added bilingual error message explaining the issue

**Before**:
```tsx
async function handleStartGrammarMaster() {
  setStatus("loading");
  // ... directly redirects to https://gm.tutorbox.cc
}

<button onClick={handleStartGrammarMaster}>
  开始使用语法大师
</button>
```

**After**:
```tsx
const { status: linkStatus } = useLinkHealth("grammar_master_app");

async function handleStartGrammarMaster() {
  // Check if external link is unavailable
  if (linkStatus === "unavailable") {
    alert("语法大师应用暂时无法访问...");
    return;
  }
  // ... then proceed with redirect
}

<button 
  onClick={handleStartGrammarMaster}
  disabled={linkStatus === "unavailable"}
>
  {linkStatus === "unavailable" 
    ? "应用暂时无法访问" 
    : "开始使用语法大师"}
</button>

{linkStatus === "unavailable" && (
  <p className="text-orange-600">
    语法大师应用暂时无法访问。这是外部服务的问题...
  </p>
)}
```

### 3. `src/components/trial-guard.tsx`

**Changes**:
- Updated redirect from `/en/pricing` to product-specific pages
- Now redirects to `/products/grammar-master` or `/products/cast-master`

**Before**:
```tsx
if (!accessResult.access) {
  redirect("/en/pricing");
}
```

**After**:
```tsx
if (!accessResult.access) {
  redirect(`/products/${product === "grammar" ? "grammar-master" : "cast-master"}`);
}
```

### 4. Documentation Updates

**Files Updated**:
- `EXTERNAL_LINK_HEALTH_IMPLEMENTATION.md` - Updated example URLs
- `docs/external-link-health-check.md` - Removed reference to broken URL

## Behavior

### When External App is Available (Status: "ok")

1. User clicks "开始使用语法大师" button
2. System checks access permissions
3. If authorized, redirects to `https://gm.tutorbox.cc`
4. User can use Grammar Master normally

### When External App is Unavailable (Status: "unavailable")

1. Button shows disabled state with AlertCircle icon
2. Button text changes to "应用暂时无法访问"
3. Orange warning message appears below button:
   ```
   语法大师应用暂时无法访问
   这是外部服务的问题，不是您的账户问题。请稍后再试或联系客服。
   The Grammar Master application is currently unavailable. 
   This is an issue on the external service side, not with your account.
   ```
4. If user clicks button, shows alert with same message
5. No redirect occurs - user stays on current page

### Health Check Process

The system automatically:
1. Checks `https://gm.tutorbox.cc` every 5 minutes (configurable)
2. Marks as "unavailable" after 3 consecutive failures
3. Updates UI in real-time when status changes
4. Stores status in database for persistence

## Testing

### Test 1: Normal Operation

```bash
# Ensure external app is accessible
curl -I https://gm.tutorbox.cc
# Should return 200 OK

# Visit Grammar Master page
open http://localhost:3000/products/grammar-master

# Expected:
# - Button is enabled
# - Button text: "开始使用语法大师"
# - No warning message
# - Clicking redirects to https://gm.tutorbox.cc
```

### Test 2: External App Down

```bash
# Simulate unavailable app by changing URL in config temporarily
# Or wait for 3 consecutive health check failures

# Visit Grammar Master page
open http://localhost:3000/products/grammar-master

# Expected:
# - Button is disabled with opacity
# - Button shows AlertCircle icon
# - Button text: "应用暂时无法访问"
# - Orange warning message visible
# - Clicking shows alert, no redirect
```

### Test 3: Health Check Recovery

```bash
# After external app comes back online
# Health check will detect it within 5 minutes

# Expected:
# - Button becomes enabled automatically
# - Warning message disappears
# - Button text returns to "开始使用语法大师"
# - Clicking works normally
```

## Configuration

### Check External Link Status

```bash
# View current status
curl http://localhost:3000/api/external-links/health

# Trigger manual check
curl -X POST http://localhost:3000/api/external-links/check

# View admin dashboard
open http://localhost:3000/admin/external-links
```

### Adjust Health Check Settings

Edit `src/config/external-links.ts`:

```typescript
{
  id: "grammar_master_app",
  url: "https://gm.tutorbox.cc",
  checkMethod: "HEAD",        // or "GET"
  expectedStatus: [200, 301, 302],  // Add more status codes
  timeout: 5000,              // Increase for slow servers
}
```

Edit `src/lib/external-link-health.ts`:

```typescript
const FAILURE_THRESHOLD = 3;  // Change to 5 for more tolerance
```

## Error Messages

### English
```
The Grammar Master application is currently unavailable (404 or server error). 
This is an issue on the external service side, not with your account. 
Please try again later or contact support.
```

### Chinese
```
语法大师应用暂时无法访问（404 或服务器错误）。
这是外部服务的问题，不是您的账户问题。
请稍后再试或联系客服。
```

## Monitoring

### Database Query

```sql
-- Check Grammar Master app status
SELECT * FROM "ExternalLinkHealth" 
WHERE linkId = 'grammar_master_app';

-- View recent checks
SELECT linkId, status, lastCheckedAt, consecutiveFailures 
FROM "ExternalLinkHealth" 
ORDER BY lastCheckedAt DESC;
```

### Logs

```bash
# Health check logs
[external-links/check] Starting health check...
[external-links/check] grammar_master_app: OK (200)
[external-links/check] Health check complete: { total: 3, ok: 3, unavailable: 0 }
```

## Production Checklist

Before deploying to production:

1. ✅ Run initial health check: `npm run init:external-links`
2. ✅ Verify all external URLs are accessible
3. ✅ Set up periodic health checks (cron or Vercel cron)
4. ✅ Test unavailable state in staging
5. ✅ Monitor health check logs
6. ✅ Set up alerts for prolonged unavailability (optional)

## Benefits

✅ **User Experience**: No more 404 pages from broken links
✅ **Transparency**: Clear communication when external services are down
✅ **Reliability**: Automatic detection of broken links
✅ **Consistency**: Same pattern for all external links (Cast Master, Grammar Master)
✅ **Maintainability**: Centralized configuration for all external URLs
✅ **Monitoring**: Admin dashboard and API for health status

## Related Systems

This fix integrates with:
- External Link Health Check System (already implemented for Cast Master)
- Anonymous Trial System (30-minute trial)
- Account-based Trial System (7-day trial)

All systems work together seamlessly to provide a robust user experience.
