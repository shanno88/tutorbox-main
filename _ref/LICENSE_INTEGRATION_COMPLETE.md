# License Integration – Admin Billing Routes Protected

**Date**: March 20, 2026  
**Status**: ✅ COMPLETE

---

## Summary

Successfully integrated FastAPI license server validation into the Next.js admin billing API routes. All four specified admin billing endpoints now require a valid license before processing requests.

---

## Changes Made

### 1. Created License Client (`src/lib/license.ts`)

**File**: `src/lib/license.ts` (new)

**Exports**:
- `LicenseStatus` type: `"ok" | "error"`
- `LicenseCheckResponse` interface: Response from FastAPI license server
- `validateAdminLicense()`: Async function to validate license with FastAPI server
- `withAdminLicense()`: Wrapper function to protect route handlers

**Key Features**:
- Reads `LICENSE_SERVER_URL` and `ADMIN_LICENSE_KEY` from environment variables
- Calls FastAPI endpoint: `POST {LICENSE_SERVER_URL}/v1/licenses/validate`
- Returns 403 Forbidden if license is invalid
- Returns 500 Internal Server Error if license server is unreachable
- Includes detailed error logging with `[license]` prefix

**Environment Variables Required**:
```
LICENSE_SERVER_URL=http://127.0.0.1:8000
ADMIN_LICENSE_KEY=YOUR-ADMIN-LICENSE-KEY
```

---

### 2. Protected Admin Billing Routes

All four routes now wrapped with `withAdminLicense()`:

#### Route 1: Search Users
**File**: `src/app/api/admin/billing/search/route.ts`
- **Method**: GET
- **Endpoint**: `/api/admin/billing/search?q=<query>`
- **Changes**: 
  - Renamed `export async function GET` → `async function handleGet`
  - Added import: `import { withAdminLicense } from "@/lib/license"`
  - Added export: `export const GET = withAdminLicense(handleGet)`

#### Route 2: Get User Details
**File**: `src/app/api/admin/billing/user/[userId]/route.ts`
- **Method**: GET
- **Endpoint**: `/api/admin/billing/user/[userId]`
- **Changes**:
  - Renamed `export async function GET` → `async function handleGet`
  - Added import: `import { withAdminLicense } from "@/lib/license"`
  - Added export: `export const GET = withAdminLicense(handleGet)`

#### Route 3: Revoke API Key
**File**: `src/app/api/admin/billing/api-keys/revoke/route.ts`
- **Method**: POST
- **Endpoint**: `/api/admin/billing/api-keys/revoke`
- **Changes**:
  - Renamed `export async function POST` → `async function handlePost`
  - Added import: `import { withAdminLicense } from "@/lib/license"`
  - Added export: `export const POST = withAdminLicense(handlePost)`

#### Route 4: Rotate API Key
**File**: `src/app/api/admin/billing/api-keys/rotate/route.ts`
- **Method**: POST
- **Endpoint**: `/api/admin/billing/api-keys/rotate`
- **Changes**:
  - Renamed `export async function POST` → `async function handlePost`
  - Added import: `import { withAdminLicense } from "@/lib/license"`
  - Added export: `export const POST = withAdminLicense(handlePost)`

---

## Request/Response Flow

### Before License Check Fails

```
Client Request
    ↓
withAdminLicense wrapper
    ↓
validateAdminLicense() → FastAPI server
    ↓
License invalid (status !== "ok")
    ↓
Response: 403 Forbidden
{
  "error": "INVALID_LICENSE",
  "code": "NOT_FOUND" (or other error code from license server)
}
```

### After License Check Passes

```
Client Request
    ↓
withAdminLicense wrapper
    ↓
validateAdminLicense() → FastAPI server
    ↓
License valid (status === "ok")
    ↓
Original handler executes
    ↓
Response: 200 OK (or other status from handler)
```

### License Server Error

```
Client Request
    ↓
withAdminLicense wrapper
    ↓
validateAdminLicense() → FastAPI server (unreachable/error)
    ↓
Exception caught
    ↓
Response: 500 Internal Server Error
{
  "error": "LICENSE_SERVER_ERROR",
  "message": "Failed to validate license"
}
```

---

## Security Considerations

1. **License Check First**: License validation happens before any business logic
2. **Admin Auth Still Required**: Routes still check `checkAdminAuth()` after license validation
3. **No Plain Keys Logged**: License validation errors don't expose sensitive data
4. **Environment Variables**: License server URL and key are environment-based, not hardcoded
5. **Error Handling**: Graceful error handling with appropriate HTTP status codes

---

## Testing Checklist

To verify the integration works:

1. **Set Environment Variables**:
   ```bash
   export LICENSE_SERVER_URL=http://127.0.0.1:8000
   export ADMIN_LICENSE_KEY=your-test-license-key
   ```

2. **Test with Valid License**:
   ```bash
   curl -X GET "http://localhost:3000/api/admin/billing/search?q=test" \
     -H "Authorization: Bearer <admin-token>"
   # Expected: 200 OK (or 401 if admin auth fails)
   ```

3. **Test with Invalid License**:
   ```bash
   export ADMIN_LICENSE_KEY=invalid-key
   curl -X GET "http://localhost:3000/api/admin/billing/search?q=test" \
     -H "Authorization: Bearer <admin-token>"
   # Expected: 403 Forbidden with { "error": "INVALID_LICENSE" }
   ```

4. **Test with License Server Down**:
   ```bash
   # Stop the FastAPI license server
   curl -X GET "http://localhost:3000/api/admin/billing/search?q=test" \
     -H "Authorization: Bearer <admin-token>"
   # Expected: 500 Internal Server Error with { "error": "LICENSE_SERVER_ERROR" }
   ```

---

## Code Quality

✅ **TypeScript Diagnostics**: All files pass without errors
✅ **No Business Logic Changes**: Only wrapped handlers, no logic modified
✅ **Consistent Style**: Follows existing project conventions
✅ **Error Handling**: Comprehensive error handling with logging
✅ **Documentation**: JSDoc comments on all exported functions

---

## Files Modified

| File | Type | Changes |
|------|------|---------|
| `src/lib/license.ts` | New | License client + wrapper function |
| `src/app/api/admin/billing/search/route.ts` | Modified | Wrapped GET handler |
| `src/app/api/admin/billing/user/[userId]/route.ts` | Modified | Wrapped GET handler |
| `src/app/api/admin/billing/api-keys/revoke/route.ts` | Modified | Wrapped POST handler |
| `src/app/api/admin/billing/api-keys/rotate/route.ts` | Modified | Wrapped POST handler |

---

## Deployment Notes

1. **Environment Setup**: Ensure `LICENSE_SERVER_URL` and `ADMIN_LICENSE_KEY` are set in production
2. **License Server Availability**: The FastAPI license server must be accessible from the Next.js app
3. **Network Configuration**: If license server is on a different host, ensure network connectivity
4. **Monitoring**: Monitor license validation failures in logs (look for `[license]` prefix)
5. **Fallback**: If license server is down, all admin billing routes will return 500 errors

---

## Next Steps

1. Deploy the FastAPI license server (if not already running)
2. Set environment variables in production
3. Test all four protected routes with valid and invalid licenses
4. Monitor logs for any license validation issues
5. Consider adding license validation caching if performance becomes a concern

---

## Summary

✅ License client created in `src/lib/license.ts`  
✅ All 4 admin billing routes wrapped with `withAdminLicense()`  
✅ No business logic modified, only wrapped  
✅ All TypeScript diagnostics pass  
✅ Ready for deployment
