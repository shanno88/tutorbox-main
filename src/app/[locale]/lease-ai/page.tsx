"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { openCheckout } from "@/lib/paddle";
import { useLocale } from "next-intl";

export default function LeaseAIPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isZh = locale === "zh";

  const handleStartTrial = async () => {
    if (!session?.user?.id || !session?.user?.email) {
      router.push(`/${locale}/login?redirect=/${locale}/lease-ai`);
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
            productKey: "lease-ai",
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
      window.location.href = "https://app.tutorbox.cc/us-lease";
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
      router.push(`/${locale}/login?redirect=/${locale}/lease-ai`);
      return;
    }
    try {
      const priceId =
        process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD;
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
        {/* 标题区 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {isZh ? "Lease AI Review · 租房合同审核" : "Lease AI Review · Smart US Lease Review"}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-1">
            {isZh ? "美国租房合同智能审核" : "Smart US Lease Contract Review"}
          </p>
          <p className="text-base text-muted-foreground">
            {isZh
              ? "30 秒读懂合同陷阱，保护你的租房权益"
              : "Understand lease traps in 30 seconds and protect your rental rights"}
          </p>

        {/* 功能介绍 - 英文版本 */}
        {!isZh && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 text-center">
            <div className="bg-card border rounded-lg p-6">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-semibold mb-1">30-Second Analysis</h4>
              <p className="text-sm text-muted-foreground">
                AI scans all clauses and flags risks instantly
              </p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <div className="text-2xl mb-2">🛡️</div>
              <h4 className="font-semibold mb-1">Trap Detection</h4>
              <p className="text-sm text-muted-foreground">
                Spot hidden fees, unfair clauses & penalties
              </p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-semibold mb-1">Bilingual Support</h4>
              <p className="text-sm text-muted-foreground">
                Understand English leases in plain Chinese, no legal background required
              </p>
            </div>
          </div>
        )}
        </div>

        {/* 功能介绍 - 中文版本 */}
        {isZh && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 text-center">
            <div className="bg-card border rounded-lg p-6">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-semibold mb-1">30 秒极速分析</h4>
              <p className="text-sm text-muted-foreground">
                AI 快速扫描全部条款，识别潜在风险
              </p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <div className="text-2xl mb-2">🛡️</div>
              <h4 className="font-semibold mb-1">陷阱条款识别</h4>
              <p className="text-sm text-muted-foreground">
                识别隐藏费用、不公平条款和违约风险
              </p>
            </div>
            <div className="bg-card border rounded-lg p-6">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-semibold mb-1">中英双语解释</h4>
              <p className="text-sm text-muted-foreground">
                用中文读懂英文合同，无需法律背景
              </p>
            </div>
          </div>
        )}

        {/* 操作卡片 */}
        <div className="flex flex-col justify-center">
          <div className="bg-card border rounded-lg p-8 shadow-sm max-w-md mx-auto w-full">
            <h3 className="text-2xl font-semibold mb-2">
              {isZh ? "立即开始" : "Get Started"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {isZh ? "上传合同，开始智能审核" : "Upload your lease contract and start the smart review"}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleBuy}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading
                  ? isZh
                    ? "处理中..."
                    : "Processing..."
                  : isZh
                  ? "立即购买"
                  : "Buy Now"}
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

            <p className="text-xs text-muted-foreground mt-6">
              {!session?.user
                ? isZh
                  ? "登录后即可开始使用"
                  : "Sign in to get started"
                : isZh
                ? "一次性付费，无自动续费"
                : "One-time purchase. No subscription required."}
            </p>
          </div>
        </div>

        {/* 使用流程 */}
        <div className="mt-16 mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            {isZh ? "使用流程" : "How It Works"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div>
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold mb-1">
                {isZh ? "上传合同" : "Upload Lease"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isZh ? "支持 PDF 或图片格式" : "PDF or image format supported"}
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold mb-1">
                {isZh ? "AI 自动分析" : "AI Analyzes"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isZh
                  ? "30 秒内完成全文扫描"
                  : "Full scan completed in 30 seconds"}
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold mb-1">
                {isZh ? "获得分析报告" : "Get Insights"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isZh ? "风险提示 + 谈判建议" : "Risk flags + negotiation tips"}
              </p>
            </div>
          </div>
        </div>

        {/* 价格 */}
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">
            {isZh ? "价格" : "Pricing"}
          </h3>
          <p className="text-3xl font-bold">$9.9 USD</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isZh
              ? "无限次合同审核，一次付清，无自动续费"
              : "Unlimited lease contract reviews · one-time payment · no auto-renewal"}
          </p>
        </div>
      </div>
    </div>
  );
}
