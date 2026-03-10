// React hook to check external link health status
import { useEffect, useState } from "react";

export interface LinkHealthStatus {
  status: "unknown" | "ok" | "unavailable";
  lastCheckedAt?: string;
  lastStatusCode?: number;
  lastError?: string;
}

type HealthMap = Record<string, LinkHealthStatus>;

/**
 * Hook to get health status for all external links
 */
export function useExternalLinkHealth() {
  const [healthMap, setHealthMap] = useState<HealthMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch("/api/external-links/health");
        if (!response.ok) {
          throw new Error("Failed to fetch link health");
        }
        const data = await response.json();
        setHealthMap(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching external link health:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchHealth();
  }, []);

  return { healthMap, loading, error };
}

/**
 * Hook to get health status for a specific link
 */
export function useLinkHealth(linkId: string): LinkHealthStatus & { loading: boolean } {
  const { healthMap, loading } = useExternalLinkHealth();

  return {
    ...(healthMap[linkId] || { status: "unknown" as const }),
    loading,
  };
}
