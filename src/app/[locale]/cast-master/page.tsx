"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { openCheckout } from "@/lib/paddle";
import { useLocale } from "next-intl";

export default function CastMasterPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const isZh = locale === "zh";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTrial = async () => {
    if (!session?.user?.id || !session?.user?.email) {
      router.push(`/${locale}/login?redirect=/${locale}/cast-master`);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const authTrialUrl =
        process.env.NEXT_PUBLIC_AUTH_TRIAL_URL || "http://localhost:3002";
      const response = await fetch(
        `${authTrialUrl}/api/me/products/start-trial`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productKey: "cast-master",
            userEmail: session.user.email,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        const errorCode = data?.error;
        if (errorCode === "TRIAL_NOT_ENABLED") {
          await handleBuy();
          return;
        }
        if (errorCode === "TRIAL_ALREADY_USED") {
          setError(
            isZh
              ? "你已经使用过试用，请直接购买后继续使用。"
              : "You have already used your trial. Please purchase to continue."
          );
          await handleBuy();
          return;
        }
        setError(
          isZh
            ? "开始试用失败，请稍后重试。"
            : "Failed to start trial. Please try again."
        );
        return;
      }
      window.location.href = "https://tl.tutorbox.cc/";
    } catch (err) {
      console.error("Failed to start trial:", err);
      setError(
        isZh ? "发生错误，请稍后重试。" : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!session?.user?.id) {
      router.push(`/${locale}/login?redirect=/${locale}/cast-master`);
      return;
    }
    try {
      const priceId =
        process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY;
      if (!priceId) {
        setError(
          isZh
            ? "支付暂时不可用，请稍后再试。"
            : "Purchase is not available at this time."
        );
        return;
      }
      await openCheckout({ priceId, userId: session.user.id });
    } catch (err) {
      console.error("Failed to open checkout:", err);
      setError(
        isZh
          ? "打开支付窗口失败，请稍后再试。"
          : "Failed to open checkout. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {isZh ? "Cast Master · 播感大师" : "Cast Master"}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-2">
            {isZh
              ? "AI 提词器，短视频脚本一键生成"
              : "AI assistant for short-form video creators"}
          </p>
          <p className="text-base text-muted-foreground">
            {isZh
              ? "让每一条短视频都有故事、有节奏、有记忆点"
              : "Make every short video structured, engaging, and memorable."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 text-center">
          <div className="bg-card border rounded-lg p-6">
            <div className="text-2xl mb-2">📝</div>
            <h4 className="font-semibold mb-1">
              {isZh ? "脚本一键生成" : "Script Generation"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isZh
                ? "输入主题，一键生成完整短视频脚本"
                : "Turn ideas into complete scripts in seconds."}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="text-2xl mb-2">🎬</div>
            <h4 className="font-semibold mb-1">
              {isZh ? "专业提词器" : "Teleprompter"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isZh
                ? "滚动提词，节奏可控，不再忘词卡壳"
                : "Scrolling teleprompter to keep your delivery smooth."}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="text-2xl mb-2">🚨</div>
            <h4 className="font-semibold mb-1">
              {isZh ? "敏感词检测" : "Safety Checks"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isZh
                ? "识别潜在违禁词，降低内容风险"
                : "Detect potential banned terms to reduce takedown risk."}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="bg-card border rounded-lg p-8 shadow-sm max-w-md mx-auto w-full">
            <h3 className="text-2xl font-semibold mb-2">
              {isZh ? "开始使用播感大师" : "Start using Cast Master"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {isZh
                ? "7 天免费试用，支持微信支付"
                : "7-day free trial, then yearly license."}
            </p>

            <div className="space-y-3">
              <button
                onClick={handleStartTrial}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading
                  ? isZh
                    ? "处理中..."
                    : "Processing..."
                  : isZh
                  ? "开始 7 天免费试用"
                  : "Start 7-day free trial"}
              </button>

              <button
                onClick={handleBuy}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isZh ? "立即购买 Pro 版" : "Buy Pro version"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

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
      </div>
    </div>
  );
}
