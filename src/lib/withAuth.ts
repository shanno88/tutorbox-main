// src/lib/withAuth.ts
type AuthResult = {
  ok: boolean;
  userId?: string;
  planSlug?: string;
  limits?: {
    rateLimitPerMin: number;
    quotaPerMonth: number;
    remainingQuota?: number;
  };
  error?: string;
  retryAfterSeconds?: number;
};

export async function withAuth(
  req: Request,
  handler: (ctx: {
    req: Request;
    userId: string;
    planSlug: string;
    limits: AuthResult["limits"];
  }) => Promise<Response>,
): Promise<Response> {
  // 1. 从 header 里取 api key（先约定用 x-api-key）
  const apiKey = req.headers.get("x-api-key") || req.headers.get("X-API-Key");

  if (!apiKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing_api_key" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  // 2. 调用内部的 /api/auth/validate
  const url = new URL("/api/auth/validate", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ apiKey }),
  });

  const data = (await res.json()) as AuthResult;

  if (!res.ok || !data.ok) {
    // 映射错误码
    if (data.error === "invalid_api_key") {
      return new Response(
        JSON.stringify({ ok: false, error: "invalid_api_key" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    if (data.error === "key_inactive" || data.error === "key_expired" || data.error === "quota_exceeded") {
      return new Response(
        JSON.stringify({ ok: false, error: data.error ?? "forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    if (data.error === "rate_limited") {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "rate_limited",
          retryAfterSeconds: data.retryAfterSeconds,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: false, error: data.error ?? "auth_failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // 3. 通过之后，把 userId / plan 注入给 handler
  if (!data.userId || !data.planSlug) {
    return new Response(
      JSON.stringify({ ok: false, error: "invalid_auth_response" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return handler({
    req,
    userId: data.userId,
    planSlug: data.planSlug,
    limits: data.limits,
  });
}
