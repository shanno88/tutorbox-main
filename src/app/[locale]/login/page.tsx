"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";

type ProviderMap = Awaited<ReturnType<typeof getProviders>>;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [providers, setProviders] = useState<ProviderMap>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "zh";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await getProviders();
      if (!cancelled) setProviders(p);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    await signIn("dev-email", {
      email: email.trim(),
      callbackUrl: `/${locale}`,
      redirect: true,
    });
  }

  async function handleGoogleSignIn() {
    if (googleLoading) return;

    setGoogleLoading(true);
    try {
      await signIn("google", {
        callbackUrl: `/${locale}`,
        redirect: true,
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 8, minWidth: 260 }}
        />
        <button type="submit" style={{ marginLeft: 8, padding: "8px 16px" }}>
          Login
        </button>
      </form>

      {providers?.google ? (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            style={{ padding: "8px 16px" }}
          >
            {googleLoading ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>
      ) : null}
    </div>
  );
}


async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/auth/csrf");
  const data = await res.json();
  return data.csrfToken;
}
