# Billing Admin UI – Complete Code Reference

**Date**: March 20, 2026
**Status**: ✅ Production Ready

---

## File 1: Main Page (`src/app/admin/billing/page.tsx`)

```typescript
"use client";

import { useState } from "react";
import { SearchForm } from "./search-form";
import { UserDetails } from "./user-details";

export default function BillingAdminPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Billing</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search Form */}
        <div className="lg:col-span-1">
          <SearchForm onUserSelect={setSelectedUserId} />
        </div>

        {/* User Details */}
        <div className="lg:col-span-2">
          {selectedUserId ? (
            <UserDetails userId={selectedUserId} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Select a user to view their billing details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## File 2: Search Form Component (`src/app/admin/billing/search-form.tsx`)

```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface SearchFormProps {
  onUserSelect: (userId: string) => void;
}

export function SearchForm({ onUserSelect }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/billing/search?q=${encodeURIComponent(query)}`
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setResults(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search User
        </label>
        <input
          type="text"
          placeholder="Search by email or user ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      {loading && (
        <Card className="p-4">
          <p className="text-sm text-gray-600">Searching...</p>
        </Card>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <Card className="p-4">
          <p className="text-sm text-gray-600">No users found</p>
        </Card>
      )}

      {results.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Found {results.length} user{results.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => onUserSelect(user.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.email}</p>
                    {user.name && (
                      <p className="text-sm text-gray-600">{user.name}</p>
                    )}
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {user.id}
                    </p>
                  </div>
                  <span className="text-blue-600 text-sm font-medium">
                    View →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
```

---

## File 3: User Details Component (`src/app/admin/billing/user-details.tsx`)

```typescript
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Subscription {
  userId: string;
  paddleSubscriptionId: string;
  paddleCustomerId: string;
  paddlePriceId: string;
  currentPeriodEnd: Date;
}

interface ApiKey {
  id: number;
  keyHash: string;
  status: string;
  expiresAt: Date | null;
  createdAt: Date;
  planSlug: string;
  planName: string;
  rateLimitPerMin: number;
  quotaPerMonth: number;
  currentMonthUsage: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface UserDetailsProps {
  userId: string;
}

export function UserDetails({ userId }: UserDetailsProps) {
  const [data, setData] = useState<{
    user: User;
    subscription: Subscription | null;
    apiKeys: ApiKey[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/billing/user/${encodeURIComponent(userId)}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("User not found");
          }
          throw new Error("Failed to fetch user details");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [userId]);

  if (loading) {
    return (
      <Card className="p-8">
        <p className="text-sm text-gray-600">Loading user details...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 bg-red-50 border-red-200">
        <p className="text-sm text-red-800">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { user, subscription, apiKeys } = data;
  const now = new Date();
  const isSubscriptionActive =
    subscription &&
    new Date(subscription.currentPeriodEnd) > now;

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">User Information</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          {user.name && (
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">User ID</p>
            <p className="font-mono text-sm text-gray-700">{user.id}</p>
          </div>
        </div>
      </Card>

      {/* Subscription */}
      {subscription ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Subscription</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  isSubscriptionActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {isSubscriptionActive ? "Active" : "Expired"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paddle Subscription ID</p>
              <p className="font-mono text-sm text-gray-700">
                {subscription.paddleSubscriptionId}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paddle Customer ID</p>
              <p className="font-mono text-sm text-gray-700">
                {subscription.paddleCustomerId}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Price ID</p>
              <p className="font-mono text-sm text-gray-700">
                {subscription.paddlePriceId}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Period End</p>
              <p className="font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-gray-50">
          <p className="text-sm text-gray-600">No active subscription</p>
        </Card>
      )}

      {/* API Keys */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">API Keys</h2>
        {apiKeys.length === 0 ? (
          <p className="text-sm text-gray-600">No API keys</p>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => {
              const isExpired =
                key.expiresAt && new Date(key.expiresAt) < now;
              const isActive = key.status === "active" && !isExpired;
              const usagePercent = Math.round(
                (key.currentMonthUsage / key.quotaPerMonth) * 100
              );

              return (
                <div
                  key={key.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {key.planSlug}
                      </p>
                      <p className="text-sm text-gray-600">{key.planName}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        isActive
                          ? "bg-green-100 text-green-800"
                          : isExpired
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {isExpired ? "Expired" : isActive ? "Active" : "Revoked"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Key</p>
                      <p className="font-mono text-gray-700">
                        {key.keyHash.substring(0, 4)}...
                        {key.keyHash.substring(key.keyHash.length - 4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="text-gray-700">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Rate Limit</p>
                      <p className="text-gray-700">
                        {key.rateLimitPerMin} req/min
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Expires</p>
                      <p className="text-gray-700">
                        {key.expiresAt
                          ? new Date(key.expiresAt).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">Monthly Usage</p>
                      <p className="text-sm font-medium text-gray-700">
                        {key.currentMonthUsage.toLocaleString()} /{" "}
                        {key.quotaPerMonth.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-colors ${
                          usagePercent > 90
                            ? "bg-red-500"
                            : usagePercent > 70
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {usagePercent}% used
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
```

---

## File 4: Search API Route (`src/app/api/admin/billing/search/route.ts`)

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { ilike, or } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(req: Request) {
  // ADMIN ONLY: Check admin auth
  if (!checkAdminAuth()) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return Response.json({ users: [] });
  }

  try {
    // Search by email (case-insensitive) or userId (prefix match)
    const results = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(
        or(
          ilike(users.email, `%${query}%`),
          ilike(users.id, `${query}%`)
        )
      )
      .limit(10);

    return Response.json({ users: results });
  } catch (error) {
    console.error("[admin:billing:search]", error);
    return Response.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
```

---

## File 5: User Details API Route (`src/app/api/admin/billing/user/[userId]/route.ts`)

```typescript
import { db } from "@/db";
import { subscriptions, apiKeys, plans, apiUsage, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  // ADMIN ONLY: Check admin auth
  if (!checkAdminAuth()) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = params.userId;

  try {
    // Get user info
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Get subscription
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    // Get API keys with plan details
    const apiKeysData = await db
      .select({
        id: apiKeys.id,
        keyHash: apiKeys.keyHash,
        status: apiKeys.status,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
        planId: apiKeys.planId,
        planSlug: plans.slug,
        planName: plans.name,
        rateLimitPerMin: plans.rateLimitPerMin,
        quotaPerMonth: plans.quotaPerMonth,
      })
      .from(apiKeys)
      .innerJoin(plans, eq(apiKeys.planId, plans.id))
      .where(eq(apiKeys.userId, userId))
      .orderBy(apiKeys.createdAt);

    // Get current month usage for each API key
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const usageData = await db
      .select({
        apiKeyId: apiUsage.apiKeyId,
        used: apiUsage.used,
      })
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.userId, userId),
          eq(apiUsage.year, currentYear),
          eq(apiUsage.month, currentMonth)
        )
      );

    const usageMap = new Map(usageData.map((u) => [u.apiKeyId, u.used]));

    // Enrich API keys with usage data
    const apiKeysWithUsage = apiKeysData.map((key) => ({
      ...key,
      currentMonthUsage: usageMap.get(key.id) || 0,
    }));

    return Response.json({
      user: user[0],
      subscription: subscription[0] || null,
      apiKeys: apiKeysWithUsage,
    });
  } catch (error) {
    console.error("[admin:billing:user]", error);
    return Response.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}
```

---

## File 6: Updated Admin Layout (`src/app/admin/layout.tsx`)

```typescript
import { checkAdminAuth } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ADMIN ONLY: Check admin auth
  if (!checkAdminAuth()) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="font-bold text-lg">
                Admin
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/admin/users"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Users
                </Link>
                <Link
                  href="/admin/billing"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Billing
                </Link>
                <Link
                  href="/admin/api-keys"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  API Keys
                </Link>
                <Link
                  href="/admin/plans"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Plans
                </Link>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              🔒 Admin Mode
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
```

---

## Summary

All files are complete, tested, and production-ready. The implementation:

✅ Uses existing admin auth (`checkAdminAuth()`)
✅ Masks API keys (never returns full key)
✅ Read-only (no mutations)
✅ Responsive design
✅ Proper error handling
✅ All TypeScript checks pass

