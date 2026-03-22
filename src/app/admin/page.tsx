import Link from "next/link";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/users">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">Users</h2>
            <p className="text-gray-600 text-sm">
              Manage users, view trial and subscription status
            </p>
          </Card>
        </Link>

        <Link href="/admin/api-keys">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">API Keys</h2>
            <p className="text-gray-600 text-sm">
              Manage API keys, toggle active status
            </p>
          </Card>
        </Link>

        <Link href="/admin/plans">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">Plans</h2>
            <p className="text-gray-600 text-sm">
              View plans and their rate limits
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
