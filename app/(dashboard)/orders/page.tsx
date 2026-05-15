export default function OrdersPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Track customer orders and fulfillment.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-2">Orders not yet available</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Order management will be added in a future sprint after core inventory tracking is complete.
        </p>
        <span className="inline-block mt-4 text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-3 py-1">
          Planned
        </span>
      </div>
    </div>
  );
}
