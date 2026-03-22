"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { openCheckout } from "@/lib/paddle";
import { useLocale } from "next-intl";
import { useTrial } from "@/hooks/use-trial";

export default function GrammarMasterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const trial = useTrial("grammar-master");

  const isZh = locale === "zh";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTrial = async () => {
    // Only redirect to login if truly unauthenticated
    if (status === "unauthenticated") {
      router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
      return;
    }

    // Wait during loading, don't do anything
    if (status !== "authenticated") {
      return;
    }

    // Extra safety check
    if (!session?.user?.id || !session?.user?.email) {
      router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await trial.startTrial();
      // Trial started successfully, page will show remaining days
    } catch (err) {
      console.error("Failed to start trial:", err);
      setError("Failed to start trial. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async () => {
    // Only redirect to login if truly unauthenticated
    if (status === "unauthenticated") {
      router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
      return;
    }

    // Wait during loading, don't do anything
    if (status !== "authenticated") {
      return;
    }

    // Extra safety check
    if (!session?.user?.id) {
      router.push(`/${locale}/login?redirect=/${locale}/grammar-master`);
      return;
    }

    try {
      const priceId =
        process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD;

      if (!priceId) {
        setError("Purchase is not available at this time.");
        return;
      }

      await openCheckout({
        priceId,
        userId: session.user.id,
      });
    } catch (err) {
      console.error("Failed to open checkout:", err);
      setError("Failed to open checkout. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {isZh
              ? "Grammar Master · 语法大师"
              : "Grammar Master · English Writing Assistant"}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-2">
            {isZh
              ? "给非母语学习者的英文写作助手"
              : "English writing assistant for non-native speakers"}
          </p>
          <p className="text-base text-muted-foreground">
            {isZh
              ? "告别 Chinglish，写出地道英文"
              : "Say goodbye to Chinglish and write natural English."}
          </p>
        </div>

        <div className="flex flex-col justify-center">
          <div className="bg-card border rounded-lg p-8 shadow-sm max-w-md mx-auto w-full">
            <h3 className="text-2xl font-semibold mb-2">
              {isZh ? "开始使用语法大师" : "Start using Grammar Master"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {isZh
                ? "7 天免费试用，无需信用卡"
                : "7-day free trial, no credit card required"}
            </p>

            <div className="space-y-3">
              <button
                onClick={handleStartTrial}
                disabled={isLoading || status === "loading"}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {status === "loading"
                  ? isZh
                    ? "加载中..."
                    : "Loading..."
                  : isLoading
                  ? isZh
                    ? "处理中..."
                    : "Processing..."
                  : isZh
                  ? "开始 7 天免费试用"
                  : "Start 7-day free trial"}
              </button>

              <button
                onClick={handleBuy}
                disabled={isLoading || status === "loading"}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isZh ? "立即购买 Pro 版" : "Buy Pro version"}
              </button>
            </div>

            {trial.isTrialActive && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {isZh
                  ? `✓ 试用中，剩余 ${trial.daysRemaining} 天`
                  : `✓ Trial active, ${trial.daysRemaining} days remaining`}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {trial.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {trial.error}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-6">
              {status === "loading"
                ? isZh
                  ? "加载中..."
                  : "Loading..."
                : status === "unauthenticated"
                ? isZh
                  ? "登录后开始使用"
                  : "Sign in to get started"
                : isZh
                ? "包含 7 天免费试用，无需订阅。"
                : "7-day free trial included. No subscription required."}
            </p>

            {isZh && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs space-y-1">
                <p className="text-yellow-800 font-bold">⚠️ 注意事项：</p>
                <p className="text-yellow-700">
                  📧 登录邮件可能进入垃圾箱，请检查垃圾邮件文件夹
                </p>
                <p className="text-yellow-700">
                  💳 支付页面请将国家改为「中国」才能看到微信支付选项
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-8 text-center mt-12">
          <h3 className="text-xl font-semibold mb-2">
            {isZh ? "价格" : "Pricing"}
          </h3>
          <p className="text-3xl font-bold">
            $49 USD / {isZh ? "年" : "year"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {isZh
              ? "或 199 元人民币，买断一年，无自动续费"
              : "Or 199 RMB, 1-year license, no auto-renewal"}
          </p>
        </div>
      </div>
    </div>
  );
}
