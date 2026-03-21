"use client";

import { useLocale } from "next-intl";
import { useState } from "react";

export default function TrialDecisionPage() {
  const locale = useLocale();
  const isZh = locale === "zh";
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinEarlyAccess = () => {
    setIsLoading(true);
    window.location.href = `mailto:shanno@tutorbox.cc?subject=${encodeURIComponent(isZh ? "Trial Decision Engine 早鸟体验申请" : "Trial Decision Engine Early Access")}`;
    setIsLoading(false);
  };

  const handleStayTuned = () => {
    alert(isZh ? "敬请期待！我们即将推出。" : "Coming soon! We'll notify you when available.");
  };

  const features = isZh
    ? [
        "无代码区分免费 / 试用 / 付费用户",
        "按计划和额度自动控制功能开关",
        "配合自托管部署，支持去中心化与中心化两种模式",
      ]
    : [
        "No-code segmentation of free, trial, and paid users",
        "Automatic feature and quota control based on plans",
        "Designed for self-hosted deployments with both decentralized and centralized modes",
      ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {isZh ? "试用判断台" : "Trial Decision Engine"}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-2">
            {isZh ? "鉴权 / 分层体验" : "Auth & tiered experience"}
          </p>
          <p className="text-base text-muted-foreground">
            {isZh
              ? "判断网站访客是免费、试用还是付费用户的大脑，为每一次访问自动匹配对应的功能与体验。帮你无代码区分不同用户层级，控制可用功能、额度和提示文案，让升级路径清晰又不打扰。"
              : "The brain that decides whether a visitor is free, on trial, or paying, and automatically matches the right features and experience on every visit. Segment users without touching code, control features, quotas, and upgrade prompts so the path to paid feels clear, not pushy."}
          </p>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col justify-center">
          <div className="bg-card border rounded-lg p-8 shadow-sm max-w-md mx-auto w-full">
            <h3 className="text-2xl font-semibold mb-2">
              {isZh ? "早鸟体验" : "Early Access"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {isZh ? "即将开放，敬请期待" : "Coming soon, stay tuned"}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleJoinEarlyAccess}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isZh ? "加入早鸟名单" : "Join early access"}
              </button>
              <button
                onClick={handleStayTuned}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isZh ? "敬请期待" : "Stay tuned"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-6 text-center">
              {isZh ? "功能即将上线，敬请期待" : "Features coming soon"}
            </p>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-muted/50 rounded-lg p-8 text-center mt-12">
          <h3 className="text-xl font-semibold mb-4">
            {isZh ? "定价即将公布" : "Pricing coming soon"}
          </h3>
          <p className="text-muted-foreground mb-2">
            {isZh
              ? "后续将支持通过 Paddle 进行订阅和一次性购买，适配自托管 SaaS 与工具类产品。"
              : "Will support Paddle-based subscriptions and one-off purchases, designed for self-hosted SaaS and tool products."}
          </p>
        </div>

        {/* Features Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-semibold text-center mb-8">
            {isZh ? "核心功能" : "Key Features"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-card border rounded-lg p-6 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-medium text-gray-900 dark:text-white">{feature}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
