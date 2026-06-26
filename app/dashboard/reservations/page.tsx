'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GlassCalendar, type ReservationSummary } from '@/components/dashboard/GlassCalendar'
import { DayFeedCard, type Reservation } from '@/components/dashboard/DayFeedCard'
import { CalendarDays, Leaf } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

const now = new Date()
const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

function formatDate(dateStr: string, locale: string) {
  const [yr, mo, dy] = dateStr.split('-').map(Number)
  return new Date(yr, mo - 1, dy).toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// All statuses the API supports
type Status = 'pending' | 'confirmed' | 'rejected' | 'arrived' | 'no_show' | 'completed' | 'cancelled'

const ACTIVE_STATUSES: Status[] = ['pending', 'confirmed', 'arrived']

export default function ReservationsPage() {
  const { lang } = useLang()
  const tx = dashboardT[lang].reservationsPage
  const locale = lang === 'EN' ? 'en-GB' : 'de-AT'
  const supabase = createClient()
  const [reservations, setReservations] = useState<Record<string, Reservation[]>>({})
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState('')

  const fetchReservations = useCallback(async () => {
    // Fetch restaurant name alongside reservations
    const { data: profile } = await supabase
      .from('profiles')
      .select('restaurant_id')
      .single()
    if (profile?.restaurant_id) {
      const { data: rest } = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', profile.restaurant_id)
        .single()
      if (rest?.name) setRestaurantName(rest.name)
    }

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('reservation_time', { ascending: true })

    if (error) { setFetchError(error.message); setLoading(false); return }
    setFetchError(null)

    const grouped: Record<string, Reservation[]> = {}
    for (const row of data ?? []) {
      const key = row.reservation_date
      if (!key) continue
      if (!grouped[key]) grouped[key] = []
      grouped[key].push({
        id:       row.id,
        name:     row.guest_name,
        initials: row.guest_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        von:      row.reservation_time?.slice(0, 5) ?? '',
        bis:      row.reservation_time?.slice(0, 5) ?? '',
        guests:   row.party_size,
        note:     row.notes ?? row.special_requests ?? undefined,
        noteIcon: undefined,
        status:   (row.status ?? 'pending') as Reservation['status'],
      })
    }
    setReservations(grouped)
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchReservations() }, [fetchReservations])

  // Real-time updates via Supabase channel
  useEffect(() => {
    const channel = supabase
      .channel('reservations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchReservations)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchReservations])

  // ── Status transition helper ──────────────────────────────────────────────
  async function patchStatus(id: string, status: Status) {
    const res = await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) return false
    // Optimistic update
    setReservations(prev => {
      const updated = { ...prev }
      for (const date in updated) {
        updated[date] = updated[date].map(r =>
          r.id === id ? { ...r, status: status as Reservation['status'] } : r
        )
      }
      return updated
    })
    return true
  }

  async function handleConfirm(id: string, _reply: string) {
    await patchStatus(id, 'confirmed')
  }

  async function handleDecline(id: string, _reply: string) {
    await patchStatus(id, 'rejected')
  }

  async function handleArrived(id: string) {
    await patchStatus(id, 'arrived')
  }

  async function handleNoShow(id: string) {
    await patchStatus(id, 'no_show')
  }

  // ── Derived counts ────────────────────────────────────────────────────────
  const summaries: ReservationSummary[] = Object.entries(reservations).map(([date, list]) => ({
    date,
    pending:   list.filter(r => r.status === 'pending').length,
    confirmed: list.filter(r => r.status === 'confirmed').length,
  }))

  const dayReservations = reservations[selectedDate] ?? []
  const pendingCount    = dayReservations.filter(r => r.status === 'pending').length
  const confirmedCount  = dayReservations.filter(r => r.status === 'confirmed').length
  const arrivedCount    = dayReservations.filter(r => r.status === 'arrived').length
  const totalPending    = summaries.reduce((a, s) => a + s.pending, 0)
  const totalAll        = summaries.reduce((a, s) => a + s.pending + s.confirmed, 0)

  // Split into active (pending → confirmed → arrived) and done (everything else)
  const activeRes = dayReservations.filter(r => (ACTIVE_STATUSES as string[]).includes(r.status))
  const doneRes   = dayReservations.filter(r => !(ACTIVE_STATUSES as string[]).includes(r.status))

  // Sort active: pending first, then confirmed, then arrived
  const statusOrder: Record<string, number> = { pending: 0, confirmed: 1, arrived: 2 }
  activeRes.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9))

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '30%', width: 500, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)', filter: 'blur(60px)' }}/>
        <div style={{ position: 'absolute', bottom: '5%', right: '10%', width: 380, height: 320, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.45) 0%, transparent 70%)', filter: 'blur(50px)' }}/>
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-8 py-4 shrink-0" style={{ zIndex: 20, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderBottom: '1px solid rgba(255,255,255,0.85)', boxShadow: '0 1px 0 rgba(28,35,31,0.06), 0 4px 24px rgba(28,35,31,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl" style={{ width: 42, height: 42, background: '#0D472B', boxShadow: '0 2px 10px rgba(13,71,43,0.3)' }}>
            <Leaf size={18} color="#ffffff" strokeWidth={2}/>
          </div>
          <div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, color: '#1C231F', letterSpacing: '-0.02em', lineHeight: 1 }}>{restaurantName || 'Reservely'}</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: '#8fa393', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>{lang === 'DE' ? 'Reservierungs-Dashboard' : 'Reservations Dashboard'}</p>
          </div>
        </div>

        <div className="rounded-xl px-5 py-2 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.9)' }}>
          <CalendarDays size={16} strokeWidth={2} style={{ color: '#1B7A43' }}/>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#1C231F' }}>
            {now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {totalPending > 0 && (
            <div className="flex items-center gap-2.5 rounded-xl px-4 py-2" style={{ background: '#0D472B', boxShadow: '0 2px 12px rgba(13,71,43,0.3)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', opacity: 0.85 }}/>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff' }}>{tx.openCount(totalPending)}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-2" style={{ background: 'rgba(27,122,67,0.1)', border: '1px solid rgba(27,122,67,0.2)' }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#1B7A43' }}>{tx.totalCount(totalAll)}</span>
          </div>
        </div>
      </header>

      {/* Split layout */}
      <div className="relative flex flex-1" style={{ zIndex: 1, overflow: 'hidden', height: 'calc(100vh - 66px)' }}>

        {/* LEFT: Calendar */}
        <div className="flex flex-col shrink-0" style={{ width: '45%', overflow: 'hidden', borderRight: '1px solid rgba(28,35,31,0.08)' }}>
          <div className="flex flex-col flex-1 m-5 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.52)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.85)', boxShadow: '0 8px 40px rgba(28,35,31,0.1), 0 1px 4px rgba(28,35,31,0.06), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
            <div className="flex items-center gap-2 px-5 pt-4 pb-0">
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: '#8fa393', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{tx.monthOverview}</p>
            </div>
            <GlassCalendar summaries={summaries} selectedDate={selectedDate} onSelectDate={setSelectedDate}/>
          </div>
        </div>

        {/* RIGHT: Day feed */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-4 shrink-0 flex items-end justify-between" style={{ background: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(28,35,31,0.08)' }}>
            <div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: '#8fa393', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3 }}>
                {selectedDate === todayKey ? tx.today : tx.selectedDay}
              </p>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, fontWeight: 400, color: '#1C231F', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {formatDate(selectedDate, locale)}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl px-3.5 py-1.5" style={{ background: '#0D472B', boxShadow: '0 2px 8px rgba(13,71,43,0.25)' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff' }}>{tx.pendingCount(pendingCount)}</span>
                </div>
              )}
              {confirmedCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl px-3.5 py-1.5" style={{ background: 'rgba(27,122,67,0.1)', border: '1px solid rgba(27,122,67,0.2)' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1B7A43' }}>{tx.confirmedCount(confirmedCount)}</span>
                </div>
              )}
              {arrivedCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl px-3.5 py-1.5" style={{ background: 'rgba(13,71,43,0.12)', border: '1px solid rgba(13,71,43,0.25)' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#0D472B' }}>{tx.arrivedCount(arrivedCount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card feed */}
          <div className="flex-1 overflow-y-auto px-5 py-5" style={{ scrollbarWidth: 'none' }}>
            {fetchError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl p-8" style={{ background: 'rgba(220,53,69,0.06)', border: '1px solid rgba(220,53,69,0.2)' }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#DC3545', fontWeight: 600 }}>Failed to load reservations</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#DC3545', opacity: 0.7, marginTop: 4 }}>{fetchError}</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-40">
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#8fa393' }}>{tx.loading}</p>
              </div>
            ) : dayReservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl" style={{ height: '55%', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 24px rgba(28,35,31,0.07)' }}>
                <CalendarDays size={40} strokeWidth={1.5} style={{ color: '#c0cfc3', marginBottom: 16 }}/>
                <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: '#8fa393', letterSpacing: '-0.01em' }}>{tx.noReservations}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#aabcaf', marginTop: 6 }}>{tx.noEntries}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {/* Active: pending → confirmed → arrived */}
                  {activeRes.map(r => (
                    <DayFeedCard
                      key={r.id}
                      reservation={r}
                      onConfirm={handleConfirm}
                      onDecline={handleDecline}
                      onArrived={handleArrived}
                      onNoShow={handleNoShow}
                    />
                  ))}

                  {/* Divider */}
                  {doneRes.length > 0 && (
                    <div className="flex items-center gap-3 py-1">
                      <div style={{ flex: 1, height: 1, background: 'rgba(28,35,31,0.1)' }}/>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: '#8fa393', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{tx.alreadyHandled}</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(28,35,31,0.1)' }}/>
                    </div>
                  )}

                  {/* Done: declined, no_show, completed, cancelled */}
                  {doneRes.map(r => (
                    <DayFeedCard
                      key={r.id}
                      reservation={r}
                      onConfirm={handleConfirm}
                      onDecline={handleDecline}
                      onArrived={handleArrived}
                      onNoShow={handleNoShow}
                    />
                  ))}
                </div>

                {/* ── Timeline ─────────────────────────────────────────── */}
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(28,35,31,0.10)' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, color: '#8fa393', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 18 }}>
                    {lang === 'EN' ? 'Timeline' : 'Zeitplan'}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {Object.entries(
                      [...dayReservations]
                        .sort((a, b) => a.von.localeCompare(b.von))
                        .reduce((acc, r) => {
                          const hour = r.von.slice(0, 2) + ':00'
                          if (!acc[hour]) acc[hour] = []
                          acc[hour].push(r)
                          return acc
                        }, {} as Record<string, Reservation[]>)
                    )
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([hour, items], groupIdx, arr) => {
                        const isLast = groupIdx === arr.length - 1
                        return (
                          <div key={hour} style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>

                            {/* Time label column */}
                            <div style={{ width: 48, flexShrink: 0, paddingTop: 10 }}>
                              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: '#8fa393' }}>
                                {hour}
                              </span>
                            </div>

                            {/* Spine column */}
                            <div style={{ width: 24, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D472B', marginTop: 12, flexShrink: 0, boxShadow: '0 0 0 3px rgba(13,71,43,0.12)' }}/>
                              {!isLast && <div style={{ width: 1.5, flex: 1, background: 'rgba(13,71,43,0.15)', marginTop: 4 }}/>}
                            </div>

                            {/* Reservation bars */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0 20px 8px' }}>
                              {items.map(r => {
                                const accentColor =
                                  r.status === 'arrived'   ? '#0D472B' :
                                  r.status === 'confirmed' ? '#1B7A43' :
                                  r.status === 'pending'   ? '#B45309' :
                                                             '#94a3b8'
                                const bgColor =
                                  r.status === 'arrived'   ? 'rgba(13,71,43,0.07)'  :
                                  r.status === 'confirmed' ? 'rgba(27,122,67,0.07)' :
                                  r.status === 'pending'   ? 'rgba(180,87,9,0.07)'  :
                                                             'rgba(28,35,31,0.04)'
                                return (
                                  <div key={r.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    background: bgColor,
                                    border: `1px solid ${accentColor}22`,
                                    borderLeft: `3px solid ${accentColor}`,
                                    borderRadius: '10px',
                                    padding: '9px 14px',
                                  }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1C231F', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {r.name}
                                      </span>
                                    </div>
                                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#8fa393', flexShrink: 0 }}>
                                      {r.guests} {lang === 'EN' ? 'guests' : 'Pers.'}
                                    </span>
                                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#c0cfc3', flexShrink: 0, minWidth: 36, textAlign: 'right' }}>
                                      {r.von}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`* { scrollbar-width: none; } *::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}