import { HeroSection } from "./(landing)/_sections/hero";
import { ProductsSection } from "./(landing)/_sections/products";
import { AboutSection } from "./(landing)/_sections/about";

export default async function Home() {
  return (
    <div>
      <HeroSection />
      <ProductsSection />
      <AboutSection />
    </div>
  );
}
