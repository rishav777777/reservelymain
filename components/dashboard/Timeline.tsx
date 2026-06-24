'use client'

import { memo, useMemo } from 'react'
import { Reservation } from '@/types'
import { ReservationCard } from '@/components/reservations/ReservationCard'
import { CalendarDays } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

interface TimelineProps {
  reservations:        Reservation[]
  onSelectReservation: (r: Reservation) => void
  loading?:            boolean
}

function groupByHour(reservations: Reservation[]) {
  const groups: Record<string, Reservation[]> = {}
  for (const r of reservations) {
    const hour = r.reservation_time.slice(0, 2) + ':00'
    if (!groups[hour]) groups[hour] = []
    groups[hour].push(r)
  }
  return groups
}

function ReservationRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-zinc-200 animate-pulse">
      <div className="w-12 h-3 bg-zinc-200 rounded" />
      <div className="flex-1 space-y-1.5"><div className="h-3 bg-zinc-200 rounded w-36" /></div>
      <div className="w-8 h-3 bg-zinc-100 rounded" />
      <div className="w-16 h-5 bg-zinc-200 rounded-full" />
    </div>
  )
}

export const Timeline = memo(function Timeline({ reservations, onSelectReservation, loading = false }: TimelineProps) {
  const { lang } = useLang()
  const tx = dashboardT[lang].timelineComp
  const groups = useMemo(() => groupByHour(reservations), [reservations])

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <ReservationRowSkeleton key={i} />)}
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-lg border border-zinc-200">
        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
          <CalendarDays className="w-5 h-5 text-zinc-400" />
        </div>
        <p className="text-sm font-medium text-zinc-700">{tx.noReservationsToday}</p>
        <p className="text-xs text-zinc-400 mt-1">{tx.appearing}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, items]) => (
          <div key={hour}>
            <p className="text-xs font-medium text-zinc-400 mb-2 px-1 uppercase tracking-wider">{hour}</p>
            <div className="space-y-1.5">
              {items.map((r) => (
                <ReservationCard key={r.id} reservation={r} onClick={onSelectReservation} />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
})
