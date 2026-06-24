'use client'

import { ReservationStatus } from '@/types'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

const STATUS_CLASSES: Record<ReservationStatus, string> = {
  pending:   'bg-amber-50   text-amber-700  ring-1 ring-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  arrived:   'bg-blue-50    text-blue-700   ring-1 ring-blue-200',
  completed: 'bg-slate-100  text-slate-500  ring-1 ring-slate-200',
  rejected:  'bg-red-50     text-red-700    ring-1 ring-red-200',
  cancelled: 'bg-red-50     text-red-700    ring-1 ring-red-200',
  no_show:   'bg-slate-100  text-slate-400  ring-1 ring-slate-200',
}

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const { lang } = useLang()
  const tx = dashboardT[lang].statusBadge
  const label = tx[status as keyof typeof tx] as string
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASSES[status]}`}>
      {label}
    </span>
  )
}
