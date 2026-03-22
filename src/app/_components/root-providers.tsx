"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { PageAgentProvider } from "@/components/page-agent-provider";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PageAgentProvider />
      {children}
    </SessionProvider>
  );
}
