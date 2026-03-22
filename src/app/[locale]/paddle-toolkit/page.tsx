"use client";

import { useLocale } from "next-intl";
import { useState } from "react";

export default function PaddleToolkitPage() {
  const locale = useLocale();
  const isZh = locale === "zh";
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinWaitlist = () => {
    setIsLoading(true);
    window.location.href = `mailto:shanno@tutorbox.cc?subject=${encodeURIComponent(isZh ? "Paddle Payment Toolkit Dev Toolkit 等候名单" : "Paddle Payment Toolkit Dev Toolkit Waitlist")}`;
    setIsLoading(false);
  };

  const handleComingSoon = () => {
    alert(isZh ? "敬请期待！我们即将推出。" : "Coming soon! We'll notify you when available.");
  };

  const features = isZh
    ? [
        "针对独立开发者的集成体验，对标 Stripe",
        "支持多币种结算，适配全球用户",
        "与自托管鉴权 / 授权中台打通，从付费到权限一站打通",
      ]
    : [
        "Stripe-level integration experience, tailored for indie developers",
        "Multi-currency support for a global audience",
        "Integrated with the self-hosted auth & licensing layer to connect payments to permissions end-to-end",
      ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {isZh ? "Paddle 支付工具" : "Paddle Payment Toolkit"}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-2">
            {isZh ? "虚拟产品支付" : "Digital product payments"}
          </p>
          <p className="text-base text-muted-foreground">
            {isZh
              ? "Paddle 虚拟产品支付管家，面向全球市场的一站式支付工具，支持订阅、一次性购买和多币种结算，你只管卖虚拟产品，收款和对账交给它。集成体验对标 Stripe，是出海虚拟产品的主力收款通道之一。"
              : "A payment butler for your digital products. Handle subscriptions, one-off purchases, and multi-currency checkout for a global audience while you focus on building. Stripe-level DX and one of the go-to payment rails for indie builders going global."}
          </p>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col justify-center">
          <div className="bg-card border rounded-lg p-8 shadow-sm max-w-md mx-auto w-full">
            <h3 className="text-2xl font-semibold mb-2">
              {isZh ? "Dev Toolkit" : "Dev Toolkit"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {isZh ? "即将上线，敬请期待" : "Coming soon, stay tuned"}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleJoinWaitlist}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isZh ? "加入 Dev Toolkit 等候名单" : "Join Dev Toolkit waitlist"}
              </button>
              <button
                onClick={handleComingSoon}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isZh ? "Dev Toolkit · 即将上线" : "Dev Toolkit · Coming soon"}
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
            {isZh ? "适配你的虚拟产品定价" : "Built around your pricing model"}
          </h3>
          <p className="text-muted-foreground mb-2">
            {isZh
              ? "未来将支持订阅、一次性购买和简单用量计费三种模式，通过 Paddle 完成收款与结算。"
              : "Will support subscriptions, one-off purchases, and simple usage-based models, all powered by Paddle for payments and settlement."}
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
