"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "zh";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    await signIn("dev-email", {
      email: email.trim(),
      callbackUrl: `/${locale}`,
      redirect: true,
    });
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
    </div>
  );
}


async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/auth/csrf");
  const data = await res.json();
  return data.csrfToken;
}
