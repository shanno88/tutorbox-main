import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export function FeaturedProductsSection() {
  const t = useTranslations("products");
  const locale = useLocale();

  return (
    <section id="products" className="bg-gray-50 dark:bg-gray-800/50 py-6">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 dark:text-white">
            {t("sectionHeadline")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {t("sectionDescription")}
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
              <CardTitle className="mt-4">{t("enCards.name")}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("enCards.tagline")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t("enCards.description")}
              </p>
              <div className="text-lg font-semibold text-primary">
                {t("enCards.status")}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full group">
                <Link href="https://cards.tutorbox.cc">
                  {t("enCards.cta")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Trial Judgment Platform */}
          <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  <div className="text-2xl">🧠</div>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {t("trialJudgment.status")}
                </span>
              </div>
              <CardTitle className="mt-4">{t("trialJudgment.name")}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("trialJudgment.tagline")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t("trialJudgment.description")}
              </p>
              <div className="text-lg font-semibold text-primary">
                {t("trialJudgment.status")}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full group">
                <Link href={`/${locale}/trial-decision`}>
                  {t("trialJudgment.cta")}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Paddle Payment Tool */}
          <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  <div className="text-2xl">💳</div>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  Dev Toolkit
                </span>
              </div>
              <CardTitle className="mt-4">{t("paddlePayment.name")}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {t("paddlePayment.tagline")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t("paddlePayment.description")}
              </p>
              <div className="text-lg font-semibold text-primary">
                {t("paddlePayment.status")}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full group">
                <Link href={`/${locale}/paddle-toolkit`}>
                  {t("paddlePayment.cta")}
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