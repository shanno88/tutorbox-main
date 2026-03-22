"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";

interface BillingData {
  user: {
    id: string;
    email: string;
  };
  subscription: {
    status: "none" | "trialing" | "active" | "past_due" | "canceled";
    planName?: string;
    planSlug?: string;
    productKey?: string;
    provider?: "paddle" | "dodo";
    currentPeriodEnd?: string;
    nextBillingDate?: string;
  } | null;
}

export default function BillingPage() {
  const t = useTranslations("billing");
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/me/billing");
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please log in to view your billing");
          }
          throw new Error("Failed to fetch billing info");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch billing info");
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t("pageTitle")}</h1>
        <Card className="p-8">
          <p className="text-sm text-gray-600">Loading billing information...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t("pageTitle")}</h1>
        <Card className="p-8 bg-red-50 border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { subscription } = data;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{t("pageTitle")}</h1>

      {!subscription ? (
        <Card className="p-8">
          <p className="text-gray-600 mb-4">{t("noSubscription")}</p>
          <p className="text-sm text-gray-500">
            Subscribe to a plan to get access to our APIs and features.
          </p>
        </Card>
      ) : (
        <Card className="p-8">
          <div className="space-y-6">
            {/* Plan Info */}
            <div>
              <p className="text-sm text-gray-600 mb-2">{t("currentPlan")}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {subscription.planName || "Unknown Plan"}
              </p>
            </div>

            {/* Status */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Status</p>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.status === "active"
                      ? "bg-green-100 text-green-800"
                      : subscription.status === "trialing"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {t(`status.${subscription.status}`)}
                </span>
              </div>
            </div>

            {/* Next Billing Date */}
            {subscription.nextBillingDate && (
              <div>
                <p className="text-sm text-gray-600 mb-2">{t("nextBillingDate")}</p>
                <p className="text-gray-900">
                  {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Provider */}
            {subscription.provider && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Billed Via</p>
                <p className="text-gray-900">
                  {subscription.provider === "paddle" ? "Paddle" : "DoDo"}
                </p>
              </div>
            )}

            {/* Manage Subscription Button */}
            <div className="pt-4 border-t">
              <button
                disabled
                className="px-4 py-2 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Coming soon: manage subscription in provider portal"
              >
                Manage Subscription (Coming Soon)
              </button>
              <p className="text-xs text-gray-500 mt-2">
                TODO: Link to Paddle/DoDo customer portal
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
