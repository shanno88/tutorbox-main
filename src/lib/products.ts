export interface Product {
  slug: string;
  name: string;
  nameCn: string;
  tagline: string;
  taglineCn: string;
  description: string;
  descriptionCn: string;
  icon: string;
  status: 'live' | 'beta' | 'coming-soon';
  features: { en: string; cn: string }[];
}

export const products: Product[] = [
  {
    slug: 'lease-ai',
    name: 'Lease AI Review',
    nameCn: '美国租房合同审核',
    tagline: 'AI-powered US lease review in 30 seconds',
    taglineCn: '美国租房合同智能审核，30秒读懂陷阱条款',
    description: 'An AI-powered tool that helps Chinese speakers living in the US understand their lease agreements, identify potential traps, and negotiate better terms.',
    descriptionCn: '专为在美国租房的华人打造的 AI 审核工具。上传合同，30秒内识别陷阱条款、不合理费用，并提供修改建议，帮你在租房谈判中保护自己的权益。',
    icon: 'file-search',
    status: 'live',
    features: [
      { en: 'Upload lease PDF for instant analysis', cn: '上传合同 PDF 即刻分析' },
      { en: 'Identify hidden fees & unfair clauses', cn: '识别隐藏费用与不公平条款' },
      { en: 'Negotiation suggestions included', cn: '提供谈判修改建议' },
      { en: 'Bilingual support (EN/CN)', cn: '中英双语支持' },
    ],
  },
  {
    slug: 'grammar-master',
    name: 'Grammar Master',
    nameCn: '语法大师',
    tagline: 'English writing assistant for non-native speakers',
    taglineCn: '英文写作助手，告别 Chinglish',
    description: 'An AI-powered English writing assistant specifically designed for Chinese speakers, helping you write more naturally and professionally.',
    descriptionCn: '专为中文母语者设计的英文写作助手，不仅纠正语法错误，更能帮你写出地道自然的英文，提升邮件、论文、报告的专业度。',
    icon: 'pen-tool',
    status: 'live',
    features: [
      { en: 'Real-time grammar correction', cn: '实时语法纠正' },
      { en: 'Style suggestions for professional writing', cn: '专业写作风格建议' },
      { en: 'Chinglish pattern detection', cn: '中式英语检测' },
      { en: 'Context-aware improvements', cn: '语境优化建议' },
    ],
  },
  {
    slug: 'cast-master',
    name: 'Cast Master',
    nameCn: '播客大师',
    tagline: 'AI assistant for short-form video creators',
    taglineCn: '短视频创作者的 AI 助手',
    description: 'Coming soon: An AI assistant that helps short-form video creators plan, script, and optimize their content.',
    descriptionCn: '即将上线：专为短视频创作者打造的 AI 助手，帮助你规划选题、生成脚本、优化内容，让创作更高效。',
    icon: 'video',
    status: 'coming-soon',
    features: [
      { en: 'Content ideation & planning', cn: '内容创意与规划' },
      { en: 'Script generation', cn: '脚本生成' },
      { en: 'SEO optimization for videos', cn: '视频 SEO 优化' },
      { en: 'Trend analysis', cn: '热点趋势分析' },
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
