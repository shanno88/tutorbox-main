"use client";

import { products, Product } from "@/lib/products";
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
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

// --- types ---
type ProductStatus = "not_started" | "trial_active" | "trial_expired" | "paid" | "locked";

interface ProductStatusResponse {
  productKey: string;
  status: ProductStatus;
  canStartTrial: boolean;
  trialEndsAt?: string | null;
}

// --- icon map ---
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

// --- trial button ---
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

// --- product card ---
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

  const Icon = iconMap[product.icon] || <FileSearch className="w-8 h-8" />;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            {Icon}
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[product.status]}`}>
            {statusLabels[product.status]}
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
        <Button asChild variant="outline" className="w-full group">
          <Link href={`/products/${product.slug}`}>
            {product.cta
              ? t(product.cta === "申请接入" ? "cta.applyIntegration" : product.cta === "加入内测" ? "cta.joinBeta" : product.cta === "了解更多" ? "cta.learnMore" : "cta.tryNow")
              : product.status === "coming-soon"
                ? t("cta.learnMore")
                : t("cta.tryNow")}
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>

        {/* trial 状态按钮：只在有 trial 配置的产品上显示 */}
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

// --- main section ---
export function ProductsSection() {
  const t = useTranslations("products");
  const [trialStatuses, setTrialStatuses] = useState<ProductStatusResponse[]>([]);
  const [startingKey, setStartingKey] = useState<string | null>(null);

  // 拉取当前用户的产品状态
  useEffect(() => {
    fetch("/api/me/products")
      .then((r) => r.json())
      .then((data: ProductStatusResponse[]) => {
        if (Array.isArray(data)) setTrialStatuses(data);
      })
      .catch(() => {}); // 未登录时返回 []，静默处理
  }, []);

  // 开始试用
  async function handleStartTrial(productKey: string) {
    setStartingKey(productKey);
    try {
      const res = await fetch("/api/me/products/start-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productKey }),
      });
      if (res.ok) {
        // 刷新状态
        const updated = await fetch("/api/me/products").then((r) => r.json());
        if (Array.isArray(updated)) setTrialStatuses(updated);
      }
    } finally {
      setStartingKey(null);
    }
  }

  return (
    <section id="products" className="bg-gray-50 dark:bg-gray-800/50 py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-white">
            {t("sectionTitle")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t("sectionDescription")}
          </p>
        </div>

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
