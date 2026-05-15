'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const LOCATION_TYPES = [
  'cooler',
  'freezer',
  'blast_freezer',
  'dry_storage',
  'loading_dock',
  'processing_floor',
  'quarantine',
] as const

const ReceiveLotSchema = z.object({
  lotNumber: z.string().min(1, 'Lot number is required'),
  species: z.string().min(1, 'Species is required'),
  primalCut: z.string().min(1, 'Cut type is required'),
  productDescription: z.string().optional(),
  supplierName: z.string().min(1, 'Supplier name is required'),
  supplierLotRef: z.string().optional(),
  countryOfOrigin: z.string().min(1, 'Country of origin is required'),
  slaughterDate: z.coerce.date({ error: 'Invalid slaughter date' }),
  packDate: z.coerce.date({ error: 'Invalid pack date' }),
  expiryDate: z.coerce.date({ error: 'Invalid expiry date' }),
  initialWeightKg: z.coerce.number({ error: 'Weight must be a number' }).positive('Weight must be greater than 0'),
  grade: z.string().optional(),
  notes: z.string().optional(),
  locationName: z.string().min(1, 'Storage location is required'),
  locationType: z.enum(LOCATION_TYPES).default('dry_storage'),
})

export type ReceiveLotFormState = {
  errors?: Partial<Record<string, string[]>>
  message?: string
}

export async function receiveLot(
  _prev: ReceiveLotFormState,
  formData: FormData,
): Promise<ReceiveLotFormState> {
  const session = await auth()
  if (!session?.user?.organizationId) {
    return { message: 'You must be a member of an organization to receive lots.' }
  }
  const orgId = session.user.organizationId

  const raw = {
    lotNumber: formData.get('lotNumber'),
    species: formData.get('species'),
    primalCut: formData.get('primalCut'),
    productDescription: formData.get('productDescription') || undefined,
    supplierName: formData.get('supplierName'),
    supplierLotRef: formData.get('supplierLotRef') || undefined,
    countryOfOrigin: formData.get('countryOfOrigin'),
    slaughterDate: formData.get('slaughterDate'),
    packDate: formData.get('packDate'),
    expiryDate: formData.get('expiryDate'),
    initialWeightKg: formData.get('initialWeightKg'),
    grade: formData.get('grade') || undefined,
    notes: formData.get('notes') || undefined,
    locationName: formData.get('locationName'),
    locationType: formData.get('locationType') || 'dry_storage',
  }

  const parsed = ReceiveLotSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const data = parsed.data

  if (data.expiryDate <= data.packDate) {
    return { errors: { expiryDate: ['Expiry date must be after pack date'] } }
  }
  if (data.packDate < data.slaughterDate) {
    return { errors: { packDate: ['Pack date cannot be before slaughter date'] } }
  }

  // Find or create storage location
  let location = await prisma.location.findFirst({
    where: { orgId, name: { equals: data.locationName, mode: 'insensitive' } },
  })
  if (!location) {
    location = await prisma.location.create({
      data: { orgId, name: data.locationName, locationType: data.locationType },
    })
  }

  try {
    await prisma.$transaction(async (tx) => {
      const lot = await tx.lot.create({
        data: {
          orgId,
          lotNumber: data.lotNumber,
          species: data.species,
          primalCut: data.primalCut,
          productDescription: data.productDescription ?? null,
          supplierName: data.supplierName,
          supplierLotRef: data.supplierLotRef ?? null,
          countryOfOrigin: data.countryOfOrigin,
          slaughterDate: data.slaughterDate,
          packDate: data.packDate,
          expiryDate: data.expiryDate,
          initialWeightKg: data.initialWeightKg,
          grade: data.grade ?? null,
          notes: data.notes ?? null,
        },
      })

      await tx.inventory.create({
        data: {
          orgId,
          lotId: lot.id,
          locationId: location.id,
          quantityOnHand: data.initialWeightKg,
          lastMovementAt: new Date(),
        },
      })

      await tx.movement.create({
        data: {
          orgId,
          lotId: lot.id,
          movementType: 'receipt',
          toLocationId: location.id,
          quantity: data.initialWeightKg,
          recordedBy: session.user.id,
        },
      })
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      return { errors: { lotNumber: ['A lot with this number already exists for your organization.'] } }
    }
    return { message: 'Failed to create lot. Please try again.' }
  }

  revalidatePath('/inventory')
  redirect('/inventory')
}
