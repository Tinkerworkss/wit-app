import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function daysUntilExpiry(expiryDate: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

const MOVEMENT_LABELS: Record<string, string> = {
  receipt: 'Receipt',
  sale: 'Sale',
  transfer: 'Transfer',
  waste: 'Waste',
  adjustment: 'Adjustment',
  return: 'Return',
}

const MOVEMENT_COLORS: Record<string, string> = {
  receipt: 'bg-green-50 text-green-700 border-green-200',
  sale: 'bg-blue-50 text-blue-700 border-blue-200',
  transfer: 'bg-purple-50 text-purple-700 border-purple-200',
  waste: 'bg-red-50 text-red-700 border-red-200',
  adjustment: 'bg-gray-100 text-gray-600 border-gray-200',
  return: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.organizationId) redirect('/login')

  const lot = await prisma.lot.findFirst({
    where: { id, orgId: session.user.organizationId },
    include: {
      inventory: {
        include: { location: true },
      },
      movements: {
        include: {
          fromLocation: true,
          toLocation: true,
        },
        orderBy: { movedAt: 'desc' },
      },
    },
  })

  if (!lot) notFound()

  const totalQty = lot.inventory.reduce(
    (sum, inv) => sum + inv.quantityOnHand.toNumber(),
    0,
  )
  const days = daysUntilExpiry(lot.expiryDate)
  const expiringSoon = days >= 0 && days <= 3
  const expired = days < 0

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/inventory"
          className="text-sm text-gray-500 hover:text-gray-700 mb-3 inline-flex items-center gap-1"
        >
          ← Back to Inventory
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-mono">
              {lot.lotNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-1 capitalize">
              {lot.species} — {lot.primalCut}
              {lot.productDescription && ` · ${lot.productDescription}`}
            </p>
          </div>
          <StatusBadge status={lot.status} large />
        </div>
      </div>

      {/* Expiry alert */}
      {(expiringSoon || expired) && (
        <div
          className={`mb-4 flex items-start gap-3 rounded-xl px-4 py-3 border ${
            expired
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <svg
            className={`w-5 h-5 shrink-0 mt-0.5 ${expired ? 'text-red-500' : 'text-amber-600'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p
            className={`text-sm font-medium ${
              expired ? 'text-red-700' : 'text-amber-800'
            }`}
          >
            {expired
              ? `This lot expired ${Math.abs(days)} day(s) ago.`
              : days === 0
              ? 'This lot expires today.'
              : `This lot expires in ${days} day(s).`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Lot details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Lot Details</h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="Supplier" value={lot.supplierName} />
            {lot.supplierLotRef && (
              <Row label="Supplier Ref" value={lot.supplierLotRef} />
            )}
            <Row label="Country of Origin" value={lot.countryOfOrigin} />
            {lot.grade && <Row label="Grade" value={lot.grade} />}
            <Row label="Slaughter Date" value={formatDate(lot.slaughterDate)} />
            <Row label="Pack Date" value={formatDate(lot.packDate)} />
            <Row
              label="Expiry Date"
              value={formatDate(lot.expiryDate)}
              highlight={expiringSoon ? 'warn' : expired ? 'error' : undefined}
            />
            <Row
              label="Initial Weight"
              value={`${lot.initialWeightKg.toNumber().toFixed(1)} kg`}
            />
            <Row label="Received" value={formatDateTime(lot.createdAt)} />
          </dl>
        </div>

        {/* Current stock */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Current Stock</h2>
          <div className="mb-4">
            <p className="text-3xl font-bold text-gray-900">
              {totalQty.toFixed(1)}
              <span className="text-base font-normal text-gray-500 ml-1">kg</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {((totalQty / lot.initialWeightKg.toNumber()) * 100).toFixed(0)}% of initial weight remaining
            </p>
          </div>

          {lot.inventory.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                By Location
              </p>
              <div className="space-y-2">
                {lot.inventory.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700">{inv.location.name}</span>
                    <span className="font-mono font-medium text-gray-900">
                      {inv.quantityOnHand.toNumber().toFixed(1)} kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lot.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-gray-700">{lot.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Movement history */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Movement History</h2>
        </div>
        {lot.movements.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">
            No movements recorded.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Type
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  From
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  To
                </th>
                <th className="text-right px-5 py-3 font-medium text-gray-600">
                  Qty (kg)
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lot.movements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs border rounded-full px-2 py-0.5 font-medium ${
                        MOVEMENT_COLORS[m.movementType] ?? ''
                      }`}
                    >
                      {MOVEMENT_LABELS[m.movementType] ?? m.movementType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {m.fromLocation?.name ?? (
                      <span className="text-gray-400 italic">Supplier</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {m.toLocation?.name ?? (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-gray-900">
                    {m.quantity.toNumber().toFixed(1)}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {formatDateTime(m.movedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: 'warn' | 'error'
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd
        className={`font-medium text-right ${
          highlight === 'error'
            ? 'text-red-600'
            : highlight === 'warn'
            ? 'text-amber-700'
            : 'text-gray-900'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function StatusBadge({ status, large }: { status: string; large?: boolean }) {
  const styles: Record<string, string> = {
    active: 'bg-green-50 text-green-700 border-green-200',
    quarantine: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    depleted: 'bg-gray-100 text-gray-500 border-gray-200',
    recalled: 'bg-red-50 text-red-700 border-red-200',
    disposed: 'bg-gray-100 text-gray-400 border-gray-200',
  }
  return (
    <span
      className={`border rounded-full font-medium capitalize ${
        large ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'
      } ${styles[status] ?? styles['active']}`}
    >
      {status}
    </span>
  )
}
