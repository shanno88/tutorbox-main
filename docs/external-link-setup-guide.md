# External Link Health Check - Setup Guide

## Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
npm install @radix-ui/react-tooltip
npm install -D tsx vitest
```

### Step 2: Run Database Migration

```bash
# Push Prisma schema changes to database
npx prisma db push

# Or generate and run migration
npx prisma migrate dev --name add_external_link_health
```

### Step 3: Initialize Health Records

```bash
npm run init:external-links
```

This will:
- Create database records for all configured external links
- Run an initial health check
- Display results

### Step 4: Test the System

1. Start dev server:
```bash
npm run dev
```

2. View admin dashboard:
```
http://localhost:3000/admin/external-links
```

3. Test health check API:
```bash
curl -X POST http://localhost:3000/api/external-links/check
```

4. View health status:
```bash
curl http://localhost:3000/api/external-links/health
```

### Step 5: Update Your Components

Replace direct external links with `ExternalLinkButton`:

**Before:**
```tsx
<Button asChild>
  <Link href="https://external-site.com" target="_blank">
    Start Trial
  </Link>
</Button>
```

**After:**
```tsx
import { ExternalLinkButton } from "@/components/external-link-button";

<ExternalLinkButton
  linkId="your_link_id"
  url="https://external-site.com"
>
  Start Trial
</ExternalLinkButton>
```

## Production Setup

### 1. Environment Variables

Add to `.env.production`:

```bash
# Optional: Fail build if external links are broken
STRICT_EXTERNAL_LINK_CHECK=false
```

### 2. Set Up Periodic Health Checks

#### Option A: Vercel Cron (Recommended for Vercel)

Create `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/external-links/check",
    "schedule": "*/5 * * * *"
  }]
}
```

#### Option B: External Cron Service

Use a service like cron-job.org or EasyCron:

```
URL: https://your-domain.com/api/external-links/check
Method: POST
Schedule: Every 5 minutes
```

#### Option C: Server Cron Job

Add to your server's crontab:

```bash
*/5 * * * * curl -X POST https://your-domain.com/api/external-links/check
```

### 3. Build Configuration

The health check runs automatically before build via `prebuild` script.

To disable during build:

```bash
# Temporarily skip check
npm run build --ignore-scripts

# Or remove from package.json scripts
```

## Configuration

### Adding New External Links

Edit `src/config/external-links.ts`:

```typescript
export const externalLinks: ExternalLink[] = [
  {
    id: "my_new_link",
    label: "My New Link",
    labelCn: "我的新链接",
    url: "https://partner.example.com/trial",
    description: "Description of the link",
    productSlug: "my-product", // Optional
    checkMethod: "HEAD", // or "GET"
    expectedStatus: [200, 301, 302],
    timeout: 5000, // milliseconds
  },
  // ... other links
];
```

Then run:

```bash
npm run init:external-links
```

### Adjusting Failure Threshold

Edit `src/lib/external-link-health.ts`:

```typescript
const FAILURE_THRESHOLD = 3; // Change to your preferred value
```

Higher values = more tolerant of temporary failures
Lower values = faster detection of broken links

### Customizing Check Behavior

Per-link configuration:

```typescript
{
  id: "slow_site",
  url: "https://slow-site.com",
  timeout: 15000, // 15 seconds for slow sites
  checkMethod: "GET", // Use GET instead of HEAD
  expectedStatus: [200, 201, 301, 302, 307, 308], // Accept more status codes
}
```

## Monitoring

### View Health Dashboard

Navigate to: `https://your-domain.com/admin/external-links`

### Check Logs

Health check results are logged:

```bash
# View logs in production
pm2 logs your-app

# Or check Vercel logs
vercel logs
```

### Database Queries

```sql
-- View all link health
SELECT * FROM "ExternalLinkHealth";

-- Find broken links
SELECT * FROM "ExternalLinkHealth" WHERE status = 'unavailable';

-- Check recent failures
SELECT * FROM "ExternalLinkHealth" 
WHERE consecutiveFailures > 0 
ORDER BY lastCheckedAt DESC;
```

## Troubleshooting

### Issue: Button always shows as unavailable

**Solution:**
1. Check database: `SELECT * FROM "ExternalLinkHealth" WHERE linkId = 'your_link_id'`
2. Manually trigger check: `curl -X POST http://localhost:3000/api/external-links/check`
3. Verify URL is accessible: `curl -I https://your-external-url.com`
4. Check `consecutiveFailures` - may need to wait for threshold to reset

### Issue: Health check not running

**Solution:**
1. Verify cron job is configured correctly
2. Check API route is accessible: `curl http://localhost:3000/api/external-links/health`
3. Review server logs for errors
4. Ensure database connection is working

### Issue: Build fails due to external link check

**Solution:**
```bash
# Temporarily disable strict mode
STRICT_EXTERNAL_LINK_CHECK=false npm run build

# Or skip prebuild script
npm run build --ignore-scripts
```

### Issue: False positives (good links marked unavailable)

**Solution:**
1. Increase timeout in link config
2. Add more accepted status codes to `expectedStatus`
3. Increase `FAILURE_THRESHOLD` in `external-link-health.ts`
4. Check if site blocks HEAD requests (use GET instead)

## Testing

### Manual Testing

```bash
# Run health check
npm run check:external-links

# Initialize/reset health records
npm run init:external-links

# Test API endpoints
curl http://localhost:3000/api/external-links/health
curl -X POST http://localhost:3000/api/external-links/check
```

### Unit Tests

```bash
# Run tests (if vitest is configured)
npm test src/lib/__tests__/external-link-health.test.ts
```

### Integration Testing

1. Change a link URL to a 404 page in config
2. Run health check 3 times: `npm run check:external-links`
3. Verify button shows as disabled in UI
4. Check admin dashboard shows "Unavailable" status

## Security

### Protecting Admin Routes

Add authentication to `/admin/external-links`:

```typescript
// src/app/admin/external-links/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ExternalLinksAdminPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email?.endsWith("@yourdomain.com")) {
    redirect("/");
  }
  
  // ... rest of component
}
```

### Rate Limiting

Add rate limiting to health check endpoint:

```typescript
// src/app/api/external-links/check/route.ts
import { ratelimit } from "@/lib/redis"; // Your rate limiter

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }
  
  // ... rest of handler
}
```

## Next Steps

1. ✅ Set up periodic health checks (cron)
2. ✅ Add authentication to admin dashboard
3. ✅ Configure monitoring/alerts
4. ✅ Update all external links to use `ExternalLinkButton`
5. ✅ Test in staging environment
6. ✅ Deploy to production

## Support

For issues or questions:
- Check documentation: `docs/external-link-health-check.md`
- Review code: `src/lib/external-link-health.ts`
- View examples: `src/app/(landing)/_sections/products.tsx`
