// src/app/products/lease-ai/pricing/page.tsx
import { getSSRSession } from "@/lib/get-server-session";
import { PaddleCheckoutButton } from "@/components/paddle/checkout-button";
import { redirect } from "next/navigation";
import { CheckIcon } from "lucide-react";

export default async function LeaseAIPricingPage() {
  const session = await getSSRSession();

  // Must be logged in to see pricing
  if (!session?.user?.id) {
    redirect("/en/login?redirect=/products/lease-ai/pricing");
  }

  const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Lease AI Review · 美国租房合同审核
        </h1>
        <p className="text-xl text-muted-foreground">
          AI-powered US lease review in 30 seconds
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* English Section */}
        <div className="rounded-lg border bg-card p-8">
          <h2 className="text-2xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground mb-6">
            Lease AI is <span className="font-semibold">not a subscription</span>.
            It's a <span className="font-semibold">one-time review for each lease you upload</span>.
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2">
              <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Upload your US lease agreement (PDF or image)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>AI analyzes all clauses in 30 seconds</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Get detailed explanations of risky terms</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Receive negotiation suggestions</span>
            </li>
          </ul>
          <div className="text-3xl font-bold mb-2">$39 USD</div>
          <p className="text-sm text-muted-foreground">per lease review</p>
        </div>

        {/* Chinese Section */}
        <div className="rounded-lg border bg-card p-8">
          <h2 className="text-2xl font-bold mb-4">使用方式</h2>
          <p className="text-muted-foreground mb-6">
            Lease AI <span className="font-semibold">不是按月订阅</span>，
            而是<span className="font-semibold">一次性买断一份合同的审核服务</span>。
          </p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2">
              <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>上传美国租房合同（PDF 或图片）</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>AI 在 30 秒内分析所有条款</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>获得风险条款的详细解释</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>收到谈判建议</span>
            </li>
          </ul>
          <div className="text-3xl font-bold mb-2">$39 美元</div>
          <p className="text-sm text-muted-foreground">每份合同审核</p>
        </div>
      </div>

      {/* Purchase Button */}
      <div className="text-center">
        {priceId ? (
          <PaddleCheckoutButton
            priceId={priceId}
            userId={session.user.id}
            variant="default"
            className="text-lg px-8 py-6"
          >
            Purchase Lease AI Review - $39 USD
          </PaddleCheckoutButton>
        ) : (
          <p className="text-muted-foreground">
            Pricing information is being updated. Please check back soon.
          </p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          One-time payment • No subscription • Instant access after payment
        </p>
      </div>
    </main>
  );
}
