"use client";

import { PaddleCheckoutButton } from "@/components/paddle/checkout-button";
import { CheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export function PricingSection() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const isZh = locale === "zh";

  const grammarPriceId = isZh
    ? process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY
    : process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD;
  const leasePriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD;

  console.log("GRAMMAR priceId", grammarPriceId);
  console.log("LEASE priceId", leasePriceId);

  return (
    <section className="bg-white dark:bg-gray-900" id="pricing">
      <div className="max-w-screen-xl px-4 py-8 mx-auto lg:py-24 lg:px-6">
        <div className="max-w-screen-md mx-auto mb-8 text-center lg:mb-12">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {t("headline")}
          </h2>
          <p className="mb-5 font-light text-gray-500 sm:text-xl dark:text-gray-400">
            {t("subhead")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col p-6 text-center text-gray-900 bg-white border border-gray-100 rounded-lg shadow dark:border-gray-600 xl:p-8 dark:bg-gray-800 dark:text-white">
            <h3 className="mb-2 text-2xl font-semibold">{t("products.grammarMaster.name")}</h3>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              {t("products.grammarMaster.nameCn")}
            </p>
            <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
              {isZh ? t("products.grammarMaster.taglineCn") : t("products.grammarMaster.tagline")}
            </p>
            <div className="flex items-baseline justify-center my-8">
              <span className="mr-2 text-5xl font-extrabold">{t("products.grammarMaster.price")}</span>
              <span className="text-xl text-gray-500 dark:text-gray-400">{t("products.grammarMaster.period")}</span>
            </div>
            <ul role="list" className="mb-8 space-y-4 text-left">
              {(isZh ? t.raw("products.grammarMaster.featuresCn") : t.raw("products.grammarMaster.features")).map((feature: string, index: number) => (
                <li key={index} className="flex items-center space-x-3">
                  <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <PaddleCheckoutButton
              priceId={grammarPriceId}
              className="w-full"
            >
              {t("products.grammarMaster.cta")}
            </PaddleCheckoutButton>
          </div>

          <div className="flex flex-col p-6 text-center text-gray-900 bg-white border border-gray-100 rounded-lg shadow dark:border-gray-600 xl:p-8 dark:bg-gray-800 dark:text-white">
            <h3 className="mb-2 text-2xl font-semibold">{t("products.leaseAssistant.name")}</h3>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              {t("products.leaseAssistant.nameCn")}
            </p>
            <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
              {isZh ? t("products.leaseAssistant.taglineCn") : t("products.leaseAssistant.tagline")}
            </p>
            <div className="flex items-baseline justify-center my-8">
              <span className="mr-2 text-5xl font-extrabold">{t("products.leaseAssistant.price")}</span>
              <span className="text-xl text-gray-500 dark:text-gray-400">{t("products.leaseAssistant.period")}</span>
            </div>
            <ul role="list" className="mb-8 space-y-4 text-left">
              {(isZh ? t.raw("products.leaseAssistant.featuresCn") : t.raw("products.leaseAssistant.features")).map((feature: string, index: number) => (
                <li key={index} className="flex items-center space-x-3">
                  <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <PaddleCheckoutButton
              priceId={leasePriceId}
              className="w-full"
            >
              {t("products.leaseAssistant.cta")}
            </PaddleCheckoutButton>
          </div>
        </div>
      </div>
    </section>
  );
}
