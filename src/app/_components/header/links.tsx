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
