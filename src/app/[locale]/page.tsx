import { HeroSection } from "./(landing)/_sections/hero";
import { ProductsSection } from "./(landing)/_sections/products";
import { PricingSection } from "./(landing)/_sections/pricing";
import { AboutSection } from "./(landing)/_sections/about";
import { setRequestLocale } from "next-intl/server";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <HeroSection />
      <ProductsSection />
      <PricingSection />
      <AboutSection />
    </div>
  );
}
