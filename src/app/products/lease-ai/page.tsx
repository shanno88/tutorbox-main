"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckIcon, FileText, Shield, Zap } from "lucide-react";

type AccessStatus = "idle" | "loading" | "error";

export default function LeaseAIPage() {
  const [status, setStatus] = useState<AccessStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();

  async function handleStartReview() {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/lease/access", { method: "GET" });
      const data = await res.json();

      if (res.status === 200 && data.ok) {
        // Success - redirect to app.tutorbox.cc with token
        window.location.href = data.entryUrl;
        return;
      }

      if (res.status === 401 && data.code === "NOT_AUTHENTICATED") {
        // Not logged in - redirect to login
        router.push(data.redirectUrl || "/en/login?redirect=/products/lease-ai");
        return;
      }

      if (res.status === 403 && data.code === "NO_PURCHASE") {
        // Not purchased - redirect to pricing
        router.push(data.redirectUrl || "/products/lease-ai/pricing");
        return;
      }

      // Other errors
      setErrorMessage(data.message || "Unable to access Lease AI Review. Please try again.");
      setStatus("error");
    } catch (error) {
      console.error("Lease AI access error:", error);
      setErrorMessage("Network error. Please check your connection and try again.");
      setStatus("error");
    } finally {
      if (status === "loading") {
        setStatus("idle");
      }
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">
          Lease AI Review
        </h1>
        <p className="text-2xl text-muted-foreground mb-2">
          美国租房合同智能审核
        </p>
        <p className="text-xl text-muted-foreground mb-8">
          AI-powered US lease review in 30 seconds
        </p>

        <Button
          onClick={handleStartReview}
          disabled={status === "loading"}
          size="lg"
          className="text-lg px-8 py-6"
        >
          {status === "loading" ? "Checking access..." : "Start Lease Review / 开始审核"}
        </Button>

        {errorMessage && (
          <p className="mt-4 text-sm text-red-500">{errorMessage}</p>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="text-center p-6 rounded-lg border bg-card">
          <Zap className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Fast Analysis</h3>
          <p className="text-muted-foreground">
            Get your lease reviewed in 30 seconds
          </p>
        </div>

        <div className="text-center p-6 rounded-lg border bg-card">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Risk Detection</h3>
          <p className="text-muted-foreground">
            Identify hidden traps and unfair clauses
          </p>
        </div>

        <div className="text-center p-6 rounded-lg border bg-card">
          <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Clear Explanations</h3>
          <p className="text-muted-foreground">
            Understand complex legal terms in plain language
          </p>
        </div>
      </div>

      {/* How It Works - English */}
      <div className="mb-12 p-8 rounded-lg border bg-card">
        <h2 className="text-3xl font-bold mb-6">How it works</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Upload your lease</h3>
              <p className="text-muted-foreground">
                Upload your US lease agreement as PDF or image
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">AI analyzes every clause</h3>
              <p className="text-muted-foreground">
                Our AI reads and analyzes all terms in 30 seconds
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">Get detailed insights</h3>
              <p className="text-muted-foreground">
                Receive explanations of risky terms and negotiation tips
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works - Chinese */}
      <div className="mb-12 p-8 rounded-lg border bg-card">
        <h2 className="text-3xl font-bold mb-6">使用流程</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">上传合同</h3>
              <p className="text-muted-foreground">
                上传美国租房合同（PDF 或图片格式）
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">AI 分析每个条款</h3>
              <p className="text-muted-foreground">
                我们的 AI 在 30 秒内阅读并分析所有条款
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">获得详细分析</h3>
              <p className="text-muted-foreground">
                收到风险条款解释和谈判建议
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Info */}
      <div className="text-center p-8 rounded-lg border bg-muted">
        <h2 className="text-2xl font-bold mb-4">Simple, One-Time Pricing</h2>
        <p className="text-4xl font-bold mb-2">$39 USD</p>
        <p className="text-muted-foreground mb-6">
          per lease review • no subscription • instant access
        </p>
        <Button
          onClick={handleStartReview}
          disabled={status === "loading"}
          size="lg"
        >
          {status === "loading" ? "Checking access..." : "Get Started Now"}
        </Button>
      </div>
    </main>
  );
}
