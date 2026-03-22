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

  const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

  // Fetch trial status from FastAPI
  const fetchTrialStatus = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${fastApiUrl}/trial/status/${productKey}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.id}`, // Simplified for now
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTrialStatus(data);
      } else if (response.status === 404) {
        // No trial found, that's okay
        setTrialStatus(null);
      } else {
        setError(`Failed to fetch trial status: ${response.statusText}`);
      }
    } catch (err) {
      console.error("[useTrial] Failed to fetch trial status:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, productKey, fastApiUrl]);

  // Initial load
  useEffect(() => {
    if (sessionStatus !== "loading") {
      fetchTrialStatus();
    }
  }, [sessionStatus, fetchTrialStatus]);

  // Start trial
  const startTrial = useCallback(async () => {
    if (!session?.user?.id) {
      setError("User not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${fastApiUrl}/trial/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.id}`, // Simplified for now
        },
        body: JSON.stringify({
          product_key: productKey,
        }),
      });

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
  }, [session?.user?.id, productKey, fastApiUrl]);

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
