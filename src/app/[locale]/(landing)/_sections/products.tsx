"use client";

import { products, Product } from "@/lib/products";
import { products as trialConfig } from "@/config/products";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FileSearch, PenTool, Video, ArrowRight,
  MessageCircle, Globe, MessageSquare,
  GitBranch, BookOpen, TrendingUp,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type ProductStatus = "not_started" | "trial_active" | "trial_expired" | "paid" | "locked";

interface ProductStatusResponse {
  productKey: string;
  status: ProductStatus;
  canStartTrial: boolean;
  trialEndsAt?: string | null;
}

const iconMap: Record<string, ReactNode> = {
  "file-search": <FileSearch className="w-8 h-8" />,
  "pen-tool": <PenTool className="w-8 h-8" />,
  "video": <Video className="w-8 h-8" />,
  "message-circle": <MessageCircle className="w-8 h-8" />,
  "globe": <Globe className="w-8 h-8" />,
  "message-square": <MessageSquare className="w-8 h-8" />,
  "git-branch": <GitBranch className="w-8 h-8" />,
  "book-open": <BookOpen className="w-8 h-8" />,
  "trending-up": <TrendingUp className="w-8 h-8" />,
};

function TrialButton({
  trialStatus,
  productSlug,
  onStartTrial,
  starting,
}: {
  trialStatus: ProductStatusResponse | null;
  productSlug: string;
  onStartTrial: (key: string) => void;
  starting: boolean;
}) {
  const trialProduct = trialConfig.find((p: (typeof trialConfig)[number]) => p.key === productSlug);
  if (!trialStatus && trialProduct?.trialEnabled) {
    return (
      <Button
        variant="default"
        className="w-full mt-2"
        disabled={starting}
        onClick={() => onStartTrial(productSlug)}
      >
        {starting ? "开始中..." : "免费试用 7 天"}
      </Button>
    );
  }
  if (!trialStatus) return null;

  switch (trialStatus.status) {
    case "not_started":
      return (
        <Button
          variant="default"
          className="w-full mt-2"
          disabled={starting}
          onClick={() => onStartTrial(productSlug)}
        >
          {starting ? "开始中..." : "免费试用 7 天"}
        </Button>
      );
    case "trial_active":
      return (
        <div className="w-full mt-2 text-center text-xs text-green-600 font-medium py-2 bg-green-50 rounded-md">
          试用中 · 到期：{new Date(trialStatus.trialEndsAt!).toLocaleDateString("zh-CN")}
        </div>
      );
    case "trial_expired":
      return (
        <div className="w-full mt-2 text-center text-xs text-gray-500 py-2 bg-gray-50 rounded-md">
          试用已结束
        </div>
      );
    case "paid":
      return (
        <div className="w-full mt-2 text-center text-xs text-blue-600 font-medium py-2 bg-blue-50 rounded-md">
          ✓ 已购买
        </div>
      );
    default:
      return null;
  }
}

function ProductCard({
  product,
  trialStatus,
  onStartTrial,
  starting,
}: {
  product: Product;
  trialStatus: ProductStatusResponse | null;
  onStartTrial: (key: string) => void;
  starting: boolean;
}) {
  const t = useTranslations("products");
  const locale = useLocale();
  const isZh = locale === "zh";

  // Custom status text for Lab concept products
  const labProductStatuses: Record<string, { en: string; cn: string }> = {
    "thinker-ai": {
      en: "Shanno Lab concept project · Launch date not yet determined",
      cn: "Shanno Lab 概念项目 · 上线时间待定",
    },
    "webpilot": {
      en: "Lab concept project · No concrete development schedule yet",
      cn: "Lab 概念项目 · 暂无具体开发排期",
    },
    "chatport": {
      en: "Exploratory direction · Currently a placeholder in the product lineup",
      cn: "实验方向 · 目前仅为产品线路占位",
    },
    "flowforge": {
      en: "Shanno Lab concept project · Not available for use yet",
      cn: "Shanno Lab 概念项目 · 尚未开放使用",
    },
    "notemind": {
      en: "Experimental project · No launch timeline yet",
      cn: "实验项目 · 尚无上线时间表",
    },
    "polymarket-bot": {
      en: "High-risk domain research · No public product plans",
      cn: "高风险领域研究 · 暂无对外产品计划",
    },
  };

  const statusLabels = {
    live: t("status.live"),
    beta: t("status.beta"),
    "coming-soon": t("status.comingSoon"),
  };

  const statusClasses = {
    live: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    beta: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "coming-soon": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };

  // Determine status text to display
  const statusText = labProductStatuses[product.slug]
    ? isZh
      ? labProductStatuses[product.slug].cn
      : labProductStatuses[product.slug].en
    : statusLabels[product.status];

  const Icon = iconMap[product.icon] || <FileSearch className="w-8 h-8" />;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            {Icon}
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[product.status]}`}>
            {statusText}
          </span>
        </div>
        <CardTitle className="mt-4">{product.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {product.nameCn}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {isZh ? product.taglineCn : product.tagline}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          {isZh ? product.tagline : product.taglineCn}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {product.cta !== undefined && (
          <Button asChild variant="outline" className="w-full group">
            <Link href={
              product.slug === "lease-ai" ? `/${locale}/lease-ai` :
              product.slug === "grammar-master" ? `/${locale}/grammar-master` :
              product.slug === "cast-master" ? `/${locale}/cast-master` :
              `/products/${product.slug}`
            }>
              {product.cta
                ? t(
                    product.cta === "申请接入"
                      ? "cta.applyIntegration"
                      : product.cta === "加入内测"
                        ? "cta.joinBeta"
                        : product.cta === "了解更多"
                          ? "cta.learnMore"
                          : "cta.tryNow"
                  )
                : product.status === "coming-soon"
                  ? t("cta.learnMore")
                  : t("cta.tryNow")}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        )}

        <TrialButton
          trialStatus={trialStatus}
          productSlug={product.slug}
          onStartTrial={onStartTrial}
          starting={starting}
        />
      </CardFooter>
    </Card>
  );
}

export function ProductsSection() {
  const t = useTranslations("products");
  const [trialStatuses, setTrialStatuses] = useState<ProductStatusResponse[]>([]);
  const [startingKey, setStartingKey] = useState<string | null>(null);

  const locale = useLocale();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  useEffect(() => {
    fetch("/api/me/products")
      .then((r) => r.json())
      .then((data: ProductStatusResponse[]) => {
        if (Array.isArray(data)) setTrialStatuses(data);
      })
      .catch(() => {});
  }, []);

  async function handleStartTrial(productKey: string) {
    if (!isLoggedIn) {
      window.location.href = `/${locale}/login`;
      return;
    }
    setStartingKey(productKey);
    try {
      const res = await fetch("/api/me/products/start-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productKey }),
      });
      if (res.ok) {
        const updated = await fetch("/api/me/products").then((r) => r.json());
        if (Array.isArray(updated)) setTrialStatuses(updated);
      }
    } finally {
      setStartingKey(null);
    }
  }

  return (
    <section id="products" className="bg-gray-50 dark:bg-gray-800/50 py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {products.map((product) => {
            const trialStatus = trialStatuses.find(
              (s) => s.productKey === product.slug
            ) ?? null;

            return (
              <ProductCard
                key={product.slug}
                product={product}
                trialStatus={trialStatus}
                onStartTrial={handleStartTrial}
                starting={startingKey === product.slug}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
