import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

export default function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = products[params.slug as keyof typeof products];

  if (!product) return notFound();

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
