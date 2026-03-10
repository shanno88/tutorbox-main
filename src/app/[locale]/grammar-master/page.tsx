"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { openCheckout } from "@/lib/paddle";
import { useLocale } from "next-intl";

export default function GrammarMasterPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTrial = async () => {
    if (!session?.user?.id || !session?.user?.email) {
      router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const authTrialUrl = process.env.NEXT_PUBLIC_AUTH_TRIAL_URL || "http://localhost:3002";
      const response = await fetch(`${authTrialUrl}/api/me/products/start-trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productKey: "grammar-master", userEmail: session.user.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errorCode = data?.error;
        if (errorCode === "TRIAL_NOT_ENABLED") { handleBuy(); return; }
        if (errorCode === "TRIAL_ALREADY_USED") { setError("You have already used your trial. Please purchase to continue."); handleBuy(); return; }
        setError("Failed to start trial. Please try again.");
        return;
      }
      window.location.href = "https://gm.tutorbox.cc";
    } catch (err) {
      console.error("Failed to start trial:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!session?.user?.id) { router.push(`/${locale}/login?redirect=/${locale}/grammar-master`); return; }
    try {
      const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD;
      if (!priceId) { setError("Purchase is not available at this time."); return; }
      await openCheckout({ priceId, userId: session.user.id });
    } catch (err) {
      console.error("Failed to open checkout:", err);
      setError("Failed to open checkout. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Grammar Master · 语法大师</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-2">English writing assistant for non-native speakers</p>
          <p className="text-base text-muted-foreground">告别 Chinglish，写出地道英文</p>
        </div>
        <div className="flex flex-col justify-center">
          <div className="bg-card border rounded-lg p-8 shadow-sm max-w-md mx-auto w-full">
            <h3 className="text-2xl font-semibold mb-2">开始使用语法大师</h3>
            <p className="text-muted-foreground mb-6">7 天免费试用，无需信用卡</p>
            <div className="space-y-3">
              <button
                onClick={handleStartTrial}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? "Processing..." : "开始 7 天免费试用"}
              </button>
              <button
                onClick={handleBuy}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                立即购买 Pro 版
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-6">
              {!session?.user
                ? "Sign in to get started"
                : "7-day free trial included. No subscription required."}
            </p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-8 text-center mt-12">
          <h3 className="text-xl font-semibold mb-2">Pricing</h3>
          <p className="text-3xl font-bold">$49 USD / 年</p>
          <p className="text-sm text-muted-foreground mt-2">或 199 元人民币，买断一年，无自动续费</p>
        </div>
      </div>
    </div>
  );
}
