import { checkAdminAuth } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 检查鉴权
  if (!checkAdminAuth()) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="font-bold text-lg">
                Admin
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/admin/users"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Users
                </Link>
                <Link
                  href="/admin/billing"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Billing
                </Link>
                <Link
                  href="/admin/api-keys"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  API Keys
                </Link>
                <Link
                  href="/admin/plans"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Plans
                </Link>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              🔒 Admin Mode
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
