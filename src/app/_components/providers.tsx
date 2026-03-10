"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ThemeProvider } from "./theme-provider";
import { NextIntlClientProvider } from "next-intl";

export function Providers({ 
  children,
  messages,
  locale
}: { 
  children: ReactNode;
  messages: Record<string, unknown>;
  locale: string;
}) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Shanghai">
          {children}
        </NextIntlClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
