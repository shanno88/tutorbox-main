import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { RootProviders } from "@/app/_components/root-providers";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Shanno · Independent AI Product Studio",
  description:
    "AI tools built for Chinese speakers living abroad - Lease AI Review, Grammar Master, Cast Master",
  keywords: [
    "AI",
    "LeaseReview",
    "Grammar",
    "Chinese",
    "Overseas Chinese",
    "International Students",
  ],
  authors: [{ name: "Shanno" }],
  openGraph: {
    title: "Shanno · Independent AI Product Studio",
    description: "AI tools built for Chinese speakers living abroad",
    url: "https://tutorbox.cc",
    siteName: "Shanno Studio",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* PageAgent Script - Alibaba's AI Assistant */}
        <script
          src="https://cdn.jsdelivr.net/npm/@alibaba/page-agent@latest/dist/page-agent.min.js"
          async
          defer
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
