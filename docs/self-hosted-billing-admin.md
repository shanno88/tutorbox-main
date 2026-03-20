# Self-Hosted Billing Admin Guide

## What is `/admin/billing`?

A read-only admin dashboard for managing user subscriptions and API keys. **Admin-only access required.** Search users by email or ID, view their active subscriptions, and monitor API key usage.

## Required Setup

### Environment Variables
- `ADMIN_AUTH_SECRET` – Secret for admin authentication (must be set)

### Database Tables
Ensure these tables exist and are populated:
- `users` – User accounts (id, email, name)
- `subscriptions` – Active subscriptions (userId, paddleSubscriptionId, paddlePriceId, currentPeriodEnd)
- `apiKeys` – Issued API keys (userId, planId, keyHash, status, createdAt)
- `plans` – Plan definitions (id, slug, name, quotaPerMonth)
- `apiUsage` – Monthly usage tracking (userId, apiKeyId, year, month, used)

## 5-Step Verification Checklist

1. **Check Health Endpoint**
   ```bash
   curl https://your-domain.com/api/billing/health
   ```
   Should return `{ "status": "ok" }` with database and webhook checks.

2. **Verify Admin Auth**
   - Log in as an admin user
   - Navigate to `https://your-domain.com/admin/billing`
   - Should load without redirect (non-admins see 401)

3. **Test Search**
   - Search for a user by email (e.g., `test@example.com`)
   - Should return matching users with email, name, ID

4. **View Subscription Data**
   - Click a user to view details
   - Should show subscription status, plan, and period end date
   - Status badge should be green (active) or red (inactive)

5. **Verify API Key Display**
   - User details should show API keys with masked display (e.g., `tutorbox_abcd...1234`)
   - Never shows full key
   - Should display monthly quota and current usage

## Troubleshooting

- **404 on `/admin/billing`**: Check `ADMIN_AUTH_SECRET` is set and user is admin
- **No users found**: Verify `users` table is populated
- **Missing subscriptions**: Check `subscriptions` table has records with valid `userId`
- **Health check fails**: Review database connectivity and table schemas

See `docs/BILLING_FLOW.md` for detailed billing architecture.
