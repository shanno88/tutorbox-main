"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

interface ApiKeyActionsProps {
  keyId: string;
  maskedKey: string;
  status: "active" | "revoked";
  onActionComplete: () => void;
}

export function ApiKeyActions({
  keyId,
  maskedKey,
  status,
  onActionComplete,
}: ApiKeyActionsProps) {
  const [revoking, setRevoking] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newPlainKey, setNewPlainKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRevoke = async () => {
    if (!confirm("Are you sure you want to revoke this API key? It will no longer work.")) {
      return;
    }

    setRevoking(true);
    try {
      const response = await fetch("/api/admin/billing/api-keys/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKeyId: parseInt(keyId) }),
      });

      if (!response.ok) {
        throw new Error("Failed to revoke API key");
      }

      onActionComplete();
    } catch (error) {
      alert("Error revoking API key: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setRevoking(false);
    }
  };

  const handleRotate = async () => {
    if (!confirm("Are you sure you want to rotate this API key? A new key will be created and the old one revoked.")) {
      return;
    }

    setRotating(true);
    try {
      const response = await fetch("/api/admin/billing/api-keys/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKeyId: parseInt(keyId) }),
      });

      if (!response.ok) {
        throw new Error("Failed to rotate API key");
      }

      const data = await response.json();
      setNewPlainKey(data.newPlainKey);
      setShowNewKeyModal(true);
    } catch (error) {
      alert("Error rotating API key: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setRotating(false);
    }
  };

  const handleCopyKey = () => {
    if (newPlainKey) {
      navigator.clipboard.writeText(newPlainKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseModal = () => {
    setShowNewKeyModal(false);
    setNewPlainKey(null);
    setCopied(false);
    onActionComplete();
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleRevoke}
          disabled={revoking || status === "revoked"}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {revoking ? "Revoking..." : "Revoke"}
        </button>
        <button
          onClick={handleRotate}
          disabled={rotating}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {rotating ? "Rotating..." : "Rotate"}
        </button>
      </div>

      {/* New Key Modal */}
      {showNewKeyModal && newPlainKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">New API Key Created</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your new API key has been created. Copy it now – you won't see it again.
            </p>

            <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-sm break-all">
              {newPlainKey}
            </div>

            <button
              onClick={handleCopyKey}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mb-3"
            >
              {copied ? "✓ Copied!" : "Copy to Clipboard"}
            </button>

            <button
              onClick={handleCloseModal}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Done
            </button>

            <p className="text-xs text-gray-500 mt-4">
              ⚠️ The old key has been revoked and will no longer work.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
