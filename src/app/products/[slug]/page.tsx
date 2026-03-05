import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PaddleCheckoutButton } from "@/components/paddle/checkout-button";
import { products as trialConfig } from "@/config/products";
import { getSSRSession } from "@/lib/get-server-session";
import { cookies } from "next/headers";
import { CastMasterAccessCta } from "../_components/cast-master-access-cta";
import { CastMasterLanding } from "../_components/cast-master-landing";

const products = {
  'lease-ai': {
    name: 'Lease AI Review · 美国租房合同审核',
    description: '美国租房合同智能审核，30秒读懂陷阱条款',
    status: '已上线',
    cta: '立即体验',
    url: 'https://app.tutorbox.cc/',
  },
   'grammar-master': {
      name: 'Grammar Master · 语法大师',
      description: '英文写作助手，告别 Chinglish',
      status: '可立即开始 7 天免费试用',
      cta: '立即开始 7 天免费试用',
      url: '/products/grammar-master',
    },
  'cast-master': {
    name: 'Cast Master · 播感大师',
    description: '短视频创作者的 AI 助手',
    status: '即将上线',
    cta: '了解更多',
    url: '/',
  },
  // 【NEW PRODUCTS START】
  'thinker-ai': {
    name: 'Thinker AI · 实时对话智核',
    description: '实时语音 / 视频对话，一边听你说，一边替你思考和行动。',
    status: '即将上线',
    cta: '了解更多',
    url: '/',
  },
  'webpilot': {
    name: 'WebPilot · AI 网页执行者',
    description: '让 AI 帮你登录、点击、抓数据，不再只是给建议，而是直接把事做完。',
    status: '即将上线',
    cta: '了解更多',
    url: '/',
  },
  'chatport': {
    name: 'ChatPort · 多平台聊天入口',
    description: '把你的 AI 助手接入 Telegram / Slack / WhatsApp，在熟悉的聊天框里完成工作。',
    status: '即将上线',
    cta: '申请接入',
    url: '/',
  },
  'flowforge': {
    name: 'FlowForge · 自动化工作流中心',
    description: '用触发器 + AI + 外部服务，搭出属于你的端到端自动化业务流程。',
    status: '即将上线',
    cta: '了解更多',
    url: '/',
  },
  'notemind': {
    name: 'NoteMind · 知识整理助手',
    description: '自动识别图片和文档中的文字，帮你整理、搜索和回顾分散的知识。',
    status: '测试中',
    cta: '加入内测',
    url: '/',
  },
  'polymarket-bot': {
    name: 'Polymarket Bot · 市场预测智能体',
    description: '连接多种预测市场和链上数据，用 AI 帮你跟踪趋势、生成洞见和假设。',
    status: '即将上线',
    cta: '了解更多',
    url: '/',
  },
  // 【NEW PRODUCTS END】
};

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = products[params.slug as keyof typeof products];

  if (!product) return notFound();

  const { user } = await getSSRSession();

  // Check if this product requires trial gating
  const trialProduct = trialConfig.find(
    (p: (typeof trialConfig)[number]) => p.key === params.slug
  );
  const requiresGating = !!trialProduct?.trialEnabled;

  let accessStatus: string | null = null;

  if (requiresGating) {
    if (!user) {
      // Not logged in → show gate
      accessStatus = "not_logged_in";
    } else {
      // Fetch product status server-side
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/me/products`, {
        headers: { cookie: cookies().toString() },
        cache: "no-store",
      });
      const statuses = await res.json();
      const productStatus = statuses.find(
        (s: { productKey: string; status: string }) => s.productKey === params.slug
      );
      accessStatus = productStatus?.status ?? "not_started";
    }
  }

  const priceMap: Record<string, string | undefined> = {
    "grammar-master": process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD,
    "lease-ai": process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD,
  };
  const checkoutPriceId = priceMap[params.slug];
  const userId = user?.id;

  // Show gate if product requires trial and user doesn't have access
  if (requiresGating && accessStatus !== "trial_active" && accessStatus !== "paid") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{product.name}</h1>
        <p className="text-lg mb-8">{product.description}</p>

        {accessStatus === "trial_expired" ? (
          <div className="mt-8 p-6 border rounded-lg bg-gray-50">
            <p className="text-lg font-semibold mb-2">试用已结束</p>
            <p className="text-gray-600 mb-4">你的免费试用期已到期，升级后继续使用全部功能。</p>
            {checkoutPriceId ? (
              <PaddleCheckoutButton
                priceId={checkoutPriceId}
                userId={userId}
                variant="default"
                className="w-full md:w-auto"
              >
                立即升级解锁
              </PaddleCheckoutButton>
            ) : (
              <div className="text-sm text-gray-500">此产品付费方案即将开放，敬请期待。</div>
            )}
          </div>
        ) : (
          <div className="mt-8 p-6 border rounded-lg bg-gray-50">
            <p className="text-lg font-semibold mb-2">需要先开始试用</p>
            <p className="text-gray-600 mb-8">
              {accessStatus === "not_logged_in"
                ? "登录后即可免费试用此产品。"
                : "你还没有开始试用，回到首页开始免费试用。"}
            </p>
            <Button asChild variant="default" size="lg">
              <Link href={accessStatus === "not_logged_in" ? "/zh/login" : "/#products"}>
                {accessStatus === "not_logged_in" ? "登录" : "去首页开始试用"}
              </Link>
            </Button>
          </div>
        )}
      </main>
    );
  }

  if (params.slug === "cast-master") {
    return <CastMasterLanding />;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-10">{product.name}</h1>
      <p className="text-lg mb-10">{product.description}</p>
      <p className="mb-10">状态：{product.status}</p>

      {/* Lease AI 一次性服务说明（中英文） */}
      {params.slug === "lease-ai" && (
        <section className="mb-8 space-y-4 text-sm text-gray-700">
          <div>
            <h2 className="text-lg font-medium mb-3">使用方式与价格</h2>
            <p>
              Lease AI 不是按月订阅的 SaaS，而是
              <span className="font-semibold"> 一次性买断一份合同的审核服务</span>。
            </p>
            <p>
              每次你上传一份新的美国租房合同，只在你确认提交审核时支付一次费用，
              我们不会自动续费，也不会在后台默默扣款。
            </p>
            <p>
              很适合刚到美国租房、或者偶尔签一份新租约的个人用户——
              遇到新合同时再来用一次即可。
            </p>
            {/* 如果确定价格，可以解开下面这行并填入具体金额 */}
            {/* <p>
              每份合同只需 <span className="font-semibold">39 美元</span>，
              就能在几分钟内看懂潜在风险条款，远低于一小时律师费的价格。
            </p> */}
          </div>

          <div className="pt-2 border-t border-gray-200">
            <h2 className="text-lg font-medium mb-3">How it works & pricing</h2>
            <p>
              Lease AI is <span className="font-semibold">not a subscription</span>.
              It’s a <span className="font-semibold">one‑time review for each lease you upload</span>.
            </p>
            <p>
              You only pay when you decide to submit a lease for a full review –
              there are no auto‑renewals and no surprise charges in the background.
            </p>
            <p>
              It’s designed for individuals who only sign a new US lease once in a while:
              just come back and use it again whenever you get a new contract.
            </p>
            {/* If you have a fixed price in USD, you can uncomment and edit this: */}
            {/* <p>
              Each lease review is only <span className="font-semibold">$39</span>,
              which is far less than a single hour of a lawyer’s time.
            </p> */}
          </div>
        </section>
      )}

      {params.slug === "cast-master" ? (
        <CastMasterAccessCta />
      ) : (
        <Button
          asChild
          variant="default"
          size="lg"
          className="font-bold text-base mt-4"
        >
          <Link
            href={
              params.slug === "lease-ai" && !user
                ? "/zh/login?redirect=/products/lease-ai"
                : product.url
            }
            target={params.slug === "lease-ai" && !user ? undefined : "_blank"}
            rel={
              params.slug === "lease-ai" && !user
                ? undefined
                : "noopener noreferrer"
            }
          >
            {params.slug === "lease-ai" ? "上传合同，开始审核" : product.cta}
          </Link>
        </Button>
      )}
    </main>
  );
}