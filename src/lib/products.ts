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
  cta?: '立即体验' | '了解更多' | '申请接入' | '加入内测' | '立即开始 7 天免费试用' | undefined;
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
    cta: '了解更多',
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
    cta: '立即开始 7 天免费试用',
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
    nameCn: '播感大师',
    tagline: 'AI assistant for short-form video creators',
    taglineCn: '短视频创作者的 AI 助手',
    description: 'Coming soon: An AI assistant that helps short-form video creators plan, script, and optimize their content.',
    descriptionCn: '即将上线：专为短视频创作者打造的 AI 助手，帮助你规划选题、生成脚本、优化内容，让创作更高效。',
    icon: 'video',
    status: 'live',
    cta: '立即开始 7 天免费试用',
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
    name: 'Thinker AI · Real-time Dialogue Core',
    nameCn: 'Thinker AI · 实时对话智核',
    tagline: 'An experimental project exploring deep thinking and assistance during real-time voice and video conversations.',
    taglineCn: '围绕实时语音 / 视频对话做深度思考和辅助决策的实验项目。',
    description: 'An experimental project exploring deep thinking and assistance during real-time voice and video conversations.',
    descriptionCn: '围绕实时语音 / 视频对话做深度思考和辅助决策的实验项目。',
    icon: 'message-circle',
    status: 'coming-soon',
    cta: undefined,
    features: [
      { en: 'Real-time voice and video', cn: '实时语音视频对话' },
      { en: 'Deep thinking assistance', cn: '深度思考辅助' },
      { en: 'Decision support', cn: '决策支持' },
    ],
  },
  {
    slug: 'webpilot',
    name: 'WebPilot · AI Web Operator',
    nameCn: 'WebPilot · AI 网页执行者',
    tagline: 'Exploring an automation direction where AI logs in, clicks, and scrapes web data on your behalf, currently a concept placeholder.',
    taglineCn: '探索让 AI 代替用户登录、点击和抓取网页数据的自动化方向，目前仅作为概念占位。',
    description: 'Exploring an automation direction where AI logs in, clicks, and scrapes web data on your behalf, currently a concept placeholder.',
    descriptionCn: '探索让 AI 代替用户登录、点击和抓取网页数据的自动化方向，目前仅作为概念占位。',
    icon: 'globe',
    status: 'coming-soon',
    cta: undefined,
    features: [
      { en: 'Web automation', cn: '网页自动化执行' },
      { en: 'Login and scrape', cn: '登录抓取数据' },
      { en: 'Task completion', cn: '任务在线完成' },
    ],
  },
  {
    slug: 'chatport',
    name: 'ChatPort · Multi-platform Chat Entry',
    nameCn: 'ChatPort · 多平台聊天入口',
    tagline: 'An experiment in connecting the same AI assistant to Telegram, Slack, WhatsApp, and other chat platforms.',
    taglineCn: '尝试把同一个 AI 助手接入 Telegram / Slack / WhatsApp 等聊天工具的集成方案。',
    description: 'An experiment in connecting the same AI assistant to Telegram, Slack, WhatsApp, and other chat platforms.',
    descriptionCn: '尝试把同一个 AI 助手接入 Telegram / Slack / WhatsApp 等聊天工具的集成方案。',
    icon: 'message-square',
    status: 'coming-soon',
    cta: undefined,
    features: [
      { en: 'Multi-platform chat', cn: '多平台聊天入口' },
      { en: 'Telegram, Slack, WhatsApp', cn: 'Telegram / Slack / WhatsApp' },
      { en: 'Work in familiar chats', cn: '熟悉聊天框里工作' },
    ],
  },
  {
    slug: 'flowforge',
    name: 'FlowForge · Automation Workflow Hub',
    nameCn: 'FlowForge · 自动化工作流中心',
    tagline: 'A workflow automation concept chaining triggers, AI, and external services, still in the design stage.',
    taglineCn: '围绕触发器 + AI + 外部服务串联业务流程的自动化工作流构想，尚在设计阶段。',
    description: 'A workflow automation concept chaining triggers, AI, and external services, still in the design stage.',
    descriptionCn: '围绕触发器 + AI + 外部服务串联业务流程的自动化工作流构想，尚在设计阶段。',
    icon: 'git-branch',
    status: 'coming-soon',
    cta: undefined,
    features: [
      { en: 'Trigger + AI + services', cn: '触发器 + AI + 外部服务' },
      { en: 'End-to-end workflows', cn: '端到端自动化流程' },
      { en: 'Business automation', cn: '业务流程自动化' },
    ],
  },
  {
    slug: 'notemind',
    name: 'NoteMind · Knowledge Organizer',
    nameCn: 'NoteMind · 知识整理助手',
    tagline: 'An experimental idea around OCR and knowledge organization for future learning tools.',
    taglineCn: '围绕图片 / 文档文字识别与知识整理的实验想法，用于探索未来的学习工具形态。',
    description: 'An experimental idea around OCR and knowledge organization for future learning tools.',
    descriptionCn: '围绕图片 / 文档文字识别与知识整理的实验想法，用于探索未来的学习工具形态。',
    icon: 'book-open',
    status: 'beta',
    cta: undefined,
    features: [
      { en: 'OCR from images and docs', cn: '图片文档文字识别' },
      { en: 'Organize and search', cn: '整理搜索回顾' },
      { en: 'Knowledge management', cn: '知识管理助手' },
    ],
  },
  {
    slug: 'polymarket-bot',
    name: 'Polymarket Bot · Market Prediction Agent',
    nameCn: 'Polymarket Bot · 市场预测智能体',
    tagline: 'Exploring an agent that connects prediction markets and on-chain data to generate trend insights and hypotheses, currently only a concept placeholder.',
    taglineCn: '探索连接预测市场和链上数据，用 AI 生成趋势洞见与假设的智能体方向，仅作概念占位。',
    description: 'Exploring an agent that connects prediction markets and on-chain data to generate trend insights and hypotheses, currently only a concept placeholder.',
    descriptionCn: '探索连接预测市场和链上数据，用 AI 生成趋势洞见与假设的智能体方向，仅作概念占位。',
    icon: 'trending-up',
    status: 'coming-soon',
    cta: undefined,
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
