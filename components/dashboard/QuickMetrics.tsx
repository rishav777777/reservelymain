'use client'

import { memo } from 'react'
import { Reservation } from '@/types'
import { CalendarDays, Clock, UserCheck, TrendingUp } from 'lucide-react'

interface QuickMetricsProps {
  reservations: Reservation[]
}

export const QuickMetrics = memo(function QuickMetrics({ reservations }: QuickMetricsProps) {
  const total     = reservations.length
  const pending   = reservations.filter((r) => r.status === 'pending').length
  const walkIns   = reservations.filter((r) => r.is_walk_in).length
  const arrived   = reservations.filter((r) => r.status === 'arrived').length
  const occupancy = total > 0 ? Math.round((arrived / total) * 100) : 0

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
    {
      label: 'Occupancy',
      value: `${occupancy}%`,
      icon: TrendingUp,
      valueClass: 'text-emerald-600',
      iconClass: 'text-emerald-400',
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
    </div>
  )
})
