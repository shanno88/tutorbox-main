"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function Links() {
  const path = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const t = useTranslations("nav");

  // 只在当前语言的首页显示导航
  if (path !== "/" && !path.startsWith(`/${locale}`)) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button variant="link" asChild>
        <Link href={`/${locale}#products`}>{t("products")}</Link>
      </Button>

      <Button variant="link" asChild>
        <Link href={`/${locale}#about`}>{t("about")}</Link>
      </Button>
    </div>
  );
}
