import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PaddleCheckoutButton } from "@/components/paddle/checkout-button";
import { products as trialConfig } from "@/config/products";
import { getSSRSession } from "@/lib/get-server-session";
import { cookies } from "next/headers";

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
    status: '已上线',
    cta: '立即体验',
    url: 'https://gm.tutorbox.cc',
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

  // Check if this product requires trial gating
  const trialProduct = trialConfig.find(
    (p: (typeof trialConfig)[number]) => p.key === params.slug
  );
  const requiresGating = !!trialProduct?.trialEnabled;

  let accessStatus: string | null = null;

  if (requiresGating) {
    const { user } = await getSSRSession();

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
  const userId = (await getSSRSession()).user?.id;

  // Show gate if product requires trial and user doesn't have access
  if (requiresGating && accessStatus !== "trial_active" && accessStatus !== "paid") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <p className="text-lg mb-4">{product.description}</p>

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
            <p className="text-gray-600 mb-4">
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
      <p className="text-lg mb-4">{product.description}</p>
      <p className="mb-8">状态：{product.status}</p>
      <Button asChild variant="default" size="lg" className="font-bold text-base mt-4">
        <Link href={product.url} target="_blank" rel="noopener noreferrer">
          {product.cta}
        </Link>
      </Button>
    </main>
  );
}
