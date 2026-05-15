'use client'

import { useActionState } from 'react'
import { receiveLot } from '../actions'
import Link from 'next/link'

const SPECIES = ['beef', 'pork', 'chicken', 'lamb', 'turkey', 'veal', 'bison', 'other'] as const
const PRIMAL_CUTS = ['chuck', 'rib', 'loin', 'round', 'brisket', 'flank', 'plate', 'shank', 'shoulder', 'belly', 'leg', 'ground', 'trim', 'other'] as const
const LOCATION_TYPES = [
  { value: 'cooler', label: 'Cooler' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'blast_freezer', label: 'Blast Freezer' },
  { value: 'dry_storage', label: 'Dry Storage' },
  { value: 'loading_dock', label: 'Loading Dock' },
  { value: 'processing_floor', label: 'Processing Floor' },
  { value: 'quarantine', label: 'Quarantine' },
] as const

interface Location {
  id: string
  name: string
  locationType: string
}

interface Props {
  existingLocations: Location[]
}

export function ReceiveLotForm({ existingLocations }: Props) {
  const [state, action, isPending] = useActionState(receiveLot, {})

  return (
    <form action={action} className="space-y-6">
      {state.message && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {state.message}
        </div>
      )}

      {/* Lot identification */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Lot Identification</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Lot Number"
            name="lotNumber"
            required
            placeholder="e.g. BEEF-2026-001"
            error={state.errors?.lotNumber?.[0]}
          />
          <Field
            label="Supplier Lot Reference"
            name="supplierLotRef"
            placeholder="Supplier's batch ID (optional)"
            error={state.errors?.supplierLotRef?.[0]}
          />
        </div>
      </section>

      {/* Product details */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Product Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Species <span className="text-red-500">*</span>
            </label>
            <select
              name="species"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select species</option>
              {SPECIES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            {state.errors?.species?.[0] && (
              <p className="mt-1 text-xs text-red-600">{state.errors.species[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Primal Cut <span className="text-red-500">*</span>
            </label>
            <select
              name="primalCut"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select cut</option>
              {PRIMAL_CUTS.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            {state.errors?.primalCut?.[0] && (
              <p className="mt-1 text-xs text-red-600">{state.errors.primalCut[0]}</p>
            )}
          </div>

          <div className="col-span-2">
            <Field
              label="Product Description"
              name="productDescription"
              placeholder="e.g. 80/20 Ground Beef (optional)"
              error={state.errors?.productDescription?.[0]}
            />
          </div>

          <Field
            label="USDA Grade"
            name="grade"
            placeholder="e.g. Prime, Choice, Select (optional)"
            error={state.errors?.grade?.[0]}
          />

          <Field
            label="Country of Origin"
            name="countryOfOrigin"
            required
            placeholder="e.g. US"
            error={state.errors?.countryOfOrigin?.[0]}
          />
        </div>
      </section>

      {/* Supplier */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Supplier</h2>
        <Field
          label="Supplier Name"
          name="supplierName"
          required
          placeholder="e.g. Heartland Beef Co."
          error={state.errors?.supplierName?.[0]}
        />
      </section>

      {/* Dates & weight */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Dates &amp; Weight</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Slaughter Date"
            name="slaughterDate"
            type="date"
            required
            error={state.errors?.slaughterDate?.[0]}
          />
          <Field
            label="Pack Date"
            name="packDate"
            type="date"
            required
            error={state.errors?.packDate?.[0]}
          />
          <Field
            label="Expiry Date"
            name="expiryDate"
            type="date"
            required
            error={state.errors?.expiryDate?.[0]}
          />
          <Field
            label="Initial Weight (kg)"
            name="initialWeightKg"
            type="number"
            required
            placeholder="e.g. 450.5"
            inputProps={{ min: '0.001', step: '0.001' }}
            error={state.errors?.initialWeightKg?.[0]}
          />
        </div>
      </section>

      {/* Storage location */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Storage Location</h2>
        <div className="grid grid-cols-2 gap-4">
          {existingLocations.length > 0 ? (
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                name="locationName"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select location</option>
                {existingLocations.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
                <option value="__new__">+ New location…</option>
              </select>
              {state.errors?.locationName?.[0] && (
                <p className="mt-1 text-xs text-red-600">{state.errors.locationName[0]}</p>
              )}
              {/* Hidden default type for existing locations */}
              <input type="hidden" name="locationType" value="cooler" />
            </div>
          ) : (
            <>
              <Field
                label="Location Name"
                name="locationName"
                required
                placeholder="e.g. Main Cooler"
                error={state.errors?.locationName?.[0]}
              />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Location Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="locationType"
                  defaultValue="cooler"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {LOCATION_TYPES.map((lt) => (
                    <option key={lt.value} value={lt.value}>
                      {lt.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Notes */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Notes</h2>
        <div>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any additional notes about this lot (optional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/inventory"
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          ← Back to Inventory
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : (
            'Receive Lot'
          )}
        </button>
      </div>
    </form>
  )
}

interface FieldProps {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  error?: string
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

function Field({ label, name, type = 'text', required, placeholder, error, inputProps }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        {...inputProps}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
