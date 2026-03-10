import { SignedIn } from "@/components/auth/signed-in";
import { SignedOut } from "@/components/auth/signed-out";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="container mx-auto">
        <div className="grid max-w-screen-xl px-4 pt-20 pb-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12 lg:pt-28">
          <div className="mr-auto place-self-center col-span-12 lg:col-span-7">
            <h1 className="max-w-2xl mb-4 text-4xl font-extrabold leading-none tracking-tight md:text-5xl xl:text-6xl dark:text-white">
              Shanno <span className="text-primary">·</span> 独立 AI 产品工作室
            </h1>
            <p className="max-w-2xl mb-2 text-xl font-medium text-gray-700 dark:text-gray-300">
              为海外华人打造的 AI 工具集
            </p>
            <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
              One-person studio building practical AI tools for Chinese speakers living abroad.
              Each product is designed to solve real problems and bridge information gaps.
            </p>
            <div className="space-y-4 sm:flex sm:space-y-0 sm:space-x-4">
              <SignedIn>
                <Button asChild size="lg">
                  <Link href="/">进入工作台</Link>
                </Button>
              </SignedIn>
              <SignedOut>
                <Button asChild size="lg">
                  <Link href="#products">探索产品</Link>
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link href="#about">了解更多</Link>
                </Button>
              </SignedOut>
            </div>
          </div>

          <div className="hidden lg:mt-0 lg:col-span-5 lg:flex items-center justify-center">
            <div className="relative w-64 h-64 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
              <div className="text-8xl">🚀</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
