'use client'

import { memo, useState } from 'react'
import { Reservation } from '@/types'
import { formatTime } from '@/lib/utils'
import { Check, X, Users, Clock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

interface PendingQueueProps {
  reservations: Reservation[]
  onUpdate:     (id: string, newStatus: 'confirmed' | 'rejected') => void
  onSelect:     (r: Reservation) => void
  loading?:     boolean
}

function PendingCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-3 space-y-2 animate-pulse">
      <div className="h-3 bg-zinc-200 rounded w-24" />
      <div className="h-2.5 bg-zinc-100 rounded w-32" />
      <div className="flex gap-1.5 pt-1">
        <div className="flex-1 h-6 bg-zinc-100 rounded-md" />
        <div className="flex-1 h-6 bg-zinc-100 rounded-md" />
      </div>
    </div>
  )
}

export const PendingQueue = memo(function PendingQueue({ reservations, onUpdate, onSelect, loading = false }: PendingQueueProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { lang } = useLang()
  const tx = dashboardT[lang].pendingQueue

  async function handleAction(id: string, status: 'confirmed' | 'rejected') {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const body = await res.json()
        toast.error(body.error ?? 'Failed to update reservation')
        return
      }
      onUpdate(id, status)
      toast.success(status === 'confirmed' ? 'Reservation confirmed' : 'Reservation rejected')
    } catch {
      toast.error('Network error')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-semibold text-zinc-700">{tx.title}</p>
        {reservations.length > 0 && (
          <span className="text-xs bg-amber-100 text-amber-700 font-medium px-1.5 py-0.5 rounded-full">
            {reservations.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => <PendingCardSkeleton key={i} />)}
        </div>
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xs font-medium text-zinc-600">{tx.allCaughtUp}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{tx.noPending}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reservations.map((r) => (
            <div key={r.id} className="bg-white rounded-lg border border-zinc-200 shadow-sm p-3 space-y-2">
              <p className="text-xs font-medium text-zinc-900 truncate">{r.guest_name}</p>
              <button
                onClick={() => onSelect(r)}
                className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors duration-150 text-left"
              >
                {tx.viewDetails}
              </button>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><Users size={10} />{r.party_size}</span>
                <span className="flex items-center gap-1"><Clock size={10} />{formatTime(r.reservation_time)}</span>
                {r.category && <span>{r.category}</span>}
              </div>
              {r.special_requests && (
                <p className="text-xs text-zinc-400 italic truncate">{r.special_requests}</p>
              )}
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={() => handleAction(r.id, 'confirmed')}
                  disabled={loadingId === r.id}
                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200 px-2 py-1.5 rounded-md transition-colors duration-150 disabled:opacity-50"
                >
                  <Check size={11} /> {tx.approve}
                </button>
                <button
                  onClick={() => handleAction(r.id, 'rejected')}
                  disabled={loadingId === r.id}
                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200 px-2 py-1.5 rounded-md transition-colors duration-150 disabled:opacity-50"
                >
                  <X size={11} /> {tx.reject}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
