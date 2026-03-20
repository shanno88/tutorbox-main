"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { getLiveApps, getAppRoute } from "@/config/apps";

export function Links() {
  const path = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || "en";

  // Only show app links on homepage
  if (path !== "/" && !path.startsWith(`/${locale}`)) {
    return null;
  }

  const liveApps = getLiveApps();

  return (
    <div className="flex gap-2">
      {liveApps.map((app) => (
        <Button key={app.slug} variant={"link"} asChild>
          <Link href={getAppRoute(app.slug, locale)}>
            {locale === "zh" ? app.nameCn : app.name}
          </Link>
        </Button>
      ))}

      <Button variant={"link"} asChild>
        <Link href="#about">
          {locale === "zh" ? "关于" : "About"}
        </Link>
      </Button>
    </div>
  );
}
