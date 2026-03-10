"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLinkHealth } from "@/hooks/use-external-link-health";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

interface ExternalLinkButtonProps {
  linkId: string;
  url: string;
  children: ReactNode;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  className?: string;
  hideWhenUnavailable?: boolean; // If true, hide button when link is unavailable
  onUnavailableClick?: () => void; // Custom handler when unavailable link is clicked
}

export function ExternalLinkButton({
  linkId,
  url,
  children,
  variant = "outline",
  className = "",
  hideWhenUnavailable = false,
  onUnavailableClick,
}: ExternalLinkButtonProps) {
  const { status, loading, lastError } = useLinkHealth(linkId);

  // While loading, show button as normal (optimistic)
  if (loading) {
    return (
      <Button
        variant={variant}
        className={className}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        {children}
      </Button>
    );
  }

  // If link is unavailable and hideWhenUnavailable is true, don't render
  if (status === "unavailable" && hideWhenUnavailable) {
    return null;
  }

  // If link is unavailable, show disabled button with tooltip
  if (status === "unavailable") {
    const handleClick = () => {
      if (onUnavailableClick) {
        onUnavailableClick();
      } else {
        alert(
          "The partner's trial page is currently unavailable (404 or unreachable). " +
          "This is an issue on their side, not with your account or device. " +
          "Please try again later or contact support."
        );
      }
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block">
              <Button
                variant={variant}
                className={`${className} opacity-60 cursor-not-allowed`}
                disabled
                onClick={handleClick}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {children}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-semibold mb-1">Partner page unavailable</p>
            <p className="text-xs">
              The external trial page is currently returning a 404 or cannot be reached.
              This is an issue on the partner's side, not with your account.
            </p>
            {lastError && (
              <p className="text-xs mt-1 text-muted-foreground">
                Error: {lastError}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Link is OK, render normal button
  return (
    <Button
      variant={variant}
      className={className}
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
    >
      {children}
    </Button>
  );
}
