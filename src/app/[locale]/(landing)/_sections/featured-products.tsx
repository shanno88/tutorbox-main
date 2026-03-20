import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FeaturedProductsSection() {
  return (
    <section className="bg-gray-50 dark:bg-gray-800/50 py-6">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 dark:text-white">
            Product Portfolio
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Every product stems from real pain points, using AI to reduce information gaps and living costs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* EN Cards */}
          <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  <div className="text-2xl">🃏</div>
                </div>
              </div>
              <CardTitle className="mt-4">EN Cards · 英语记忆卡片</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                英语语法大招谁懂啊！
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                这些最难记的语法点，都被做成了好玩又好记的语法卡围绕中国各大城市生活场景做例句，先白嫖体验 20 张，喜欢再一次性解锁完整 100 张。
              </p>
              <div className="text-lg font-semibold text-primary">
                一次性解锁 · 19.9元
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full group">
                <Link href="https://cards.tutorbox.cc">
                  进入产品
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* US Career Navigator */}
          <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  <div className="text-2xl">🇺🇸</div>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  内测中
                </span>
              </div>
              <CardTitle className="mt-4">US Career Navigator</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                在美职业路径助手
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                面向在美或计划来美的用户，帮助快速梳理职位路径、签证选项与大致薪资区间。
              </p>
              <div className="text-lg font-semibold text-primary">
                早鸟体验 · 即将开放
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full group">
                <Link href="#">
                  加入候补名单
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Paddle API Starter */}
          <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  <div className="text-2xl">⚡</div>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  Builder 工具
                </span>
              </div>
              <CardTitle className="mt-4">Paddle API Starter</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                独立开发者支付脚手架
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                面向独立开发者的 Paddle 支付起盘脚手架，VPS + Webhook + 解锁逻辑一站打通。
              </p>
              <div className="text-lg font-semibold text-primary">
                Dev Toolkit · Coming soon
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full group">
                <Link href="#">
                  查看详情
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}