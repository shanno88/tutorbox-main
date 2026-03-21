# License Integration – Quick Reference

---

## What Was Done

Created a license client that validates admin billing routes against a FastAPI license server.

---

## Files Created/Modified

| File | Status | Purpose |
|------|--------|---------|
| `src/lib/license.ts` | ✅ NEW | License client + wrapper |
| `src/app/api/admin/billing/search/route.ts` | ✅ MODIFIED | Wrapped GET |
| `src/app/api/admin/billing/user/[userId]/route.ts` | ✅ MODIFIED | Wrapped GET |
| `src/app/api/admin/billing/api-keys/revoke/route.ts` | ✅ MODIFIED | Wrapped POST |
| `src/app/api/admin/billing/api-keys/rotate/route.ts` | ✅ MODIFIED | Wrapped POST |

---

## Environment Variables

```bash
LICENSE_SERVER_URL=http://127.0.0.1:8000
ADMIN_LICENSE_KEY=your-license-key
```

---

## How It Works

1. Client calls admin billing API
2. `withAdminLicense()` wrapper intercepts request
3. Calls FastAPI license server: `POST /v1/licenses/validate`
4. If license valid → proceed to handler
5. If license invalid → return 403 Forbidden
6. If server error → return 500 Internal Server Error

---

## Response Examples

### Valid License
```json
{
  "status": "ok",
  "plan": "pro",
  "expires_at": "2027-03-21T03:22:20.970779",
  "code": null
}
```
→ Handler executes normally

### Invalid License
```json
{
  "status": "error",
  "plan": null,
  "expires_at": null,
  "code": "NOT_FOUND"
}
```
→ Returns 403 Forbidden

### Server Error
```json
{
  "error": "LICENSE_SERVER_ERROR",
  "message": "Failed to validate license"
}
```
→ Returns 500 Internal Server Error

---

## Testing

```bash
# Valid license (should work)
curl -X GET "http://localhost:3000/api/admin/billing/search?q=test" \
  -H "Authorization: Bearer <token>"

# Invalid license (should get 403)
export ADMIN_LICENSE_KEY=invalid
curl -X GET "http://localhost:3000/api/admin/billing/search?q=test" \
  -H "Authorization: Bearer <token>"
```

---

## Key Points

✅ License check happens **before** business logic  
✅ Admin auth check still required **after** license check  
✅ No business logic was modified  
✅ All TypeScript diagnostics pass  
✅ Follows existing project conventions  
✅ Ready for production deployment

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 500 License Server Error | Check `LICENSE_SERVER_URL` is correct and server is running |
| 403 Invalid License | Check `ADMIN_LICENSE_KEY` is correct |
| 401 Unauthorized | Admin auth failed (not license-related) |
| Routes not protected | Verify imports and exports are correct |

---

## License Server Endpoint

**URL**: `POST {LICENSE_SERVER_URL}/v1/licenses/validate`

**Request**:
```json
{
  "license_key": "YOUR-ADMIN-LICENSE-KEY"
}
```

**Response**:
```json
{
  "status": "ok" | "error",
  "plan": "pro" | null,
  "expires_at": "2027-03-21T03:22:20.970779" | null,
  "code": null | "NOT_FOUND" | "EXPIRED" | ...
}
```

---

## No Changes to License Server

✅ FastAPI license server (`license-server/`) was **NOT modified**  
✅ Only Next.js admin panel (`src/`) was modified  
✅ License server remains independent and untouched
