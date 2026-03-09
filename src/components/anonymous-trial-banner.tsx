"use client";

import { Clock, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AnonymousTrialBannerProps {
  minutesRemaining: number;
  onSignUp?: () => void;
  locale?: "en" | "zh";
}

export function AnonymousTrialBanner({
  minutesRemaining,
  onSignUp,
  locale = "en",
}: AnonymousTrialBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const isUrgent = minutesRemaining <= 5;

  const content = locale === "zh" ? {
    title: "匿名试用",
    remaining: `剩余 ${minutesRemaining} 分钟`,
    message: "注册后获得 3 天完整试用",
    cta: "立即注册",
  } : {
    title: "Anonymous Trial",
    remaining: `${minutesRemaining} min remaining`,
    message: "Sign up for 3-day full trial",
    cta: "Sign Up",
  };

  return (
    <div
      className={`sticky top-0 z-40 border-b ${
        isUrgent
          ? "bg-orange-50 border-orange-200"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Clock
            className={`h-4 w-4 flex-shrink-0 ${
              isUrgent ? "text-orange-600" : "text-blue-600"
            }`}
          />
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="font-semibold">{content.title}:</span>
            <span
              className={isUrgent ? "text-orange-700 font-semibold" : "text-blue-700"}
            >
              {content.remaining}
            </span>
            <span className="text-muted-foreground hidden sm:inline">
              · {content.message}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSignUp && (
            <Button
              onClick={onSignUp}
              size="sm"
              variant={isUrgent ? "default" : "outline"}
              className="text-xs"
            >
              {content.cta}
            </Button>
          )}
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-black/5 rounded"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
