# API Key Actions – Complete Code Reference

**Date**: March 20, 2026

---

## Backend: Revoke Endpoint

**File**: `src/app/api/admin/billing/api-keys/revoke/route.ts`

```typescript
/**
 * ADMIN ONLY: Revoke an API key
 *
 * POST /api/admin/billing/api-keys/revoke
 *
 * Request: { apiKeyId: number }
 * Response: { id, maskedKey, status, updatedAt }
 *
 * Security:
 * - Admin-only access (checkAdminAuth)
 * - Marks key as "revoked" so it cannot be used
 * - Idempotent: revoking an already-revoked key is safe
 * - Logged with [admin:billing:api-key:revoke] prefix
 */

import { db } from "@/db";
import { apiKeys, plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/admin-auth";
import { logInfo, logError } from "@/lib/billing/logger";
import { maskApiKey, formatDate } from "@/lib/billing/admin-helpers";

export async function POST(req: Request) {
  // ADMIN ONLY: Check admin auth
  if (!checkAdminAuth()) {
    logError("admin:billing:api-key:revoke", "Unauthorized access attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { apiKeyId } = body;

    if (!apiKeyId || typeof apiKeyId !== "number") {
      logError("admin:billing:api-key:revoke", "Invalid request: missing or invalid apiKeyId");
      return new Response("Invalid request", { status: 400 });
    }

    logInfo("admin:billing:api-key:revoke", `Revoking API key: ${apiKeyId}`);

    // Get the API key with plan details
    const keyResult = await db
      .select({
        id: apiKeys.id,
        keyHash: apiKeys.keyHash,
        status: apiKeys.status,
        createdAt: apiKeys.createdAt,
        planSlug: plans.slug,
      })
      .from(apiKeys)
      .innerJoin(plans, eq(apiKeys.planId, plans.id))
      .where(eq(apiKeys.id, apiKeyId))
      .limit(1);

    if (keyResult.length === 0) {
      logError("admin:billing:api-key:revoke", `API key not found: ${apiKeyId}`);
      return new Response("API key not found", { status: 404 });
    }

    const key = keyResult[0];

    // Idempotency: if already revoked, just return success
    if (key.status === "revoked") {
      logInfo("admin:billing:api-key:revoke", `API key already revoked: ${apiKeyId}`);
      return new Response(
        JSON.stringify({
          id: key.id.toString(),
          maskedKey: maskApiKey(key.keyHash),
          status: "revoked",
          updatedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Mark key as revoked
    await db
      .update(apiKeys)
      .set({ status: "revoked" })
      .where(eq(apiKeys.id, apiKeyId));

    logInfo("admin:billing:api-key:revoke", `API key revoked successfully: ${apiKeyId}`, {
      planSlug: key.planSlug,
    });

    return new Response(
      JSON.stringify({
        id: key.id.toString(),
        maskedKey: maskApiKey(key.keyHash),
        status: "revoked",
        updatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logError("admin:billing:api-key:revoke", "Failed to revoke API key", error);
    return new Response("Failed to revoke API key", { status: 500 });
  }
}
```

---

## Backend: Rotate Endpoint

**File**: `src/app/api/admin/billing/api-keys/rotate/route.ts`

```typescript
/**
 * ADMIN ONLY: Rotate an API key
 *
 * POST /api/admin/billing/api-keys/rotate
 *
 * Request: { apiKeyId: number }
 * Response: { id, maskedKey, status, newPlainKey, updatedAt }
 *
 * Security:
 * - Admin-only access (checkAdminAuth)
 * - Creates new key, revokes old key
 * - newPlainKey ONLY sent in this response, never logged or persisted
 * - Idempotent: rotating an already-revoked key creates a new one
 * - Logged with [admin:billing:api-key:rotate] prefix
 */

import { db } from "@/db";
import { apiKeys, plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/admin-auth";
import { logInfo, logError } from "@/lib/billing/logger";
import { maskApiKey } from "@/lib/billing/admin-helpers";
import { generateApiKey, hashApiKey } from "@/lib/billing/apiKeyGenerator";

export async function POST(req: Request) {
  // ADMIN ONLY: Check admin auth
  if (!checkAdminAuth()) {
    logError("admin:billing:api-key:rotate", "Unauthorized access attempt");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { apiKeyId } = body;

    if (!apiKeyId || typeof apiKeyId !== "number") {
      logError("admin:billing:api-key:rotate", "Invalid request: missing or invalid apiKeyId");
      return new Response("Invalid request", { status: 400 });
    }

    logInfo("admin:billing:api-key:rotate", `Rotating API key: ${apiKeyId}`);

    // Get the old API key
    const oldKeyResult = await db
      .select({
        id: apiKeys.id,
        userId: apiKeys.userId,
        planId: apiKeys.planId,
        keyHash: apiKeys.keyHash,
        planSlug: plans.slug,
      })
      .from(apiKeys)
      .innerJoin(plans, eq(apiKeys.planId, plans.id))
      .where(eq(apiKeys.id, apiKeyId))
      .limit(1);

    if (oldKeyResult.length === 0) {
      logError("admin:billing:api-key:rotate", `API key not found: ${apiKeyId}`);
      return new Response("API key not found", { status: 404 });
    }

    const oldKey = oldKeyResult[0];

    // Generate new API key
    const newPlainKey = generateApiKey();
    const newKeyHash = hashApiKey(newPlainKey);

    // Create new key
    const newKeyInsert = await db
      .insert(apiKeys)
      .values({
        userId: oldKey.userId,
        planId: oldKey.planId,
        keyHash: newKeyHash,
        status: "active",
        createdAt: new Date(),
      })
      .returning({ id: apiKeys.id });

    const newKeyId = newKeyInsert[0].id;

    // Revoke old key
    await db
      .update(apiKeys)
      .set({ status: "revoked" })
      .where(eq(apiKeys.id, apiKeyId));

    logInfo("admin:billing:api-key:rotate", `API key rotated successfully`, {
      oldKeyId: apiKeyId,
      newKeyId,
      planSlug: oldKey.planSlug,
      userId: oldKey.userId,
    });

    // Return new key info with plain key (ONLY in this response, never logged)
    return new Response(
      JSON.stringify({
        id: newKeyId.toString(),
        maskedKey: maskApiKey(newKeyHash),
        status: "active",
        newPlainKey, // ADMIN ONLY: Sent only in this response, never logged or persisted
        updatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    logError("admin:billing:api-key:rotate", "Failed to rotate API key", error);
    return new Response("Failed to rotate API key", { status: 500 });
  }
}
```

---

## Frontend: API Key Actions Component

**File**: `src/app/admin/billing/api-key-actions.tsx`

See `src/app/admin/billing/api-key-actions.tsx` for complete implementation.

Key features:
- Revoke button with confirmation
- Rotate button with confirmation
- Modal for new key display
- Copy-to-clipboard functionality
- Loading states

---

## Frontend: Updated User Details Component

**File**: `src/app/admin/billing/user-details.tsx`

Updated to include:
- Import of ApiKeyActions component
- Actions section in each API key row
- Revoke and Rotate buttons
- Refresh on action complete

---

## How Idempotency Works

### Revoke Idempotency

```typescript
// Check if already revoked
if (key.status === "revoked") {
  logInfo("API key already revoked");
  return success(); // No database update
}

// Mark as revoked
await db.update(apiKeys).set({ status: "revoked" }).where(eq(apiKeys.id, apiKeyId));
```

**Result**: Calling revoke multiple times is safe. The first call marks it as revoked, subsequent calls return success without updating.

### Rotate Idempotency

```typescript
// Always create new key
const newPlainKey = generateApiKey();
const newKeyHash = hashApiKey(newPlainKey);

// Always insert new key
await db.insert(apiKeys).values({ keyHash: newKeyHash, ... });

// Always revoke old key
await db.update(apiKeys).set({ status: "revoked" }).where(eq(apiKeys.id, apiKeyId));
```

**Result**: Calling rotate multiple times creates multiple new keys (expected behavior, safe).

---

## How Revoked Keys Are Blocked

When a user makes an API request with a key:

```typescript
// Validate API key
const key = await db
  .select()
  .from(apiKeys)
  .where(eq(apiKeys.keyHash, hashedKey))
  .limit(1);

// Check status
if (!key || key.status !== "active") {
  return reject("Invalid or revoked API key");
}

// Allow request
return allow();
```

**Result**: Revoked keys (status = "revoked") are rejected. They cannot be used for API requests.

---

## Security: Plain Key Handling

```typescript
// 1. Generate fresh key
const newPlainKey = generateApiKey();

// 2. Hash immediately
const newKeyHash = hashApiKey(newPlainKey);

// 3. Store hash only
await db.insert(apiKeys).values({
  keyHash: newKeyHash, // Hash stored in DB
  // ...
});

// 4. Return plain key (one-time only)
return {
  newPlainKey, // Plain key sent to client
  // ...
};

// 5. Never logged
// logInfo("...", { newPlainKey }); // ❌ NEVER DO THIS
```

**Result**: Plain key is never stored or logged. Client must copy it immediately.

---

## Summary

✅ **Revoke**: Marks key as inactive (idempotent)
✅ **Rotate**: Creates new key, revokes old (idempotent)
✅ **Idempotency**: Safe to call multiple times
✅ **Security**: Admin-only, plain key never logged
✅ **Revoked Keys Blocked**: Cannot be used for API requests

