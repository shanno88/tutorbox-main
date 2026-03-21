<<<<<<< HEAD
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

  // Only show nav links on homepage
  if (path !== "/" && !path.startsWith(`/${locale}`)) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button variant={"link"} asChild>
        <Link href={`/${locale}#products`}>
          {locale === "zh" ? "产品" : "Products"}
        </Link>
      </Button>

      <Button variant={"link"} asChild>
        <Link href={`/${locale}#about`}>
          {locale === "zh" ? "关于" : "About"}
        </Link>
      </Button>
    </div>
  );
}
=======
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Links() {
  const path = usePathname();

  if (path !== "/") {
    return null;
  }

  return (
    <div>
      <Button variant={"link"} asChild>
        <Link href="#products">产品</Link>
      </Button>

      <Button variant={"link"} asChild>
        <Link href="#about">关于</Link>
      </Button>
    </div>
  );
}
>>>>>>> origin/main
