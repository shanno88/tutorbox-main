<<<<<<< HEAD
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
=======
"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
>>>>>>> origin/main
