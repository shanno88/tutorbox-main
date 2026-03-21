<<<<<<< HEAD
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAnonymousTrial } from "@/hooks/use-anonymous-trial";
import { AnonymousTrialBanner } from "./anonymous-trial-banner";
import {
  AnonymousTrialExpiredModal,
  AnonymousTrialExpiredModalCN,
} from "./anonymous-trial-expired-modal";
import type { AnonymousTrialProduct } from "@/config/anonymous-trial";

interface AnonymousTrialGuardProps {
  product: AnonymousTrialProduct;
  productName: string;
  productNameCN: string;
  children: ReactNode;
  locale?: "en" | "zh";
  autoStart?: boolean; // Auto-start trial on mount
  showBanner?: boolean; // Show countdown banner
  blockOnExpired?: boolean; // Block content when expired
}

export function AnonymousTrialGuard({
  product,
  productName,
  productNameCN,
  children,
  locale = "en",
  autoStart = true,
  showBanner = true,
  blockOnExpired = true,
}: AnonymousTrialGuardProps) {
  const router = useRouter();
  const {
    trialState,
    isLoading,
    hasAccess,
    isExpired,
    minutesRemaining,
    isAuthenticated,
    startTrial,
    markModalAsSeen,
  } = useAnonymousTrial(product);

  const [showExpiredModal, setShowExpiredModal] = useState(false);

  // Auto-start trial if enabled and not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !trialState && autoStart) {
      startTrial();
    }
  }, [isLoading, isAuthenticated, trialState, autoStart, startTrial]);

  // Show expired modal when trial expires (only once)
  useEffect(() => {
    if (
      !isLoading &&
      !isAuthenticated &&
      isExpired &&
      trialState &&
      !trialState.hasSeenExpiredModal
    ) {
      setShowExpiredModal(true);
    }
  }, [isLoading, isAuthenticated, isExpired, trialState]);

  const handleModalClose = async () => {
    setShowExpiredModal(false);
    await markModalAsSeen();
  };

  const handleSignUp = () => {
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/${locale}/login?redirect=${returnUrl}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            {locale === "zh" ? "加载中..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // If authenticated, show content without trial logic
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If expired and blocking is enabled, show blocked state
  if (isExpired && blockOnExpired) {
    return (
      <>
        <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
          <div className="rounded-lg border bg-card p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <svg
                className="h-8 w-8 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {locale === "zh" ? "试用已结束" : "Trial Ended"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {locale === "zh"
                ? `你的 30 分钟 ${productNameCN} 试用已结束。注册后获得 3 天完整试用。`
                : `Your 30-minute ${productName} trial has ended. Sign up for a 3-day full trial.`}
            </p>
            <button
              onClick={handleSignUp}
              className="inline-flex items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-black/90"
            >
              {locale === "zh" ? "立即注册" : "Sign Up Now"}
            </button>
          </div>
        </div>

        {locale === "zh" ? (
          <AnonymousTrialExpiredModalCN
            isOpen={showExpiredModal}
            onClose={handleModalClose}
            productName={productNameCN}
          />
        ) : (
          <AnonymousTrialExpiredModal
            isOpen={showExpiredModal}
            onClose={handleModalClose}
            productName={productName}
          />
        )}
      </>
    );
  }

  // Show content with trial banner
  return (
    <>
      {showBanner && !isExpired && trialState && (
        <AnonymousTrialBanner
          minutesRemaining={minutesRemaining}
          onSignUp={handleSignUp}
          locale={locale}
        />
      )}

      {children}

      {locale === "zh" ? (
        <AnonymousTrialExpiredModalCN
          isOpen={showExpiredModal}
          onClose={handleModalClose}
          productName={productNameCN}
        />
      ) : (
        <AnonymousTrialExpiredModal
          isOpen={showExpiredModal}
          onClose={handleModalClose}
          productName={productName}
        />
      )}
    </>
  );
}
=======
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAnonymousTrial } from "@/hooks/use-anonymous-trial";
import { AnonymousTrialBanner } from "./anonymous-trial-banner";
import {
  AnonymousTrialExpiredModal,
  AnonymousTrialExpiredModalCN,
} from "./anonymous-trial-expired-modal";
import type { AnonymousTrialProduct } from "@/config/anonymous-trial";

interface AnonymousTrialGuardProps {
  product: AnonymousTrialProduct;
  productName: string;
  productNameCN: string;
  children: ReactNode;
  locale?: "en" | "zh";
  autoStart?: boolean; // Auto-start trial on mount
  showBanner?: boolean; // Show countdown banner
  blockOnExpired?: boolean; // Block content when expired
}

export function AnonymousTrialGuard({
  product,
  productName,
  productNameCN,
  children,
  locale = "en",
  autoStart = true,
  showBanner = true,
  blockOnExpired = true,
}: AnonymousTrialGuardProps) {
  const router = useRouter();
  const {
    trialState,
    isLoading,
    hasAccess,
    isExpired,
    minutesRemaining,
    isAuthenticated,
    startTrial,
    markModalAsSeen,
  } = useAnonymousTrial(product);

  const [showExpiredModal, setShowExpiredModal] = useState(false);

  // Auto-start trial if enabled and not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !trialState && autoStart) {
      startTrial();
    }
  }, [isLoading, isAuthenticated, trialState, autoStart, startTrial]);

  // Show expired modal when trial expires (only once)
  useEffect(() => {
    if (
      !isLoading &&
      !isAuthenticated &&
      isExpired &&
      trialState &&
      !trialState.hasSeenExpiredModal
    ) {
      setShowExpiredModal(true);
    }
  }, [isLoading, isAuthenticated, isExpired, trialState]);

  const handleModalClose = async () => {
    setShowExpiredModal(false);
    await markModalAsSeen();
  };

  const handleSignUp = () => {
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/${locale}/login?redirect=${returnUrl}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            {locale === "zh" ? "加载中..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // If authenticated, show content without trial logic
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If expired and blocking is enabled, show blocked state
  if (isExpired && blockOnExpired) {
    return (
      <>
        <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
          <div className="rounded-lg border bg-card p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <svg
                className="h-8 w-8 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {locale === "zh" ? "试用已结束" : "Trial Ended"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {locale === "zh"
                ? `你的 30 分钟 ${productNameCN} 试用已结束。注册后获得 3 天完整试用。`
                : `Your 30-minute ${productName} trial has ended. Sign up for a 3-day full trial.`}
            </p>
            <button
              onClick={handleSignUp}
              className="inline-flex items-center justify-center rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-black/90"
            >
              {locale === "zh" ? "立即注册" : "Sign Up Now"}
            </button>
          </div>
        </div>

        {locale === "zh" ? (
          <AnonymousTrialExpiredModalCN
            isOpen={showExpiredModal}
            onClose={handleModalClose}
            productName={productNameCN}
          />
        ) : (
          <AnonymousTrialExpiredModal
            isOpen={showExpiredModal}
            onClose={handleModalClose}
            productName={productName}
          />
        )}
      </>
    );
  }

  // Show content with trial banner
  return (
    <>
      {showBanner && !isExpired && trialState && (
        <AnonymousTrialBanner
          minutesRemaining={minutesRemaining}
          onSignUp={handleSignUp}
          locale={locale}
        />
      )}

      {children}

      {locale === "zh" ? (
        <AnonymousTrialExpiredModalCN
          isOpen={showExpiredModal}
          onClose={handleModalClose}
          productName={productNameCN}
        />
      ) : (
        <AnonymousTrialExpiredModal
          isOpen={showExpiredModal}
          onClose={handleModalClose}
          productName={productName}
        />
      )}
    </>
  );
}
>>>>>>> origin/main
