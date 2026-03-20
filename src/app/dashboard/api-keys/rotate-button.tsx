"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

interface RotateButtonProps {
  keyId: string;
  status: "active" | "revoked" | "expired";
  onRotateComplete: () => void;
}

export function RotateButton({ keyId, status, onRotateComplete }: RotateButtonProps) {
  const [rotating, setRotating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [plainKey, setPlainKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRotate = async () => {
    if (!confirm("A new key will be created and your old key will stop working. Continue?")) {
      return;
    }

    setRotating(true);
    try {
      const response = await fetch("/api/me/api-keys/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKeyId: keyId }),
      });

      if (!response.ok) {
        throw new Error("Failed to rotate API key");
      }

      const data = await response.json();
      setPlainKey(data.plainKey);
      setShowModal(true);
    } catch (error) {
      alert("Error rotating API key: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setRotating(false);
    }
  };

  const handleCopy = () => {
    if (plainKey) {
      navigator.clipboard.writeText(plainKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPlainKey(null);
    setCopied(false);
    onRotateComplete();
  };

  return (
    <>
      <button
        onClick={handleRotate}
        disabled={rotating || status !== "active"}
        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {rotating ? "Rotating..." : "Rotate"}
      </button>

      {/* New Key Modal */}
      {showModal && plainKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">New API Key Created</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your new API key has been created. Copy it now – you won't see it again.
            </p>

            <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-sm break-all">
              {plainKey}
            </div>

            <button
              onClick={handleCopy}
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
              ⚠️ Store this key securely. You will not be able to see it again.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
