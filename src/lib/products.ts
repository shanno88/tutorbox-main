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
  cta?: '立即体验' | '了解更多' | '申请接入' | '加入内测';
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
  // 【NEW PRODUCTS START】
  {
    slug: 'thinker-ai',
    name: 'Thinker AI',
    nameCn: '实时对话智核',
    tagline: 'Real-time AI that listens, thinks, and acts during your voice or video calls.',
    taglineCn: '实时语音 / 视频对话，一边听你说，一边替你思考和行动。',
    description: 'Real-time AI that listens, thinks, and acts during your voice or video calls.',
    descriptionCn: '实时语音 / 视频对话，一边听你说，一边替你思考和行动。',
    icon: 'message-circle',
    status: 'coming-soon',
    cta: '了解更多',
    features: [
      { en: 'Real-time voice and video', cn: '实时语音视频对话' },
      { en: 'Listen, think, and act', cn: '边听边思考边行动' },
      { en: 'Conversation core', cn: '对话智核' },
    ],
  },
  {
    slug: 'webpilot',
    name: 'WebPilot',
    nameCn: 'AI 网页执行者',
    tagline: 'Let AI log in, click, and scrape the web to actually complete your tasks online.',
    taglineCn: '让 AI 帮你登录、点击、抓数据，不再只是给建议，而是直接把事做完。',
    description: 'Let AI log in, click, and scrape the web to actually complete your tasks online.',
    descriptionCn: '让 AI 帮你登录、点击、抓数据，不再只是给建议，而是直接把事做完。',
    icon: 'globe',
    status: 'coming-soon',
    cta: '了解更多',
    features: [
      { en: 'Web automation', cn: '网页自动化执行' },
      { en: 'Login and scrape', cn: '登录抓取数据' },
      { en: 'Task completion', cn: '任务在线完成' },
    ],
  },
  {
    slug: 'chatport',
    name: 'ChatPort',
    nameCn: '多平台聊天入口',
    tagline: 'Bring your AI assistant into Telegram, Slack, and WhatsApp so users can work in the chats they already use.',
    taglineCn: '把你的 AI 助手接入 Telegram / Slack / WhatsApp，在熟悉的聊天框里完成工作。',
    description: 'Bring your AI assistant into Telegram, Slack, and WhatsApp so users can work in the chats they already use.',
    descriptionCn: '把你的 AI 助手接入 Telegram / Slack / WhatsApp，在熟悉的聊天框里完成工作。',
    icon: 'message-square',
    status: 'coming-soon',
    cta: '申请接入',
    features: [
      { en: 'Multi-platform chat', cn: '多平台聊天入口' },
      { en: 'Telegram, Slack, WhatsApp', cn: 'Telegram / Slack / WhatsApp' },
      { en: 'Work in familiar chats', cn: '熟悉聊天框里工作' },
    ],
  },
  {
    slug: 'flowforge',
    name: 'FlowForge',
    nameCn: '自动化工作流中心',
    tagline: 'Build end-to-end business workflows by chaining triggers, AI, and external services.',
    taglineCn: '用触发器 + AI + 外部服务，搭出属于你的端到端自动化业务流程。',
    description: 'Build end-to-end business workflows by chaining triggers, AI, and external services.',
    descriptionCn: '用触发器 + AI + 外部服务，搭出属于你的端到端自动化业务流程。',
    icon: 'git-branch',
    status: 'coming-soon',
    cta: '了解更多',
    features: [
      { en: 'Trigger + AI + services', cn: '触发器 + AI + 外部服务' },
      { en: 'End-to-end workflows', cn: '端到端自动化流程' },
      { en: 'Business automation', cn: '业务流程自动化' },
    ],
  },
  {
    slug: 'notemind',
    name: 'NoteMind',
    nameCn: '知识整理助手',
    tagline: 'Automatically read text from images and documents so you can organize, search, and revisit your knowledge.',
    taglineCn: '自动识别图片和文档中的文字，帮你整理、搜索和回顾分散的知识。',
    description: 'Automatically read text from images and documents so you can organize, search, and revisit your knowledge.',
    descriptionCn: '自动识别图片和文档中的文字，帮你整理、搜索和回顾分散的知识。',
    icon: 'book-open',
    status: 'beta',
    cta: '加入内测',
    features: [
      { en: 'OCR from images and docs', cn: '图片文档文字识别' },
      { en: 'Organize and search', cn: '整理搜索回顾' },
      { en: 'Knowledge management', cn: '知识管理助手' },
    ],
  },
  {
    slug: 'polymarket-bot',
    name: 'Polymarket Bot',
    nameCn: '市场预测智能体',
    tagline: 'Connects to prediction markets and on-chain data to help you track trends and generate insights with AI.',
    taglineCn: '连接多种预测市场和链上数据，用 AI 帮你跟踪趋势、生成洞见和假设。',
    description: 'Connects to prediction markets and on-chain data to help you track trends and generate insights with AI.',
    descriptionCn: '连接多种预测市场和链上数据，用 AI 帮你跟踪趋势、生成洞见和假设。',
    icon: 'trending-up',
    status: 'coming-soon',
    cta: '了解更多',
    features: [
      { en: 'Prediction markets', cn: '预测市场连接' },
      { en: 'On-chain data', cn: '链上数据' },
      { en: 'AI insights', cn: 'AI 洞见生成' },
    ],
  },
  // 【NEW PRODUCTS END】
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
