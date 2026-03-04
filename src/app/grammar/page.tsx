"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GrammarPage() {
  useEffect(() => {
    window.location.href = "/products/grammar-master";
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center">
      <p className="mb-2">正在跳转到语法大师产品页…</p>
      <p className="text-sm text-gray-500">
        如果长时间没有跳转，请手动点击{" "}
        <Link href="/products/grammar-master" className="underline underline-offset-4">
          这里
        </Link>
        。
      </p>
    </main>
  );
}
