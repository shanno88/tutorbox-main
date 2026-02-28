"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  // Replace current locale prefix in path
  const getLocalePath = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    return segments.join("/");
  };

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      <Link
        href={getLocalePath("zh")}
        className={
          locale === "zh"
            ? "text-primary font-semibold"
            : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
        }
      >
        中文
      </Link>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <Link
        href={getLocalePath("en")}
        className={
          locale === "en"
            ? "text-primary font-semibold"
            : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
        }
      >
        EN
      </Link>
    </div>
  );
}
