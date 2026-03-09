"use client";

import { CheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { PaddleCheckoutButton } from "@/components/paddle/checkout-button";

console.log(
  "priceIds in component",
  process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD,
  process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY,
  process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD,
);

export function PricingSection() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const isZh = locale === "zh";

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const grammarPriceId = isZh
    ? process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_CNY
    : process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_GRAMMAR_YEARLY_USD;
  const leasePriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_LEASE_ONETIME_USD;
  const prompterPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PROMPTER_YEARLY_CNY;

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 max-w-6xl mx-auto">
          <div id="grammar-master-pricing" className="flex flex-col p-6 text-center text-gray-900 bg-white border border-gray-100 rounded-lg shadow dark:border-gray-600 xl:p-8 dark:bg-gray-800 dark:text-white">
            <h3 className="mb-2 text-2xl font-semibold">{t("products.grammarMaster.name")}</h3>
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              {t("products.grammarMaster.nameCn")}
            </p>
            <p className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
              {isZh ? t("products.grammarMaster.taglineCn") : t("products.grammarMaster.tagline")}
            </p>
            <div className="flex items-baseline justify-center my-8">
              <span className="mr-2 text-5xl font-extrabold">{t("products.grammarMaster.price")}</span>
              <span className="text-xl text-gray-500 dark:text-gray-400">{isZh ? "/年" : "/year"}</span>
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
              userId={userId}
              className="w-full"
            >
              {t("products.grammarMaster.cta")}
            </PaddleCheckoutButton>
          </div>

          <div className="flex flex-col p-6 text-center text-gray-900 bg-amber-50 border border-amber-200 rounded-lg shadow dark:border-amber-900/40 xl:p-8 dark:bg-amber-950/20 dark:text-white">
            <h3 className="mb-2 text-2xl font-semibold">Cast Master</h3>
            <p className="mb-2 text-sm text-amber-700/80 dark:text-amber-200/80">播感大师</p>
            <p className="font-light text-amber-900/80 sm:text-lg dark:text-amber-100/80">
              AI 提词器，短视频脚本一键生成
            </p>
            <div className="flex items-baseline justify-center my-8">
              <span className="mr-2 text-5xl font-extrabold">¥99</span>
              <span className="text-xl text-amber-900/60 dark:text-amber-100/60">/年</span>
            </div>
            <ul role="list" className="mb-8 space-y-4 text-left">
              <li className="flex items-center space-x-3">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-amber-600" />
                <span>AI 智能脚本生成（带货/课程/短视频）</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-amber-600" />
                <span>专业提词器滚动播放</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-amber-600" />
                <span>韵律标注 & 停顿提示</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-amber-600" />
                <span>违禁词智能检测</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-amber-600" />
                <span>导出 Word / SRT 字幕</span>
              </li>
            </ul>
            <PaddleCheckoutButton
              priceId={prompterPriceId}
              userId={userId}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              获取播感大师
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
              userId={userId}
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
