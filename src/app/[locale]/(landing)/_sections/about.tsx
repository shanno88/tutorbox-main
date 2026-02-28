import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function AboutSection() {
  const t = await getTranslations("about");
  const email = t("email");

  return (
    <section id="about" className="bg-white dark:bg-gray-900 py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 dark:text-white">
            {t("title")}
          </h2>
          
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              {t.rich("intro", {
                strong: (chunks) => (
                  <strong className="font-semibold">{chunks}</strong>
                ),
              })}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {t("story")}
            </p>
          </div>

          <div className="flex justify-center gap-6 mt-12">
            <a 
              href={`mailto:${email}`} 
              className="flex items-center gap-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span>{email}</span>
            </a>
          </div>

          <div className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {t("builtWith")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
