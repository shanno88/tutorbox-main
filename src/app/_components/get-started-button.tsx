"use client";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/events";
import { useRouter } from "next/navigation";

export function GetStartedButton() {
  const router = useRouter();
  
  return (
    <Button
      onClick={() => {
        trackEvent("user clicked get started");
        // Redirect to login page instead of direct Google sign-in
        router.push(`/${window.location.pathname.split("/")[1] || "zh"}/login`);
      }}
    >
      Login to Get Started
    </Button>
  );
}

// Google OAuth removed - redirecting to login page for email magic links
/*
import { signIn } from "next-auth/react";

export function GetStartedButton() {
  return (
    <Button
      onClick={() => {
        trackEvent("user clicked get started");
        signIn("google", { callbackUrl: "/" });
      }}
    >
      Login to Get Started
    </Button>
  );
}
*/
