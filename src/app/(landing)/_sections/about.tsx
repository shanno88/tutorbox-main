import { Mail, Github, Twitter } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="bg-white dark:bg-gray-900 py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 dark:text-white">
            关于 Shanno
          </h2>
          
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              我是一名独立开发者，专注于为<strong className="text-gray-900 dark:text-white">海外华人、留学生群体</strong>打造实用的 AI 工具。
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              每个产品都源于真实痛点。在美国生活多年，我深知在异国他乡面临的信息差和语言障碍。
              我希望通过 AI 技术，帮助更多人降低生活成本，做出更明智的决策。
            </p>
          </div>

          <div className="flex justify-center gap-6 mt-12">
            <a 
              href="mailto:shanno@tutorbox.cc" 
              className="flex items-center gap-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span>shanno@tutorbox.cc</span>
            </a>
          </div>

          <div className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Built with ❤️ by Shanno · Powered by AI
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
