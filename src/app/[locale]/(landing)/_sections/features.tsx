"use client";

import { useTranslations } from "next-intl";

export function FeaturesSection() {
  const t = useTranslations("features");

  return (
    <section
      id="features"
      className="container mx-auto py-24 bg-gray-100 dark:bg-background"
    >
      <p className="text-4xl text-center mb-12">
        {t("title")}
      </p>

      <ul className="max-w-6xl mx-auto gap-2 list-disc grid grid-cols-3 px-12 leading-10">
        <li>{t("items.authentication")}</li>
        <li>{t("items.authorization")}</li>
        <li>{t("items.subscription")}</li>
        <li>{t("items.webhooks")}</li>
        <li>{t("items.todos")}</li>
        <li>{t("items.drizzle")}</li>
        <li>{t("items.theme")}</li>
        <li>{t("items.shadcn")}</li>
        <li>{t("items.tailwind")}</li>
        <li>{t("items.accountDeletion")}</li>
        <li>{t("items.changelog")}</li>
        <li>{t("items.analytics")}</li>
        <li>{t("items.feedback")}</li>
      </ul>
    </section>
  );
}
