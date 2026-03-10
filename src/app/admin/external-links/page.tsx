// Admin page to view and manage external link health
import { prisma } from "@/prisma";
import { externalLinks } from "@/config/external-links";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

async function triggerHealthCheck() {
  "use server";
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  await fetch(`${baseUrl}/api/external-links/check`, {
    method: "POST",
    cache: "no-store",
  });
}

export default async function ExternalLinksAdminPage() {
  const healthData = await prisma.externalLinkHealth.findMany({
    orderBy: { lastCheckedAt: "desc" },
  });

  const healthMap = new Map(healthData.map((h) => [h.linkId, h]));

  return (
    <main className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">External Link Health Monitor</h1>
          <p className="text-muted-foreground">
            Monitor the health status of external trial and product links
          </p>
        </div>
        <form action={triggerHealthCheck}>
          <Button type="submit" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Run Health Check
          </Button>
        </form>
      </div>

      <div className="grid gap-4">
        {externalLinks.map((link) => {
          const health = healthMap.get(link.id);
          const status = health?.status || "unknown";

          const statusConfig = {
            ok: {
              icon: <CheckCircle className="w-5 h-5 text-green-500" />,
              label: "OK",
              className: "bg-green-50 border-green-200",
            },
            unavailable: {
              icon: <XCircle className="w-5 h-5 text-red-500" />,
              label: "Unavailable",
              className: "bg-red-50 border-red-200",
            },
            unknown: {
              icon: <AlertCircle className="w-5 h-5 text-gray-400" />,
              label: "Unknown",
              className: "bg-gray-50 border-gray-200",
            },
          };

          const config = statusConfig[status as keyof typeof statusConfig];

          return (
            <div
              key={link.id}
              className={`border rounded-lg p-6 ${config.className}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {config.icon}
                  <div>
                    <h3 className="font-semibold text-lg">{link.label}</h3>
                    <p className="text-sm text-muted-foreground">{link.labelCn}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white border">
                  {config.label}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">URL:</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {link.url}
                  </a>
                </div>

                {link.productSlug && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Product:</span>
                    <span className="text-muted-foreground">{link.productSlug}</span>
                  </div>
                )}

                {health && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Last Checked:</span>
                      <span className="text-muted-foreground">
                        {new Date(health.lastCheckedAt).toLocaleString()}
                      </span>
                    </div>

                    {health.lastStatusCode && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Status Code:</span>
                        <span className="text-muted-foreground">
                          {health.lastStatusCode}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Consecutive Failures:</span>
                      <span className="text-muted-foreground">
                        {health.consecutiveFailures}
                      </span>
                    </div>

                    {health.lastError && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium">Error:</span>
                        <span className="text-red-600 text-xs">
                          {health.lastError}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {externalLinks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No external links configured. Add links in{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">
            src/config/external-links.ts
          </code>
        </div>
      )}
    </main>
  );
}
