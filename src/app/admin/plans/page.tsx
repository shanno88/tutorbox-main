import { db } from "@/db";
import { plans } from "@/db/schema";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function getPlans() {
  const allPlans = await db.select().from(plans).orderBy(plans.id);
  return allPlans;
}

export default async function PlansAdminPage() {
  const allPlans = await getPlans();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Plans</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Slug</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Rate Limit (per min)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Quota (per month)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Created At
              </th>
            </tr>
          </thead>
          <tbody>
            {allPlans.map((plan) => (
              <tr key={plan.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-600">
                  {plan.id}
                </td>
                <td className="px-4 py-3 text-sm font-mono">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {plan.slug}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium">{plan.name}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {plan.rateLimitPerMin}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    {plan.quotaPerMonth.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(plan.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {allPlans.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          No plans found
        </Card>
      )}

      <div className="mt-4 text-sm text-gray-600">
        Total plans: <span className="font-semibold">{allPlans.length}</span>
      </div>
    </div>
  );
}
