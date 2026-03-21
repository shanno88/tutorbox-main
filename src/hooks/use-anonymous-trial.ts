<<<<<<< HEAD
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ANONYMOUS_TRIAL_CONFIG,
  type AnonymousTrialState,
  type AnonymousTrialProduct,
  isAnonymousTrialExpired,
  getTrialMinutesRemaining,
} from "@/config/anonymous-trial";

interface UseAnonymousTrialResult {
  // State
  trialState: AnonymousTrialState | null;
  isLoading: boolean;
  hasAccess: boolean;
  isExpired: boolean;
  minutesRemaining: number;
  isAuthenticated: boolean;
  
  // Actions
  startTrial: () => Promise<void>;
  markModalAsSeen: () => Promise<void>;
  incrementAction: (product: AnonymousTrialProduct) => Promise<void>;
  refreshState: () => Promise<void>;
}

/**
 * Client-side hook for anonymous trial management
 */
export function useAnonymousTrial(product: AnonymousTrialProduct): UseAnonymousTrialResult {
  const { data: session, status: sessionStatus } = useSession();
  const [trialState, setTrialState] = useState<AnonymousTrialState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = sessionStatus === "authenticated" && !!session?.user;

  // Fetch trial state from API
  const fetchTrialState = useCallback(async () => {
    try {
      const response = await fetch("/api/anonymous-trial/state");
      if (response.ok) {
        const data = await response.json();
        setTrialState(data.state);
      } else {
        setTrialState(null);
      }
    } catch (error) {
      console.error("[useAnonymousTrial] Failed to fetch state:", error);
      setTrialState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (sessionStatus !== "loading") {
      fetchTrialState();
    }
  }, [sessionStatus, fetchTrialState]);

  // Auto-refresh every minute to update countdown
  useEffect(() => {
    if (!trialState || isAuthenticated) return;

    const interval = setInterval(() => {
      fetchTrialState();
    }, 60 * 1000); // Refresh every minute

    return () => clearInterval(interval);
  }, [trialState, isAuthenticated, fetchTrialState]);

  // Start trial
  const startTrial = useCallback(async () => {
    try {
      const response = await fetch("/api/anonymous-trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });

      if (response.ok) {
        const data = await response.json();
        setTrialState(data.state);
      }
    } catch (error) {
      console.error("[useAnonymousTrial] Failed to start trial:", error);
    }
  }, [product]);

  // Mark modal as seen
  const markModalAsSeen = useCallback(async () => {
    try {
      await fetch("/api/anonymous-trial/mark-seen", {
        method: "POST",
      });
      
      if (trialState) {
        setTrialState({
          ...trialState,
          hasSeenExpiredModal: true,
        });
      }
    } catch (error) {
      console.error("[useAnonymousTrial] Failed to mark modal as seen:", error);
    }
  }, [trialState]);

  // Increment action count
  const incrementAction = useCallback(async (actionProduct: AnonymousTrialProduct) => {
    try {
      await fetch("/api/anonymous-trial/increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: actionProduct }),
      });
      
      // Refresh state after incrementing
      await fetchTrialState();
    } catch (error) {
      console.error("[useAnonymousTrial] Failed to increment action:", error);
    }
  }, [fetchTrialState]);

  // Computed values
  const isExpired = trialState ? isAnonymousTrialExpired(trialState) : false;
  const minutesRemaining = trialState ? getTrialMinutesRemaining(trialState) : 0;
  
  // Has access if authenticated OR (has trial state AND not expired)
  const hasAccess = isAuthenticated || (!!trialState && !isExpired);

  return {
    trialState,
    isLoading: isLoading || sessionStatus === "loading",
    hasAccess,
    isExpired,
    minutesRemaining,
    isAuthenticated,
    startTrial,
    markModalAsSeen,
    incrementAction,
    refreshState: fetchTrialState,
  };
}
=======
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  ANONYMOUS_TRIAL_CONFIG,
  type AnonymousTrialState,
  type AnonymousTrialProduct,
  isAnonymousTrialExpired,
  getTrialMinutesRemaining,
} from "@/config/anonymous-trial";

interface UseAnonymousTrialResult {
  // State
  trialState: AnonymousTrialState | null;
  isLoading: boolean;
  hasAccess: boolean;
  isExpired: boolean;
  minutesRemaining: number;
  isAuthenticated: boolean;
  
  // Actions
  startTrial: () => Promise<void>;
  markModalAsSeen: () => Promise<void>;
  incrementAction: (product: AnonymousTrialProduct) => Promise<void>;
  refreshState: () => Promise<void>;
}

/**
 * Client-side hook for anonymous trial management
 */
export function useAnonymousTrial(product: AnonymousTrialProduct): UseAnonymousTrialResult {
  const { data: session, status: sessionStatus } = useSession();
  const [trialState, setTrialState] = useState<AnonymousTrialState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = sessionStatus === "authenticated" && !!session?.user;

  // Fetch trial state from API
  const fetchTrialState = useCallback(async () => {
    try {
      const response = await fetch("/api/anonymous-trial/state");
      if (response.ok) {
        const data = await response.json();
        setTrialState(data.state);
      } else {
        setTrialState(null);
      }
    } catch (error) {
      console.error("[useAnonymousTrial] Failed to fetch state:", error);
      setTrialState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (sessionStatus !== "loading") {
      fetchTrialState();
    }
  }, [sessionStatus, fetchTrialState]);

  // Auto-refresh every minute to update countdown
  useEffect(() => {
    if (!trialState || isAuthenticated) return;

    const interval = setInterval(() => {
      fetchTrialState();
    }, 60 * 1000); // Refresh every minute

    return () => clearInterval(interval);
  }, [trialState, isAuthenticated, fetchTrialState]);

  // Start trial
  const startTrial = useCallback(async () => {
    try {
      const response = await fetch("/api/anonymous-trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });

      if (response.ok) {
        const data = await response.json();
        setTrialState(data.state);
      }
    } catch (error) {
      console.error("[useAnonymousTrial] Failed to start trial:", error);
    }
  }, [product]);

  // Mark modal as seen
  const markModalAsSeen = useCallback(async () => {
    try {
      await fetch("/api/anonymous-trial/mark-seen", {
        method: "POST",
      });
      
      if (trialState) {
        setTrialState({
          ...trialState,
          hasSeenExpiredModal: true,
        });
      }
    } catch (error) {
      console.error("[useAnonymousTrial] Failed to mark modal as seen:", error);
    }
  }, [trialState]);

  // Increment action count
  const incrementAction = useCallback(async (actionProduct: AnonymousTrialProduct) => {
    try {
      await fetch("/api/anonymous-trial/increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: actionProduct }),
      });
      
      // Refresh state after incrementing
      await fetchTrialState();
    } catch (error) {
      console.error("[useAnonymousTrial] Failed to increment action:", error);
    }
  }, [fetchTrialState]);

  // Computed values
  const isExpired = trialState ? isAnonymousTrialExpired(trialState) : false;
  const minutesRemaining = trialState ? getTrialMinutesRemaining(trialState) : 0;
  
  // Has access if authenticated OR (has trial state AND not expired)
  const hasAccess = isAuthenticated || (!!trialState && !isExpired);

  return {
    trialState,
    isLoading: isLoading || sessionStatus === "loading",
    hasAccess,
    isExpired,
    minutesRemaining,
    isAuthenticated,
    startTrial,
    markModalAsSeen,
    incrementAction,
    refreshState: fetchTrialState,
  };
}
>>>>>>> origin/main
