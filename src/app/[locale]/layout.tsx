import { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/app/_components/providers";
import { Header } from "@/app/_components/header/header";
import { Footer } from "@/app/_components/footer";
import { SendEventOnLoad } from "@/components/send-event-on-load";
import { RightsReserved } from "@/app/(landing)/_sections/reserved";
import { getMessages, setRequestLocale } from "next-intl/server";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <div lang={locale}>
      <SendEventOnLoad eventKey="user viewed app" />
      <Providers messages={messages} locale={locale}>
        <Toaster />
        <NextTopLoader />
        <div className="flex flex-col w-full">
          <Header />
          <div>{children}</div>
          <Footer />
          <RightsReserved />
        </div>
      </Providers>
    </div>
  );
}
