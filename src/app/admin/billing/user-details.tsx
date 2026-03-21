"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { ApiKeyActions } from "./api-key-actions";

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface Subscription {
  id: string;
  provider: "paddle" | "dodo";
  productKey: string;
  planSlug: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  providerSubscriptionId?: string;
  updatedAt: string;
}

interface ApiKey {
  id: string;
  maskedKey: string;
  productKey: string;
  planSlug: string;
  status: "active" | "revoked";
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  currentMonthUsage?: number;
  monthlyQuota?: number;
}

interface UserDetailsProps {
  userId: string;
}

export function UserDetails({ userId }: UserDetailsProps) {
  const [data, setData] = useState<{
    user: User;
    subscriptions: Subscription[];
    apiKeys: ApiKey[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tLicense = useTranslations("license");

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

  const { user, subscriptions, apiKeys } = data;
  const now = new Date();

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
          <div>
            <p className="text-sm text-gray-600">User ID</p>
            <p className="font-mono text-sm text-gray-700">{user.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="text-sm text-gray-700">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Subscriptions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Subscriptions</h2>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-gray-600">No subscriptions</p>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => {
              const isActive =
                sub.status === "active" &&
                (!sub.currentPeriodEnd ||
                  new Date(sub.currentPeriodEnd) > now);

              return (
                <div
                  key={sub.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {sub.planSlug}
                      </p>
                      <p className="text-sm text-gray-600">
                        {sub.provider.toUpperCase()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="text-gray-700">{sub.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Provider ID</p>
                      <p className="font-mono text-xs text-gray-700">
                        {sub.providerSubscriptionId?.substring(0, 12)}...
                      </p>
                    </div>
                    {sub.currentPeriodStart && (
                      <div>
                        <p className="text-gray-600">Period Start</p>
                        <p className="text-gray-700">
                          {new Date(sub.currentPeriodStart).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {sub.currentPeriodEnd && (
                      <div>
                        <p className="text-gray-600">Period End</p>
                        <p className="text-gray-700">
                          {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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
              const usagePercent =
                key.monthlyQuota && key.currentMonthUsage
                  ? Math.round((key.currentMonthUsage / key.monthlyQuota) * 100)
                  : 0;

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
                      <p className="text-sm text-gray-600">{key.maskedKey}</p>
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
                      <p className="text-gray-600">Created</p>
                      <p className="text-gray-700">
                        {new Date(key.createdAt).toLocaleDateString()}
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

                  {key.monthlyQuota && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">{tLicense("appUsage", { used: key.currentMonthUsage || 0, limit: key.monthlyQuota })}</p>
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
                  )}

                  {/* ADMIN ONLY: Actions */}
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-2">Actions</p>
                    <ApiKeyActions
                      keyId={key.id}
                      maskedKey={key.maskedKey}
                      status={key.status}
                      onActionComplete={() => {
                        // Refresh user details
                        window.location.reload();
                      }}
                    />
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
