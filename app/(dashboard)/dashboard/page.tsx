import { auth } from "@/auth";

const stats = [
  { label: "Active Lots", value: "—", description: "Inventory lots in progress" },
  { label: "Today's Receipts", value: "—", description: "Lots received today" },
  { label: "Pending Orders", value: "—", description: "Orders awaiting fulfillment" },
  { label: "Compliance Alerts", value: "—", description: "Items needing attention" },
];

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome{session?.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s an overview of your inventory operations.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Lots</h2>
          <div className="text-sm text-gray-400 text-center py-8 border-2 border-dashed border-gray-100 rounded-lg">
            Lot data will appear here once inventory is set up.
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Activity Feed</h2>
          <div className="text-sm text-gray-400 text-center py-8 border-2 border-dashed border-gray-100 rounded-lg">
            Activity will appear here once tracking begins.
          </div>
        </div>
      </div>
    </div>
  );
}
