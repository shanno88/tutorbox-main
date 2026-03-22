"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface TrialStatusResponse {
  product_key: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  days_remaining: number | null;
}

interface UseTrialResult {
  trialStatus: TrialStatusResponse | null;
  isLoading: boolean;
  error: string | null;
  startTrial: () => Promise<void>;
  daysRemaining: number;
  isTrialActive: boolean;
}

/**
 * Hook for managing trial state via FastAPI /trial/* endpoints
 * Handles fetching trial status and starting new trials
 */
export function useTrial(productKey: string): UseTrialResult {
  const { data: session, status: sessionStatus } = useSession();
  const [trialStatus, setTrialStatus] = useState<TrialStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch trial status from Next.js API Route
  const fetchTrialStatus = useCallback(async () => {
    if (!session?.user?.id) {
      console.warn("[useTrial] Session not loaded or user.id missing", { session });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("[useTrial] Fetching trial status", {
        productKey,
        url: `/api/trial/status/${productKey}`,
      });

      const response = await fetch(
        `/api/trial/status/${productKey}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("[useTrial] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        setTrialStatus(data);
      } else if (response.status === 404) {
        // No trial found, that's okay
        setTrialStatus(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `Failed to fetch trial status: ${response.statusText}`);
      }
    } catch (err) {
      console.error("[useTrial] Failed to fetch trial status:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, productKey]);

  // Initial load
  useEffect(() => {
    if (sessionStatus !== "loading") {
      fetchTrialStatus();
    }
  }, [sessionStatus, fetchTrialStatus]);

  // Start trial via Next.js API Route
  const startTrial = useCallback(async () => {
    if (!session?.user?.id) {
      console.warn("[useTrial] Session not loaded or user.id missing", { session });
      setError("User not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("[useTrial] Starting trial", {
        productKey,
        url: `/api/trial/start`,
      });

      const response = await fetch(`/api/trial/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_key: productKey,
        }),
      });

      console.log("[useTrial] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        setTrialStatus(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to start trial");
      }
    } catch (err) {
      console.error("[useTrial] Failed to start trial:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, productKey]);

  // Computed values
  const daysRemaining = trialStatus?.days_remaining ?? 0;
  const isTrialActive = trialStatus?.status === "active" && daysRemaining > 0;

  return {
    trialStatus,
    isLoading: isLoading || sessionStatus === "loading",
    error,
    startTrial,
    daysRemaining,
    isTrialActive,
  };
}
