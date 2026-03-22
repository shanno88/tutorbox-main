"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { RotateButton } from "./rotate-button";

interface ApiKey {
  id: string;
  maskedKey: string;
  planName: string;
  planSlug: string;
  status: "active" | "revoked" | "expired";
  createdAt: string;
  expiresAt?: string;
  currentMonthUsage?: number;
  monthlyQuota?: number;
}

interface ApiKeysData {
  user: {
    id: string;
    email: string;
  };
  apiKeys: ApiKey[];
}

export default function ApiKeysPage() {
  const [data, setData] = useState<ApiKeysData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tLicense = useTranslations("license");

  const fetchApiKeys = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/me/api-keys");
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to view your API keys");
        }
        throw new Error("Failed to fetch API keys");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">API Keys</h1>
        <p className="text-gray-600 mb-8">Use these keys to call the Tutorbox APIs. Keep them secret.</p>
        <Card className="p-8">
          <p className="text-sm text-gray-600">Loading API keys...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">API Keys</h1>
        <p className="text-gray-600 mb-8">Use these keys to call the Tutorbox APIs. Keep them secret.</p>
        <Card className="p-8 bg-red-50 border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { apiKeys } = data;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">API Keys</h1>
      <p className="text-gray-600 mb-8">Use these keys to call the Tutorbox APIs. Keep them secret.</p>

      {apiKeys.length === 0 ? (
        <Card className="p-8">
          <p className="text-gray-600">
            You don't have any API keys yet. Subscribe to a plan to get started.
          </p>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-4">
            {apiKeys.map((key) => {
              const usagePercent =
                key.monthlyQuota && key.currentMonthUsage
                  ? Math.round((key.currentMonthUsage / key.monthlyQuota) * 100)
                  : 0;

              return (
                <div key={key.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{key.planName}</p>
                      <p className="text-sm text-gray-600 font-mono">{key.maskedKey}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-4 ${
                        key.status === "active"
                          ? "bg-green-100 text-green-800"
                          : key.status === "expired"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-current" />
                      {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
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
                        {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : "Never"}
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
                      <p className="text-xs text-gray-600 mt-1">{usagePercent}% used</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t pt-4">
                    <RotateButton
                      keyId={key.id}
                      status={key.status}
                      onRotateComplete={fetchApiKeys}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
