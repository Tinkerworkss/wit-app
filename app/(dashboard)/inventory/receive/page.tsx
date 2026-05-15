import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ReceiveLotForm } from './ReceiveLotForm'

export default async function ReceiveLotPage() {
  const session = await auth()
  if (!session?.user?.organizationId) redirect('/login')

  const locations = await prisma.location.findMany({
    where: { orgId: session.user.organizationId, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, locationType: true },
  })

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Receive Lot</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record a new lot arriving into inventory.
        </p>
      </div>
      <ReceiveLotForm existingLocations={locations} />
    </div>
  )
}
