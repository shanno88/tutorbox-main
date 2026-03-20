import { db } from "@/db";
import { apiKeys, plans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { ToggleApiKeyStatus } from "@/app/admin/api-keys/toggle-status";

export const dynamic = "force-dynamic";

async function getApiKeysWithPlan() {
  const keys = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      planId: apiKeys.planId,
      keyHash: apiKeys.keyHash,
      status: apiKeys.status,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
      planSlug: plans.slug,
      planName: plans.name,
    })
    .from(apiKeys)
    .innerJoin(plans, eq(apiKeys.planId, plans.id))
    .orderBy(apiKeys.createdAt);

  return keys;
}

function maskKey(hash: string): string {
  // 显示前 4 个字符和后 4 个字符
  if (hash.length <= 8) return "****";
  return `${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}`;
}

export default async function ApiKeysAdminPage() {
  const keys = await getApiKeysWithPlan();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">API Keys</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Key (Masked)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                User ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Expires At
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Created At
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => {
              const isActive = key.status === "active";
              const isExpired =
                key.expiresAt && new Date(key.expiresAt) < new Date();

              return (
                <tr key={key.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {maskKey(key.keyHash)}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {key.userId.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{key.planSlug}</span>
                      <span className="text-xs text-gray-500">
                        {key.planName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          isActive && !isExpired
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span>
                        {isExpired
                          ? "Expired"
                          : isActive
                            ? "Active"
                            : "Revoked"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {key.expiresAt
                      ? new Date(key.expiresAt).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <ToggleApiKeyStatus
                      keyId={key.id}
                      currentStatus={key.status}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {keys.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          No API keys found
        </Card>
      )}

      <div className="mt-4 text-sm text-gray-600">
        Total API keys: <span className="font-semibold">{keys.length}</span>
      </div>
    </div>
  );
}
