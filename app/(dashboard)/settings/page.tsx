import { auth } from "@/auth";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization and account settings.</p>
      </div>

      {/* Organization card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Organization</h2>
        <dl className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <dt className="text-sm text-gray-500">Name</dt>
            <dd className="text-sm font-medium text-gray-900">{session?.user.organizationName ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <dt className="text-sm text-gray-500">Slug</dt>
            <dd className="text-sm font-medium text-gray-400">{session?.user.organizationSlug ?? "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Account card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Your account</h2>
        <dl className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <dt className="text-sm text-gray-500">Name</dt>
            <dd className="text-sm font-medium text-gray-900">{session?.user.name ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <dt className="text-sm text-gray-500">Email</dt>
            <dd className="text-sm font-medium text-gray-900">{session?.user.email ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <dt className="text-sm text-gray-500">Role</dt>
            <dd className="text-sm font-medium text-gray-900 capitalize">
              {session?.user.role?.toLowerCase() ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Note:</span> Full settings management (team members, billing, integrations) will be available in a future release.
        </p>
      </div>
    </div>
  );
}
