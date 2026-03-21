# Billing Admin System – Quick Reference Guide

**Date**: March 20, 2026

---

## Accessing the Admin UI

**URL**: `https://your-domain.com/admin/billing`

**Requirements**:
- Must be logged in as an admin user
- Admin auth is checked via `checkAdminAuth()` function
- Non-admin users are redirected to home page

---

## Searching for Users

### By Email

1. Click on the search box
2. Type an email address (e.g., `john@example.com`)
3. Results appear after 300ms debounce
4. Click on a user to view their details

**Features**:
- Case-insensitive search
- Partial match (e.g., `john` matches `john@example.com`)
- Returns up to 10 results

### By User ID

1. Click on the search box
2. Type a user ID (e.g., `user_123abc`)
3. Results appear after 300ms debounce
4. Click on a user to view their details

**Features**:
- Prefix match (e.g., `user_123` matches `user_123abc`)
- Returns up to 10 results

---

## Viewing User Details

Once you select a user, you'll see three sections:

### 1. User Information

- **Email**: User's email address
- **User ID**: Unique identifier
- **Created**: Account creation date

### 2. Subscriptions

Shows all active and past subscriptions:

- **Plan Slug**: Internal plan identifier (e.g., `grammar-master-yearly-usd`)
- **Provider**: Payment provider (Paddle or DoDo)
- **Status**: Active, Past Due, Trialing, or Canceled
- **Status Badge**: Color-coded indicator
  - 🟢 Green = Active
  - 🔴 Red = Inactive
- **Period Dates**: Subscription start and end dates
- **Provider ID**: Payment provider's subscription ID

### 3. API Keys

Shows all API keys for this user:

- **Masked Key**: Partially masked key (e.g., `tutorbox_abcd...1234`)
  - Never shows the full key for security
- **Plan Slug**: Associated plan
- **Status**: Active or Revoked
- **Status Badge**: Color-coded indicator
  - 🟢 Green = Active
  - 🔴 Red = Revoked
  - ⚫ Gray = Expired
- **Created**: Key creation date
- **Expires**: Expiration date (or "Never" if no expiration)
- **Monthly Usage**: Current month usage with progress bar
  - 🟢 Green = < 70% used
  - 🟡 Yellow = 70-90% used
  - 🔴 Red = > 90% used

---

## API Endpoints (for developers)

### Search Endpoint

**URL**: `GET /api/admin/billing/search?q=<query>`

**Parameters**:
- `q` (required): Email or user ID (minimum 2 characters)

**Response**:
```json
{
  "users": [
    {
      "id": "user_123abc",
      "email": "john@example.com",
      "name": "John Doe",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

**Example**:
```bash
curl "http://localhost:3000/api/admin/billing/search?q=john@example.com"
```

### User Details Endpoint

**URL**: `GET /api/admin/billing/user/[userId]`

**Parameters**:
- `userId` (required): User ID from path

**Response**:
```json
{
  "user": {
    "id": "user_123abc",
    "email": "john@example.com",
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "subscriptions": [
    {
      "id": "sub_123",
      "provider": "paddle",
      "productKey": "grammar-master",
      "planSlug": "grammar-master-yearly-usd",
      "status": "active",
      "currentPeriodStart": "2025-01-15T00:00:00.000Z",
      "currentPeriodEnd": "2026-01-15T00:00:00.000Z",
      "providerSubscriptionId": "sub_paddle_123",
      "updatedAt": "2025-01-15T00:00:00.000Z"
    }
  ],
  "apiKeys": [
    {
      "id": "1",
      "maskedKey": "tutorbox_abcd...1234",
      "productKey": "grammar-master",
      "planSlug": "grammar-master-yearly-usd",
      "status": "active",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "expiresAt": null,
      "lastUsedAt": null,
      "currentMonthUsage": 45230,
      "monthlyQuota": 100000
    }
  ]
}
```

**Example**:
```bash
curl "http://localhost:3000/api/admin/billing/user/user_123abc"
```

---

## Common Tasks

### Find a User by Email

1. Go to `/admin/billing`
2. Type the email in the search box
3. Click on the user in the results

### Check a User's Subscription Status

1. Search for the user
2. Look at the "Subscriptions" section
3. Check the status badge (green = active, red = inactive)
4. Check the "Period End" date

### Check a User's API Key Usage

1. Search for the user
2. Look at the "API Keys" section
3. Check the "Monthly Usage" progress bar
4. Green = < 70%, Yellow = 70-90%, Red = > 90%

### Find Users with Expiring API Keys

1. Search for the user
2. Look at the "API Keys" section
3. Check the "Expires" date
4. If expired, the status badge will show "Expired" in gray

### Find Users with High API Usage

1. Search for the user
2. Look at the "API Keys" section
3. Check the "Monthly Usage" progress bar
4. Red progress bar = > 90% used

---

## Troubleshooting

### Search Returns No Results

- Check that the query is at least 2 characters
- For email search, make sure the email contains `@`
- For user ID search, make sure you're using the correct ID format

### User Not Found (404)

- The user ID might be incorrect
- Try searching by email instead
- Check that the user exists in the database

### Unauthorized (401)

- You must be logged in as an admin user
- Check that your admin auth is configured correctly
- Try logging out and logging back in

### API Key Masking

- API keys are always masked for security
- You'll see `tutorbox_abcd...1234` instead of the full key
- This is intentional and cannot be changed

---

## Security Notes

### Admin-Only Access

- Both the UI and API endpoints are admin-only
- Non-admin users cannot access this page
- All requests are logged with `[admin:billing:*]` prefixes

### API Key Masking

- API keys are never returned in full
- Only the first 4 and last 4 characters are shown
- The full key is never exposed in the UI or API

### No Sensitive Data

- Password hashes are never returned
- Tokens are never returned
- Only masked keys are displayed

---

## Logging

All admin billing operations are logged with structured logging:

**Search Logs**:
```
[admin:billing:search] Searching for: john@example.com
[admin:billing:search] Found 1 user(s) { query: "john@example.com", isEmail: true }
```

**User Details Logs**:
```
[admin:billing:user] Fetching details for user: user_123abc
[admin:billing:user] Fetched details for user: user_123abc { subscriptionCount: 1, apiKeyCount: 2 }
```

**Error Logs**:
```
[admin:billing:search] Search failed { error: "..." }
[admin:billing:user] Failed to fetch user details { error: "..." }
```

---

## Future Features

### Phase 2 (Planned)

- [ ] Revoke API keys
- [ ] Rotate API keys
- [ ] Cancel subscriptions
- [ ] Extend trial periods

### Phase 3 (Planned)

- [ ] Add pagination for search results
- [ ] Add filters (by status, plan, etc.)
- [ ] Add sorting options
- [ ] Add export to CSV

---

## Support

For issues or questions:

1. Check the logs: `[admin:billing:*]` prefix
2. Verify admin auth is configured
3. Check database connectivity
4. Review the full documentation in `BILLING_ADMIN_SYSTEM_COMPLETE.md`

