"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PaddleUpgradeButton() {
  return (
    <Button asChild>
      <Link href="/#pricing">Get Started</Link>
    </Button>
  );
}
