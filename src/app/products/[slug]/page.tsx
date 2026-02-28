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
