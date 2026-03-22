"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ToggleApiKeyStatusProps {
  keyId: number;
  currentStatus: string;
}

export function ToggleApiKeyStatus({
  keyId,
  currentStatus,
}: ToggleApiKeyStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newStatus = status === "active" ? "revoked" : "active";
      const response = await fetch("/api/admin/api-keys/toggle-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || ""}`,
        },
        body: JSON.stringify({
          keyId,
          newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update API key status");
      }

      setStatus(newStatus);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update API key status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={status === "active" ? "destructive" : "default"}
      size="sm"
    >
      {isLoading
        ? "Updating..."
        : status === "active"
          ? "Revoke"
          : "Activate"}
    </Button>
  );
}
