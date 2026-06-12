import { ReservationStatus } from '@/types'

const STATUS_CONFIG: Record<ReservationStatus, { label: string; classes: string }> = {
  pending:   { label: 'Pending',   classes: 'bg-amber-50   text-amber-700  ring-1 ring-amber-200'   },
  confirmed: { label: 'Confirmed', classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  arrived:   { label: 'Arrived',   classes: 'bg-blue-50    text-blue-700   ring-1 ring-blue-200'    },
  completed: { label: 'Completed', classes: 'bg-slate-100  text-slate-500  ring-1 ring-slate-200'   },
  rejected:  { label: 'Rejected',  classes: 'bg-red-50     text-red-700    ring-1 ring-red-200'     },
  cancelled: { label: 'Cancelled', classes: 'bg-red-50     text-red-700    ring-1 ring-red-200'     },
  no_show:   { label: 'No Show',   classes: 'bg-slate-100  text-slate-400  ring-1 ring-slate-200'   },
}

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const { label, classes } = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${classes}`}>
      {label}
    </span>
  )
}
