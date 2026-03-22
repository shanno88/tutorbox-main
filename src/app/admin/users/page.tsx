import { db } from "@/db";
import { users, productGrants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function getUsersWithStatus() {
  const allUsers = await db.select().from(users);

  // 获取每个用户的 trial/subscription 状态
  const usersWithStatus = await Promise.all(
    allUsers.map(async (user) => {
      const grants = await db
        .select()
        .from(productGrants)
        .where(eq(productGrants.userId, user.id));

      const trialStatus = grants.find((g) => g.type === "trial");
      const paidStatus = grants.find((g) => g.type === "paid");

      return {
        ...user,
        trialStatus,
        paidStatus,
      };
    })
  );

  return usersWithStatus;
}

export default async function UsersAdminPage() {
  const users = await getUsersWithStatus();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Users</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Trial Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Paid Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Created At
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-600">
                  {user.id.substring(0, 8)}...
                </td>
                <td className="px-4 py-3 text-sm">{user.email}</td>
                <td className="px-4 py-3 text-sm">
                  {user.trialStatus ? (
                    <div className="flex flex-col gap-1">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {user.trialStatus.productKey}
                      </span>
                      <span className="text-xs text-gray-600">
                        {user.trialStatus.status === "active"
                          ? "Active"
                          : "Expired"}
                      </span>
                      {user.trialStatus.trialEndsAt && (
                        <span className="text-xs text-gray-500">
                          Ends:{" "}
                          {new Date(
                            user.trialStatus.trialEndsAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">None</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {user.paidStatus ? (
                    <div className="flex flex-col gap-1">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {user.paidStatus.productKey}
                      </span>
                      <span className="text-xs text-gray-600">
                        {user.paidStatus.status === "active"
                          ? "Active"
                          : "Expired"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">None</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {user.emailVerified
                    ? new Date(user.emailVerified).toLocaleDateString()
                    : "Not verified"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          No users found
        </Card>
      )}

      <div className="mt-4 text-sm text-gray-600">
        Total users: <span className="font-semibold">{users.length}</span>
      </div>
    </div>
  );
}
