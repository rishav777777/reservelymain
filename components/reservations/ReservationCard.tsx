import { memo } from 'react'
import { Reservation } from '@/types'
import { StatusBadge } from './StatusBadge'
import { formatTime } from '@/lib/utils'
import { Users } from 'lucide-react'

interface ReservationCardProps {
  reservation: Reservation
  onClick: (reservation: Reservation) => void
}

export const ReservationCard = memo(function ReservationCard({ reservation, onClick }: ReservationCardProps) {
  const tableName = reservation.restaurant_tables?.name ?? '—'

  return (
    <button
      onClick={() => onClick(reservation)}
      className="w-full flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-zinc-200 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all duration-150 text-left group"
    >
      <span className="text-xs font-mono text-zinc-400 w-16 shrink-0 tabular-nums">
        {formatTime(reservation.reservation_time)}
      </span>

      <span className="text-sm font-medium text-zinc-900 flex-1 truncate group-hover:text-zinc-700 transition-colors duration-150">
        {reservation.guest_name}
      </span>

      <span className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
        <Users size={11} />
        {reservation.party_size}
      </span>

      {reservation.category && (
        <span className="text-xs text-zinc-400 shrink-0 hidden sm:block">
          {reservation.category}
        </span>
      )}

      <span className="text-xs text-zinc-300 shrink-0">
        {tableName}
      </span>

      <StatusBadge status={reservation.status} />
    </button>
  )
})
