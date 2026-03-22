import Link from "next/link";
import { getLiveApps, getAppRoute } from "@/config/apps";

export function Footer() {
  const liveApps = getLiveApps();

  return (
    <footer className="border-t bg-gray-100 dark:bg-background">
      <div className="max-w-screen-xl p-4 py-6 mx-auto lg:py-16 md:p-8 lg:p-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-3">
          <div>
            <h3 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
              产品
            </h3>
            <ul className="text-gray-500 dark:text-gray-400">
              {liveApps.map((app) => (
                <li key={app.slug} className="mb-4">
                  <Link
                    href={getAppRoute(app.slug, "en")}
                    className="hover:underline"
                  >
                    {app.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
              联系方式
            </h3>
            <ul className="text-gray-500 dark:text-gray-400">
              <li className="mb-4">
                <a
                  href="mailto:shanno@tutorbox.cc"
                  className="hover:underline"
                >
                  shanno@tutorbox.cc
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
              Legal
            </h3>
            <ul className="text-gray-500 dark:text-gray-400">
              <li className="mb-4">
                <Link href="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/terms" className="hover:underline">
                  Terms of Service
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/refund" className="hover:underline">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
