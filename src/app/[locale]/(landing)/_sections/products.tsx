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
import { FileSearch, PenTool, Video, ArrowRight, MessageCircle, Globe, MessageSquare, GitBranch, BookOpen, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

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

function ProductCard({ product }: { product: Product }) {
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
      <CardFooter>
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
      </CardFooter>
    </Card>
  );
}

export function ProductsSection() {
  const t = useTranslations("products");

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
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
