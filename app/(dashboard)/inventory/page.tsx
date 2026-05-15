import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

function daysUntilExpiry(expiryDate: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function InventoryPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId

  const lots = orgId
    ? await prisma.lot.findMany({
        where: { orgId },
        include: { inventory: true },
        orderBy: { expiryDate: 'asc' },
      })
    : []

  const lotsWithQty = lots.map((lot) => {
    const totalQty = lot.inventory.reduce(
      (sum, inv) => sum + inv.quantityOnHand.toNumber(),
      0,
    )
    const days = daysUntilExpiry(lot.expiryDate)
    return { ...lot, totalQty, daysUntilExpiry: days }
  })

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and trace your meat inventory lots.
          </p>
        </div>
        <Link
          href="/inventory/receive"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Receive Lot
        </Link>
      </div>

      {/* Expiry alert banner */}
      {lotsWithQty.some((l) => l.daysUntilExpiry >= 0 && l.daysUntilExpiry <= 3) && (
        <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Lots expiring soon</p>
            <p className="text-sm text-amber-700">
              {lotsWithQty.filter((l) => l.daysUntilExpiry >= 0 && l.daysUntilExpiry <= 3).length}{' '}
              lot(s) expire within 3 days. Review and action highlighted rows below.
            </p>
          </div>
        </div>
      )}

      {lotsWithQty.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lot #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Species / Cut</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Supplier</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Expiry</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Qty (kg)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lotsWithQty.map((lot) => {
                const expiringSoon =
                  lot.daysUntilExpiry >= 0 && lot.daysUntilExpiry <= 3
                const expired = lot.daysUntilExpiry < 0
                return (
                  <tr
                    key={lot.id}
                    className={
                      expiringSoon
                        ? 'bg-amber-50 hover:bg-amber-100'
                        : 'hover:bg-gray-50'
                    }
                  >
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">
                      {lot.lotNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="capitalize">{lot.species}</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="capitalize">{lot.primalCut}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{lot.supplierName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            expired
                              ? 'text-red-600 line-through'
                              : expiringSoon
                              ? 'text-amber-700 font-medium'
                              : 'text-gray-700'
                          }
                        >
                          {formatDate(lot.expiryDate)}
                        </span>
                        {expiringSoon && (
                          <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5 font-medium whitespace-nowrap">
                            {lot.daysUntilExpiry === 0
                              ? 'Expires today'
                              : `${lot.daysUntilExpiry}d left`}
                          </span>
                        )}
                        {expired && (
                          <span className="text-xs bg-red-100 text-red-700 border border-red-200 rounded-full px-2 py-0.5 font-medium">
                            Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-900">
                      {lot.totalQty.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lot.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/inventory/${lot.id}`}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-50 text-green-700 border-green-200',
    quarantine: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    depleted: 'bg-gray-100 text-gray-500 border-gray-200',
    recalled: 'bg-red-50 text-red-700 border-red-200',
    disposed: 'bg-gray-100 text-gray-400 border-gray-200',
  }
  return (
    <span
      className={`text-xs border rounded-full px-2 py-0.5 font-medium capitalize ${
        styles[status] ?? styles['active']
      }`}
    >
      {status}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-gray-900 mb-2">
        No lots in inventory
      </h2>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
        Receive your first lot to start tracking meat inventory and traceability.
      </p>
      <Link
        href="/inventory/receive"
        className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
      >
        Receive First Lot
      </Link>
    </div>
  )
}
