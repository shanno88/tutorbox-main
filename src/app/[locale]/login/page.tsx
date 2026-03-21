<<<<<<< HEAD
"use client";

import { FormEvent, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "zh";

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("tutorbox_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save email if remember checkbox is checked
      if (rememberEmail) {
        localStorage.setItem("tutorbox_remembered_email", email.trim());
      } else {
        localStorage.removeItem("tutorbox_remembered_email");
      }

      // Use email magic link provider
      await signIn("email", {
        email: email.trim(),
        callbackUrl: `/${locale}`,
        redirect: false,
      });
      setEmailSent(true);
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            A sign-in link has been sent to <span className="font-medium text-foreground">{email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link in your email to complete sign-in. The link will expire in 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Sign in to Tutorbox</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a magic link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border border-input cursor-pointer disabled:opacity-50"
            />
            <span className="text-sm text-muted-foreground">Remember my email</span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>

        <div className="space-y-3 border-t pt-4 mt-4">
          <p className="text-base text-muted-foreground leading-relaxed">
            <strong>English:</strong> Enter your email and we will send you a one-time sign-in link. Click the link in your inbox to access your Tutorbox account — no password needed.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            <strong>中文：</strong>输入邮箱，我们会发送一封包含一次性登录链接的邮件。点击邮件中的链接即可登录，无需密码。
          </p>
        </div>
      </div>
    </div>
  );
}
=======
"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "zh";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use email magic link provider
      await signIn("email", {
        email: email.trim(),
        callbackUrl: `/${locale}`,
        redirect: false,
      });
      setEmailSent(true);
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            A sign-in link has been sent to <span className="font-medium text-foreground">{email}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link in your email to complete sign-in. The link will expire in 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Sign in to Tutorbox</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a magic link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>

        <div className="space-y-3 border-t pt-4 mt-4">
          <p className="text-base text-muted-foreground leading-relaxed">
            <strong>English:</strong> Enter your email and we will send you a one-time sign-in link. Click the link in your inbox to access your Tutorbox account — no password needed.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            <strong>中文：</strong>输入邮箱，我们会发送一封包含一次性登录链接的邮件。点击邮件中的链接即可登录，无需密码。
          </p>
        </div>
      </div>
    </div>
  );
}
>>>>>>> origin/main
