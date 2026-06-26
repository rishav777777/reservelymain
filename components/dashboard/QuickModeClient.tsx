'use client'

import { useEffect, useState } from 'react'
import { Reservation, ReservationStatus } from '@/types'
import { useReservations } from '@/hooks/useReservations'
import { WalkInModal } from '@/components/walkin/WalkInModal'
import { StatusBadge } from '@/components/reservations/StatusBadge'
import { formatTime } from '@/lib/utils'
import { toast } from 'sonner'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'
import {
  Users, Clock, Check, X, UserCheck, AlertCircle,
  Plus, RefreshCw, Utensils, ArrowLeft,
} from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

interface Props {
  restaurantId: string
  staffName: string
}

export function QuickModeClient({ restaurantId, staffName }: Props) {
  const { reservations, loading, refresh } = useReservations(restaurantId, today)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [list, setList] = useState<Reservation[]>([])
  const { lang } = useLang()
  const tx = dashboardT[lang].quickMode

  const locale = lang === 'EN' ? 'en-GB' : 'de-AT'
  const dateLabel = new Date().toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  useEffect(() => { setList(reservations) }, [reservations])

  useEffect(() => {
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  async function handleAction(id: string, status: ReservationStatus) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const body = await res.json()
        toast.error(body.error ?? 'Failed to update')
        return
      }
      setList(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success('Updated')
    } catch {
      toast.error('Network error')
    } finally {
      setActionLoading(null)
    }
  }

  function handleWalkInCreated(r: Reservation) {
    setList(prev => [...prev, r].sort((a, b) =>
      a.reservation_time.localeCompare(b.reservation_time)
    ))
  }

  const pending   = list.filter(r => r.status === 'pending')
  const confirmed = list.filter(r => r.status === 'confirmed')
  const arrived   = list.filter(r => r.status === 'arrived')
  const active    = [...confirmed, ...arrived].sort((a, b) =>
    a.reservation_time.localeCompare(b.reservation_time)
  )

  return (
    <div className="flex flex-col h-full overflow-hidden bg-zinc-50">

      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-5 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Utensils size={14} className="text-[#E63946]" />
            <h1 className="text-sm font-semibold text-zinc-900">{tx.title}</h1>
            <span className="text-xs bg-[#E63946]/10 text-[#E63946] font-medium px-2 py-0.5 rounded-full">
              {tx.live}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">{dateLabel} · {staffName}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 border border-zinc-200 px-2.5 py-1.5 rounded-md hover:bg-zinc-50 transition-colors"
          >
            <ArrowLeft size={12} /> Full view
          </a>
          <button
            onClick={refresh}
            disabled={loading}
            className="p-2 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-px bg-zinc-200 shrink-0">
        {[
          { label: tx.pending,   count: pending.length,   color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: tx.confirmed, count: confirmed.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: tx.arrived,   count: arrived.length,   color: 'text-blue-600',    bg: 'bg-blue-50' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`${bg} px-4 py-3 text-center`}>
            <p className={`text-lg font-bold ${color}`}>{count}</p>
            <p className="text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

        {/* Pending approvals */}
        {pending.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                {tx.pendingApproval}
              </p>
              <span className="text-xs bg-amber-100 text-amber-700 font-medium px-1.5 py-0.5 rounded-full">
                {pending.length}
              </span>
            </div>
            <div className="space-y-3">
              {pending.map(r => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  loading={actionLoading === r.id}
                  onAction={handleAction}
                />
              ))}
            </div>
          </section>
        )}

        {/* Today's schedule */}
        <section>
          <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-3">
            {tx.todaysSchedule}
          </p>
          {loading && list.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-zinc-200 p-4 animate-pulse space-y-2">
                  <div className="h-3 bg-zinc-100 rounded w-32" />
                  <div className="h-2.5 bg-zinc-100 rounded w-24" />
                </div>
              ))}
            </div>
          ) : active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                <Utensils size={16} className="text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-500">{tx.noActive}</p>
              <p className="text-xs text-zinc-400 mt-1">{tx.addWalkInHint}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map(r => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  loading={actionLoading === r.id}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Walk-in FAB */}
      <div className="shrink-0 px-4 py-4 bg-white border-t border-zinc-200">
        <button
          onClick={() => setWalkInOpen(true)}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#E63946] hover:bg-[#c1121f] text-white text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          {tx.addWalkIn}
        </button>
      </div>

      <WalkInModal
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onCreated={handleWalkInCreated}
      />
    </div>
  )
}

// ── Reservation card ──────────────────────────────────────────────

interface CardProps {
  reservation: Reservation
  loading: boolean
  onAction: (id: string, status: ReservationStatus) => void
}

function ReservationCard({ reservation: r, loading, onAction }: CardProps) {
  const { lang } = useLang()
  const tx = dashboardT[lang].quickMode
  const tableName = (r as Reservation & { restaurant_tables?: { name: string } })
    .restaurant_tables?.name ?? null

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 space-y-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate">{r.guest_name}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {formatTime(r.reservation_time)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} />
              {tx.guest(r.party_size)}
            </span>
            {tableName && (
              <span className="text-zinc-500 font-medium">{tableName}</span>
            )}
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      {/* Notes */}
      {r.special_requests && (
        <p className="text-xs text-zinc-400 italic leading-relaxed border-l-2 border-zinc-100 pl-2">
          {r.special_requests}
        </p>
      )}

      {/* Action buttons */}
      <ActionRow
        status={r.status}
        id={r.id}
        reservationTime={r.reservation_time}
        loading={loading}
        onAction={onAction}
      />
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────

function isWithin30Min(reservationTime: string): boolean {
  const [h, m] = reservationTime.split(':').map(Number)
  const resMinutes = h * 60 + m
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return Math.abs(nowMinutes - resMinutes) <= 30
}

// ── Action row per status ─────────────────────────────────────────

function ActionRow({
  status, id, reservationTime, loading, onAction,
}: {
  status: ReservationStatus
  id: string
  reservationTime: string
  loading: boolean
  onAction: (id: string, status: ReservationStatus) => void
}) {
  const { lang } = useLang()
  const tx = dashboardT[lang].quickMode
  if (status === 'pending') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onAction(id, 'confirmed')}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <Check size={13} /> {tx.confirm}
        </button>
        <button
          onClick={() => onAction(id, 'rejected')}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <X size={13} /> {tx.reject}
        </button>
      </div>
    )
  }

  if (status === 'confirmed') {
    const canArrive = isWithin30Min(reservationTime)
    return (
      <div className={`grid gap-2 ${canArrive ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {canArrive && (
          <button
            onClick={() => onAction(id, 'arrived')}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 ring-1 ring-blue-200 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <UserCheck size={13} /> {tx.arrivedBtn}
          </button>
        )}
        <button
          onClick={() => onAction(id, 'no_show')}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-zinc-50 text-zinc-500 hover:bg-zinc-100 ring-1 ring-zinc-200 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <AlertCircle size={13} /> {tx.noShow}
        </button>
      </div>
    )
  }

  if (status === 'arrived') {
    return (
      <button
        onClick={() => onAction(id, 'completed')}
        disabled={loading}
        className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {tx.markCompleted}
      </button>
    )
  }

  return null
}
