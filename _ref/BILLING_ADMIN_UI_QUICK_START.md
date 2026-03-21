# Billing Admin UI – Quick Start Guide

**Status**: ✅ Ready to Use

---

## Access the UI

1. Navigate to: `https://your-domain.com/admin/billing`
2. You must be authenticated as an admin (uses existing `checkAdminAuth()`)
3. Non-admins are automatically redirected to home page

---

## How to Use

### Search for a User

1. In the left panel, enter search query in the "Search User" field
2. Search by:
   - **Email**: Partial match, case-insensitive (e.g., "john" finds "john@example.com")
   - **User ID**: Prefix match (e.g., "user_123" finds "user_123abc...")
3. Minimum 2 characters required
4. Results appear as clickable cards below the search box
5. Click on a user card to view their details

### View User Details

Once a user is selected, the right panel shows:

**User Information**
- Email
- Name (if available)
- User ID

**Subscription** (if exists)
- Status badge (green = active, red = expired)
- Paddle Subscription ID
- Paddle Customer ID
- Price ID
- Current Period End date

**API Keys** (if any)
- Plan name and slug
- Status badge (green = active, yellow = expired, red = revoked)
- Masked key (first 4 + last 4 chars only)
- Created date
- Expiration date (or "Never")
- Rate limit (requests per minute)
- Quota (requests per month)
- Current month usage with progress bar
  - Green: < 70% used
  - Yellow: 70-90% used
  - Red: > 90% used

---

## API Endpoints

### Search Users
```
GET /api/admin/billing/search?q=<query>

Query: email or userId (minimum 2 chars)
Returns: { users: [{ id, email, name }] }
Limit: 10 results
Auth: Admin only
```

### Get User Details
```
GET /api/admin/billing/user/<userId>

Returns: {
  user: { id, email, name },
  subscription: { ... } or null,
  apiKeys: [{ id, keyHash, status, ... }]
}
Auth: Admin only
```

---

## Key Features

✅ **Search by email or userId** – Partial/prefix matching
✅ **View subscriptions** – Paddle details and status
✅ **View API keys** – Masked display, never shows full key
✅ **Usage tracking** – Current month usage with progress bar
✅ **Status indicators** – Color-coded badges
✅ **Responsive design** – Works on desktop and mobile
✅ **Admin-only access** – Automatic auth check
✅ **Read-only** – No mutations or dangerous operations

---

## Security

- ✅ Admin-only access (both page and API)
- ✅ Masked API key display (first 4 + last 4 chars only)
- ✅ No full keys returned to frontend
- ✅ No sensitive data in logs
- ✅ Proper error handling

---

## Troubleshooting

### "Unauthorized" Error
- You are not authenticated as an admin
- Check your admin auth configuration in `@/lib/admin-auth`

### "User not found"
- The user ID doesn't exist in the database
- Try searching by email instead

### No API keys shown
- The user has no API keys issued yet
- This is normal for new users

### No subscription shown
- The user has no active subscription
- This is normal for trial users or users without paid plans

### Search returns no results
- Try a different search term
- Minimum 2 characters required
- Search is case-insensitive for email

---

## Files

| File | Purpose |
|------|---------|
| `src/app/admin/billing/page.tsx` | Main page |
| `src/app/admin/billing/search-form.tsx` | Search component |
| `src/app/admin/billing/user-details.tsx` | Details component |
| `src/app/api/admin/billing/search/route.ts` | Search API |
| `src/app/api/admin/billing/user/[userId]/route.ts` | Details API |
| `src/app/admin/layout.tsx` | Navigation (updated) |

---

## Next Steps

- [ ] Test search functionality
- [ ] Test user details display
- [ ] Verify masked keys are working
- [ ] Test on mobile
- [ ] Verify admin auth check
- [ ] Add to admin documentation

---

## Future Enhancements

- Add API key revoke/rotate
- Add subscription management
- Add pagination
- Add export to CSV
- Add audit logging
- Add filters and sorting

