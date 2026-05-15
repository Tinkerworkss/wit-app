export default function InventoryPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and trace your meat inventory lots.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-2">Lot tracking coming soon</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Full inventory lot creation, receipt tracking, and traceability is being built in the next sprint.
        </p>
        <span className="inline-block mt-4 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
          In progress — WIT-6
        </span>
      </div>
    </div>
  );
}
