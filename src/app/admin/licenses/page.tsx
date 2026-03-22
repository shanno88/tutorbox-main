// src/app/admin/licenses/page.tsx
import { validateAdminLicense } from "@/lib/license";

export default async function AdminLicensesPage() {
  let license;
  let error: string | null = null;

  try {
    license = await validateAdminLicense();
  } catch (e: any) {
    error = e?.message ?? "Unknown error";
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Admin License</h1>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          License check failed: {error}
        </div>
      )}

      {license && (
        <div className="rounded border border-gray-200 bg-white p-4 text-sm">
          <div className="mb-2">
            <span className="font-medium">Status:</span> {license.status}
          </div>
          <div className="mb-2">
            <span className="font-medium">Plan:</span> {license.plan ?? "—"}
          </div>
          <div className="mb-2">
            <span className="font-medium">Expires at:</span>{" "}
            {license.expires_at ?? "—"}
          </div>
          <div className="mb-2">
            <span className="font-medium">Code:</span> {license.code ?? "—"}
          </div>
        </div>
      )}

      {!license && !error && (
        <p className="text-sm text-gray-500">No license info available.</p>
      )}
    </main>
  );
}
