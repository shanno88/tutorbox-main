"use client";

import { openCheckout } from "@/lib/paddle";
import { Button } from "@/components/ui/button";

interface PaddleCheckoutButtonProps {
  priceId?: string;
  userId?: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  className?: string;
}

export function PaddleCheckoutButton({
  priceId,
  userId,
  children,
  variant = "default",
  className,
}: PaddleCheckoutButtonProps) {
  const handleClick = async () => {
    if (!priceId) {
      console.warn("[PaddleCheckoutButton] Missing priceId; checkout not opened.");
      return;
    }
    console.log("[PaddleCheckoutButton] Using priceId", priceId);
    await openCheckout({ priceId, userId });
  };

  return (
    <Button onClick={handleClick} variant={variant} className={className}>
      {children}
    </Button>
  );
}
