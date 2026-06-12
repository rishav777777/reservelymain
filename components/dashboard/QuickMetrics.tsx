'use client'

import { memo } from 'react'
import { Reservation } from '@/types'
import { CalendarDays, Clock, UserCheck, LayoutGrid } from 'lucide-react'

interface QuickMetricsProps {
  reservations: Reservation[]
  totalTables: number
}

export const QuickMetrics = memo(function QuickMetrics({ reservations, totalTables }: QuickMetricsProps) {
  const total   = reservations.length
  const pending = reservations.filter((r) => r.status === 'pending').length
  const walkIns = reservations.filter((r) => r.is_walk_in).length

  const arrivedIds = new Set(
    reservations
      .filter((r) => r.status === 'arrived' && r.table_id)
      .map((r) => r.table_id!)
  )
  const confirmedIds = new Set(
    reservations
      .filter((r) => r.status === 'confirmed' && r.table_id && !arrivedIds.has(r.table_id!))
      .map((r) => r.table_id!)
  )
  const occupied  = arrivedIds.size
  const reserved  = confirmedIds.size
  const available = Math.max(0, totalTables - occupied - reserved)

  const cards = [
    {
      label: "Today's Reservations",
      value: total,
      icon: CalendarDays,
      valueClass: 'text-zinc-900',
      iconClass: 'text-zinc-400',
    },
    {
      label: 'Pending Approval',
      value: pending,
      icon: Clock,
      valueClass: 'text-amber-600',
      iconClass: 'text-amber-400',
    },
    {
      label: 'Walk-ins Today',
      value: walkIns,
      icon: UserCheck,
      valueClass: 'text-zinc-900',
      iconClass: 'text-zinc-400',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, valueClass, iconClass }) => (
        <div
          key={label}
          className="bg-white rounded-lg border border-zinc-200 shadow-sm px-4 py-4 flex items-start justify-between"
        >
          <div>
            <p className="text-xs text-zinc-500 mb-2">{label}</p>
            <p className={`text-2xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
          </div>
          <div className={`mt-0.5 ${iconClass}`}>
            <Icon size={16} />
          </div>
        </div>
      ))}

      {/* Table Status card */}
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm px-4 py-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs text-zinc-500">Table Status</p>
          <LayoutGrid size={16} className="text-zinc-400 mt-0.5" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              Occupied
            </span>
            <span className="text-xs font-semibold text-zinc-900">{occupied}/{totalTables}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              Reserved
            </span>
            <span className="text-xs font-semibold text-zinc-900">{reserved}/{totalTables}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              Available
            </span>
            <span className="text-xs font-semibold text-zinc-900">{available}/{totalTables}</span>
          </div>
        </div>
      </div>
    </div>
  )
})
