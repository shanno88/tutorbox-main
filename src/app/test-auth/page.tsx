"use client";

import { useSession } from "next-auth/react";

export default function TestAuthPage() {
  const sessionResult = useSession();
  const data = sessionResult?.data;
  const status = sessionResult?.status;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-lg border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Test Auth (Email Magic Link)
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This page is for debugging authentication. If you can see a session below after logging in,
          your email magic-link flow is working.
        </p>

        <div className="mt-4 space-y-2 rounded-md bg-muted p-3 text-sm">
          <div>
            <span className="font-medium">Status:</span>{" "}
            <span>{status ?? "unknown"}</span>
          </div>
          <div className="mt-2">
            <span className="font-medium">Session data:</span>
            <pre className="mt-1 max-h-64 overflow-auto rounded bg-background p-2 text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          If status is &quot;unauthenticated&quot;, go to the /[locale]/login page and sign in with
          your email magic link, then come back here and refresh.
        </p>
      </div>
    </div>
  );
}
