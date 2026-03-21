# External Link Health Check System - Implementation Summary

## ✅ Implementation Complete

A comprehensive external link health monitoring system has been implemented to prevent users from encountering broken 404 pages when clicking external trial/product links.

## 🎯 Problem Solved

**Before:** Users clicking "Grammar Master 7-day trial" button would land on `https://tutorbox.cc/products/grammar-master` or external partner URLs that might return 404, causing confusion about whether the issue is with their account or the service.

**After:** The system automatically detects broken external links and:
- Disables the button with a clear tooltip
- Shows user-friendly error message explaining it's a partner-side issue
- Prevents users from clicking through to 404 pages
- Optionally hides unavailable buttons entirely

## 📁 Files Created

### Configuration
- `src/config/external-links.ts` - Central configuration for all external links

### Database
- `prisma/schema.prisma` - Added `ExternalLinkHealth` model

### Core Logic
- `src/lib/external-link-health.ts` - Health check logic and database operations

### API Routes
- `src/app/api/external-links/health/route.ts` - GET endpoint for frontend
- `src/app/api/external-links/check/route.ts` - POST endpoint to trigger checks

### Frontend Components
- `src/components/external-link-button.tsx` - Smart button component with health checking
- `src/components/ui/tooltip.tsx` - Tooltip UI component
- `src/hooks/use-external-link-health.ts` - React hook for health status

### Scripts
- `scripts/check-external-links.ts` - CI/build-time link checker
- `scripts/init-external-link-health.ts` - Database initialization script

### Admin Interface
- `src/app/admin/external-links/page.tsx` - Admin dashboard to view link health

### CI/CD
- `.github/workflows/check-external-links.yml` - GitHub Actions workflow

### Documentation
- `docs/external-link-health-check.md` - Complete system documentation
- `docs/external-link-setup-guide.md` - Setup and configuration guide
- `EXTERNAL_LINK_HEALTH_IMPLEMENTATION.md` - This file

### Tests
- `src/lib/__tests__/external-link-health.test.ts` - Unit tests

## 📝 Files Modified

### Updated Components
- `src/app/(landing)/_sections/products.tsx` - Cast Master button now uses `ExternalLinkButton`

### Package Configuration
- `package.json` - Added scripts and dependencies:
  - `check:external-links` - Run health check
  - `init:external-links` - Initialize database
  - `prebuild` - Auto-check before build
  - Added `@radix-ui/react-tooltip` dependency
  - Added `tsx` dev dependency

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

New dependencies:
- `@radix-ui/react-tooltip` - Tooltip component
- `tsx` (dev) - TypeScript script runner

### 2. Database Migration

```bash
# Push schema changes
npx prisma db push

# Or create migration
npx prisma migrate dev --name add_external_link_health
```

### 3. Initialize Health Records

```bash
npm run init:external-links
```

### 4. Configure Periodic Checks

Choose one option:

**Option A: Vercel Cron** (create `vercel.json`):
```json
{
  "crons": [{
    "path": "/api/external-links/check",
    "schedule": "*/5 * * * *"
  }]
}
```

**Option B: Server Cron**:
```bash
*/5 * * * * curl -X POST https://tutorbox.cc/api/external-links/check
```

**Option C: External Service** (cron-job.org, EasyCron, etc.)

### 5. Test the System

```bash
# Start dev server
npm run dev

# View admin dashboard
open http://localhost:3000/admin/external-links

# Test health check
curl -X POST http://localhost:3000/api/external-links/check

# View health status
curl http://localhost:3000/api/external-links/health
```

## 🔧 Configuration

### Current External Links

Two links are configured in `src/config/external-links.ts`:

1. **Cast Master Trial**
   - ID: `cast_master_trial`
   - URL: `https://tl.tutorbox.cc/`
   - Product: `cast-master`

2. **Grammar Master Trial**
   - ID: `grammar_master_trial`
   - URL: `https://tutorbox.cc/products/grammar-master`
   - Product: `grammar-master`

### Adding New Links

Edit `src/config/external-links.ts`:

```typescript
{
  id: "new_product_trial",
  label: "New Product Trial",
  labelCn: "新产品试用",
  url: "https://partner.example.com/trial",
  productSlug: "new-product",
  checkMethod: "HEAD",
  expectedStatus: [200, 301, 302],
  timeout: 5000,
}
```

Then run: `npm run init:external-links`

### Failure Threshold

Links are marked unavailable after 3 consecutive failures.

Change in `src/lib/external-link-health.ts`:
```typescript
const FAILURE_THRESHOLD = 3; // Adjust as needed
```

## 💻 Usage Examples

### Basic Usage

```tsx
import { ExternalLinkButton } from "@/components/external-link-button";

<ExternalLinkButton
  linkId="cast_master_trial"
  url="https://tl.tutorbox.cc/"
  variant="default"
>
  Start 7-Day Trial
</ExternalLinkButton>
```

### Hide When Unavailable

```tsx
<ExternalLinkButton
  linkId="cast_master_trial"
  url="https://tl.tutorbox.cc/"
  hideWhenUnavailable={true}
>
  Start Trial
</ExternalLinkButton>
```

### Custom Error Handler

```tsx
<ExternalLinkButton
  linkId="cast_master_trial"
  url="https://tl.tutorbox.cc/"
  onUnavailableClick={() => {
    alert("Trial page is temporarily unavailable. Please contact support.");
    router.push("/contact");
  }}
>
  Start Trial
</ExternalLinkButton>
```

## 🧪 Testing

### Manual Testing

```bash
# Check all links
npm run check:external-links

# With strict mode (fail on errors)
STRICT_EXTERNAL_LINK_CHECK=true npm run check:external-links

# Initialize/reset database
npm run init:external-links
```

### Unit Tests

```bash
npm test src/lib/__tests__/external-link-health.test.ts
```

### Integration Testing

1. Change link URL to 404 page in config
2. Run health check 3 times
3. Verify button shows as disabled
4. Check admin dashboard

## 📊 Monitoring

### Admin Dashboard

View at: `https://tutorbox.cc/admin/external-links`

Shows:
- Link status (OK/Unavailable/Unknown)
- Last checked timestamp
- HTTP status code
- Consecutive failures
- Error messages

### API Endpoints

**GET `/api/external-links/health`**
- Returns current health status for all links
- Used by frontend components

**POST `/api/external-links/check`**
- Triggers manual health check
- Can be called by cron jobs

### Database Queries

```sql
-- View all link health
SELECT * FROM "ExternalLinkHealth";

-- Find broken links
SELECT * FROM "ExternalLinkHealth" WHERE status = 'unavailable';

-- Check recent activity
SELECT linkId, status, lastCheckedAt, consecutiveFailures 
FROM "ExternalLinkHealth" 
ORDER BY lastCheckedAt DESC;
```

## 🔒 Security Considerations

### Recommendations

1. **Add authentication to admin dashboard**
   ```typescript
   // src/app/admin/external-links/page.tsx
   const session = await getServerSession();
   if (!session?.user?.email?.endsWith("@tutorbox.cc")) {
     redirect("/");
   }
   ```

2. **Rate limit health check endpoint**
   - Prevent abuse of POST `/api/external-links/check`
   - Use middleware or rate limiting library

3. **Use HEAD requests**
   - Already configured by default
   - Minimizes bandwidth usage

4. **Set reasonable timeouts**
   - Default: 5 seconds
   - Prevents hanging requests

## 🎨 UI/UX Features

### When Link is OK
- Button renders normally
- Opens in new tab on click
- No visual indication of health checking

### When Link is Unavailable
- Button shows disabled state with alert icon
- Tooltip explains the issue
- Clear message: "Partner page unavailable (404)"
- Emphasizes it's not user's fault

### While Loading
- Optimistic rendering (shows as normal)
- Prevents layout shift

## 🔄 CI/CD Integration

### Build-Time Check

Automatically runs before build via `prebuild` script:

```bash
npm run build
# Runs: npm run check:external-links
# Then: next build
```

### GitHub Actions

Workflow runs on:
- Push to main/develop
- Pull requests
- Daily at 9 AM UTC
- Manual trigger

### Environment Variables

```bash
# Fail build if links are broken (default: false)
STRICT_EXTERNAL_LINK_CHECK=true
```

## 📈 Future Enhancements

Potential improvements:

- [ ] Email alerts when links become unavailable
- [ ] Historical uptime statistics
- [ ] Webhook notifications for status changes
- [ ] Automatic retry with exponential backoff
- [ ] Support for authenticated external links
- [ ] Slack/Discord notifications
- [ ] Uptime percentage tracking
- [ ] Response time monitoring

## 🐛 Troubleshooting

### Button Always Shows Unavailable

1. Check database: `SELECT * FROM "ExternalLinkHealth" WHERE linkId = 'your_id'`
2. Trigger check: `curl -X POST http://localhost:3000/api/external-links/check`
3. Verify URL: `curl -I https://your-url.com`
4. Check `consecutiveFailures` count

### Health Check Not Running

1. Verify cron job configuration
2. Check API accessibility
3. Review server logs
4. Test manually: `npm run check:external-links`

### Build Fails

```bash
# Temporarily disable
STRICT_EXTERNAL_LINK_CHECK=false npm run build

# Or skip prebuild
npm run build --ignore-scripts
```

### False Positives

1. Increase timeout in config
2. Add more accepted status codes
3. Increase `FAILURE_THRESHOLD`
4. Use GET instead of HEAD

## 📚 Documentation

- **Complete Guide**: `docs/external-link-health-check.md`
- **Setup Guide**: `docs/external-link-setup-guide.md`
- **This Summary**: `EXTERNAL_LINK_HEALTH_IMPLEMENTATION.md`

## ✨ Key Benefits

1. **User Experience**: No more 404 pages from broken partner links
2. **Transparency**: Clear communication when external services are down
3. **Reliability**: Automatic detection of broken links
4. **Maintainability**: Centralized configuration for all external links
5. **Monitoring**: Admin dashboard and API for health status
6. **CI/CD Integration**: Catch broken links before deployment
7. **Flexibility**: Configurable thresholds, timeouts, and behaviors

## 🎉 Ready to Use

The system is fully implemented and ready for production use. Follow the setup instructions above to get started.

For questions or issues, refer to the documentation in the `docs/` directory.
