'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Reservation, Notice, ReservationStatus } from '@/types'
import { QuickMetrics } from '@/components/dashboard/QuickMetrics'
import { Timeline } from '@/components/dashboard/Timeline'
import { PendingQueue } from '@/components/dashboard/PendingQueue'
import { NoticesPanel } from '@/components/dashboard/NoticesPanel'
import { ReservationDetailPanel } from '@/components/reservations/ReservationDetailPanel'
import { WalkInModal } from '@/components/walkin/WalkInModal'
import { CreateReservationModal } from '@/components/reservations/CreateReservationModal'
import {
  Plus, CalendarPlus, ChevronLeft, ChevronRight,
  Check, AlertTriangle, Info, Link as LinkIcon, Copy, CheckCheck, Zap,
} from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

interface DashboardClientProps {
  initialReservations: Reservation[]
  notices:             Notice[]
  staffName:           string
  greeting:            string
  dateLabel:           string
  totalTables:         number
  trialDaysLeft:       number | null
  subscriptionStatus:  string
  setupCompleted:      boolean
  restaurantId:        string
  restaurantSlug:      string
  restaurantName:      string
  openingHoursConfigured: boolean
  hasTablesConfigured: boolean
  today:               string
}

function fmtDate(dateStr: string, today: string, todayPrefix: string, locale: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const prefix = dateStr === today ? todayPrefix : ''
  return prefix + date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + n)
  return date.toISOString().split('T')[0]
}

export function DashboardClient({
  initialReservations,
  notices,
  staffName,
  greeting,
  dateLabel,
  totalTables,
  trialDaysLeft,
  subscriptionStatus,
  setupCompleted,
  restaurantId,
  restaurantSlug,
  restaurantName,
  openingHoursConfigured,
  hasTablesConfigured,
  today,
}: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const { lang } = useLang()
  const tx = dashboardT[lang].client

  const [selectedDate, setSelectedDate]   = useState(today)
  const [reservations, setReservations]   = useState(initialReservations)
  const [loadingDate, setLoadingDate]     = useState(false)
  const [selectedRes, setSelectedRes]     = useState<Reservation | null>(null)
  const [panelOpen, setPanelOpen]         = useState(false)
  const [walkInOpen, setWalkInOpen]       = useState(false)
  const [createOpen, setCreateOpen]       = useState(false)
  const [copied, setCopied]               = useState(false)

  const pending = reservations.filter((r) => r.status === 'pending')

  const bookingUrl = restaurantSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${restaurantSlug}`
    : null

  const showSetupBanner = !setupCompleted || !openingHoursConfigured || !hasTablesConfigured

  async function fetchDate(date: string) {
    if (!restaurantId) return
    setLoadingDate(true)
    const res = await supabase
      .from('reservations')
      .select('*, restaurant_tables(name, capacity, category)')
      .eq('reservation_date', date)
      .eq('restaurant_id', restaurantId)
      .order('reservation_time', { ascending: true })
    setReservations(res.data ?? [])
    setLoadingDate(false)
  }

  async function changeDate(direction: -1 | 1) {
    const next = addDays(selectedDate, direction)
    const minDate = addDays(today, -30)
    const maxDate = addDays(today, 120)
    if (next < minDate || next > maxDate) return
    setSelectedDate(next)
    if (next === today) {
      setReservations(initialReservations)
    } else {
      await fetchDate(next)
    }
  }

  const handleSelectReservation = useCallback((r: Reservation) => {
    setSelectedRes(r)
    setPanelOpen(true)
  }, [])

  function handleStatusUpdate(id: string, updated: Reservation) {
    setReservations((prev) => prev.map((r) => (r.id === id ? updated : r)))
    setSelectedRes((prev) => (prev?.id === id ? updated : prev))
  }

  function handlePendingUpdate(id: string, newStatus: 'confirmed' | 'rejected') {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus as ReservationStatus } : r))
    )
  }

  function handleReservationCreated(reservation: Reservation) {
    if (reservation.reservation_date === selectedDate) {
      setReservations((prev) =>
        [...prev, reservation].sort((a, b) =>
          a.reservation_time.localeCompare(b.reservation_time)
        )
      )
    }
  }

  function handleWalkInCreated(reservation: Reservation) {
    handleReservationCreated(reservation)
  }

  async function copyBookingLink() {
    if (!bookingUrl) return
    await navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const locale    = lang === 'DE' ? 'de-DE' : 'en-GB'
  const dateLabel2 = useMemo(
    () => fmtDate(selectedDate, today, tx.todayPrefix, locale),
    [selectedDate, today, tx.todayPrefix, locale]
  )

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Trial / subscription banners */}
        {(trialDaysLeft !== null || subscriptionStatus === 'past_due' || subscriptionStatus === 'cancelled') && (
          <div>
            {subscriptionStatus === 'past_due' && (
              <div className="flex items-center justify-between px-6 py-2.5 text-xs font-medium bg-red-50 text-red-700 border-b border-red-100">
                <span className="flex items-center gap-1.5"><AlertTriangle size={12} />{tx.paymentFailed}</span>
                <a href="/dashboard/billing" className="underline font-semibold">{tx.updatePayment}</a>
              </div>
            )}
            {subscriptionStatus === 'cancelled' && (
              <div className="flex items-center justify-between px-6 py-2.5 text-xs font-medium bg-red-50 text-red-700 border-b border-red-100">
                <span className="flex items-center gap-1.5"><AlertTriangle size={12} />{tx.cancelled}</span>
                <a href="/dashboard/billing" className="underline font-semibold">{tx.reSubscribe}</a>
              </div>
            )}
            {trialDaysLeft !== null && subscriptionStatus === 'trialing' && (
              <div className={`flex items-center justify-between px-6 py-2.5 text-xs font-medium border-b ${
                trialDaysLeft <= 0 ? 'bg-red-50 text-red-700 border-red-100'
                : trialDaysLeft <= 7 ? 'bg-amber-50 text-amber-700 border-amber-100'
                : 'bg-blue-50 text-blue-700 border-blue-100'
              }`}>
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  {trialDaysLeft <= 0 ? tx.trialEnded : tx.trialLeft(trialDaysLeft)}
                </span>
                <a href="/dashboard/billing" className="underline font-semibold">
                  {trialDaysLeft <= 0 ? tx.subscribeNow : tx.viewBilling}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Setup checklist banner */}
        {showSetupBanner && (
          <div className="mx-5 mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-800 mb-3">
              {tx.completeSetup}
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                {openingHoursConfigured ? (
                  <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                )}
                <a
                  href="/dashboard/settings"
                  className={`text-xs ${openingHoursConfigured ? 'line-through text-zinc-400' : 'text-amber-800 underline underline-offset-2'}`}
                >
                  {tx.setOpeningHours}
                </a>
              </div>

              <div className="flex items-start gap-2">
                {hasTablesConfigured ? (
                  <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                )}
                <a
                  href="/dashboard/tables"
                  className={`text-xs ${hasTablesConfigured ? 'line-through text-zinc-400' : 'text-amber-800 underline underline-offset-2'}`}
                >
                  {tx.addTables}
                </a>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Info size={13} className="text-blue-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-zinc-500">{tx.shareLink}</span>
                </div>
                {restaurantSlug && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-zinc-500 font-mono">/book/{restaurantSlug}</span>
                    <button
                      onClick={copyBookingLink}
                      className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-primary/80 font-medium px-2 py-0.5 rounded border border-brand-primary/20 bg-white transition-colors"
                    >
                      {copied ? <CheckCheck size={11} /> : <Copy size={11} />}
                      {copied ? tx.copied : tx.copyLink}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header: date nav + action buttons */}
        <header className="px-5 pt-5 pb-0 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeDate(-1)}
                className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft size={16} />
              </button>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{dateLabel2}</p>
                {loadingDate ? (
                  <p className="text-xs text-zinc-400">{tx.loading}</p>
                ) : (
                  <p className="text-xs text-zinc-400">
                    {reservations.length === 0
                      ? tx.noReservations
                      : tx.reservationCount(reservations.length)}
                  </p>
                )}
              </div>
              <button
                onClick={() => changeDate(1)}
                className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label="Next day"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href="/dashboard/quick"
                className="hidden sm:flex items-center gap-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
              >
                <Zap size={12} /> {tx.quickMode ?? 'Quick Mode'}
              </a>
              <button
                onClick={() => setWalkInOpen(true)}
                className="flex items-center gap-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Plus size={12} /> <span className="hidden sm:inline">{tx.walkIn}</span>
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors"
              >
                <CalendarPlus size={12} /> <span className="hidden sm:inline">{tx.newReservation}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto p-5 pt-4 space-y-5">
          <QuickMetrics reservations={reservations} totalTables={totalTables} />

          {/* Mobile-only pending queue */}
          {pending.length > 0 && (
            <div className="md:hidden">
              <PendingQueue reservations={pending} onUpdate={handlePendingUpdate} onSelect={handleSelectReservation} />
            </div>
          )}

          {reservations.length === 0 && !loadingDate ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-3">
                <CalendarPlus size={18} className="text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-700 mb-1">{tx.noReservations}</p>
              <p className="text-xs text-zinc-400 mb-4">
                {selectedDate === today ? tx.emptyToday : tx.emptyDay}
              </p>
              {restaurantSlug && selectedDate === today && (
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2">
                  <LinkIcon size={12} className="text-zinc-400" />
                  <span className="text-xs text-zinc-500 font-mono">/book/{restaurantSlug}</span>
                  <button
                    onClick={copyBookingLink}
                    className="text-xs text-brand-primary font-medium hover:underline ml-1"
                  >
                    {copied ? tx.copied : tx.copyLink}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                {tx.timelineLabel}
              </p>
              <Timeline
                reservations={reservations}
                onSelectReservation={handleSelectReservation}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right panel — pending queue + notices (hidden on mobile) */}
      <aside className="hidden md:flex md:flex-col w-56 shrink-0 border-l border-zinc-200 bg-white overflow-auto">
        <div className="p-4 space-y-6">
          <PendingQueue reservations={pending} onUpdate={handlePendingUpdate} onSelect={handleSelectReservation} />
          {notices.length > 0 && (
            <div className="border-t border-zinc-100 pt-5">
              <NoticesPanel notices={notices} />
            </div>
          )}
        </div>
      </aside>

      {/* Detail panel */}
      <ReservationDetailPanel
        reservation={selectedRes}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onStatusUpdate={handleStatusUpdate}
        staffName={staffName}
      />

      <WalkInModal
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onCreated={handleWalkInCreated}
      />

      <CreateReservationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleReservationCreated}
      />
    </div>
  )
}
