'use client'

import { useCallback, useEffect, useState } from 'react'
import { GuestProfile } from '@/types'
import { toast } from 'sonner'
import { Search, Star, X, ChevronRight, Users, CalendarDays, Phone, Mail, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

interface HistoryRow {
  id: string
  reservation_date: string
  reservation_time: string
  party_size: number
  status: string
  special_requests: string | null
  restaurant_tables: { name: string } | null
}

interface Props { restaurantId: string }

export function GuestsClient({ restaurantId }: Props) {
  const { lang } = useLang()
  const tx = dashboardT[lang].guests
  const locale = lang === 'EN' ? 'en-GB' : 'de-AT'

  const [guests, setGuests]           = useState<GuestProfile[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [stammgastOnly, setStammgastOnly] = useState(false)
  const [selected, setSelected]       = useState<GuestProfile | null>(null)
  const [history, setHistory]         = useState<HistoryRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [editNotes, setEditNotes]     = useState('')

  const fetchGuests = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ restaurantId })
    if (search.trim())  params.set('search', search.trim())
    if (stammgastOnly)  params.set('stammgast', 'true')

    const res = await fetch(`/api/guests?${params}`)
    const data = await res.json()
    setGuests(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [restaurantId, search, stammgastOnly])

  useEffect(() => {
    const t = setTimeout(fetchGuests, 300)
    return () => clearTimeout(t)
  }, [fetchGuests])

  async function openGuest(guest: GuestProfile) {
    setSelected(guest)
    setEditNotes(guest.notes ?? '')
    setHistoryLoading(true)
    const res = await fetch(`/api/guests/${guest.id}`)
    const { history: h } = await res.json()
    setHistory(h ?? [])
    setHistoryLoading(false)
  }

  async function saveNotes() {
    if (!selected) return
    setSaving(true)
    const res = await fetch(`/api/guests/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: editNotes }),
    })
    if (res.ok) {
      setGuests(prev => prev.map(g => g.id === selected.id ? { ...g, notes: editNotes } : g))
      setSelected(prev => prev ? { ...prev, notes: editNotes } : null)
      toast.success(tx.detail.saveNotes)
    } else {
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  async function toggleStammgast(guest: GuestProfile) {
    const next = !guest.is_stammgast
    const res = await fetch(`/api/guests/${guest.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_stammgast: next }),
    })
    if (res.ok) {
      setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, is_stammgast: next } : g))
      setSelected(prev => prev?.id === guest.id ? { ...prev, is_stammgast: next } : prev)
      toast.success(next ? tx.detail.stammgast : tx.detail.saveNotes)
    } else {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left: Guest list ── */}
      <div className="flex flex-col w-full max-w-md border-r border-zinc-200 bg-white overflow-hidden shrink-0">

        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-sm font-semibold text-zinc-900">{tx.title}</h1>
              <p className="text-xs text-zinc-400 mt-0.5">{tx.guestCount(guests.length)}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tx.searchPh}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Stammgast filter */}
          <div className="flex items-center gap-2">
            <Switch
              checked={stammgastOnly}
              onCheckedChange={setStammgastOnly}
            />
            <span className="text-xs text-zinc-600 flex items-center gap-1">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              {tx.stammgastOnly}
            </span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-3 animate-pulse">
                <div className="h-3 bg-zinc-100 rounded w-32 mb-1.5" />
                <div className="h-2.5 bg-zinc-100 rounded w-48" />
              </div>
            ))
          ) : guests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Users size={24} className="text-zinc-300 mb-3" />
              <p className="text-sm font-medium text-zinc-500">{tx.empty.title}</p>
              <p className="text-xs text-zinc-400 mt-1">{tx.empty.subtitle}</p>
            </div>
          ) : (
            guests.map(g => (
              <button
                key={g.id}
                onClick={() => openGuest(g)}
                className={`w-full text-left px-5 py-3 hover:bg-zinc-50 transition-colors flex items-center gap-3 ${selected?.id === g.id ? 'bg-zinc-50' : ''}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#E63946]/10 text-[#E63946] flex items-center justify-center text-xs font-semibold shrink-0">
                  {(g.name ?? g.email).slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-zinc-900 truncate">
                      {g.name ?? g.email}
                    </p>
                    {g.is_stammgast && (
                      <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                    )}
                    {(g.no_show_count ?? 0) >= 2 && (
                      <span title={`${g.no_show_count} no-shows — repeat offender`}>
                        <AlertTriangle size={10} className="text-red-500 shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{g.email}</p>
                  <p className="text-xs text-zinc-400">
                    {tx.visits(g.visit_count)}
                    {g.last_visit && ` · ${tx.lastVisit} ${new Date(g.last_visit).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}`}
                    {(g.no_show_count ?? 0) > 0 && (
                      <span className="text-red-500"> · {g.no_show_count} no-show{(g.no_show_count ?? 0) > 1 ? 's' : ''}</span>
                    )}
                  </p>
                </div>

                <ChevronRight size={13} className="text-zinc-300 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Guest detail panel ── */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50">

          {/* Panel header */}
          <div className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E63946]/10 text-[#E63946] flex items-center justify-center text-sm font-bold">
                {(selected.name ?? selected.email).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{selected.name ?? '—'}</p>
                  {selected.is_stammgast && (
                    <span className="text-xs bg-amber-50 text-amber-700 ring-1 ring-amber-200 font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={9} className="fill-amber-400 text-amber-400" /> {tx.detail.stammgast}
                    </span>
                  )}
                  {(selected.no_show_count ?? 0) >= 2 && (
                    <span className="text-xs bg-red-50 text-red-600 ring-1 ring-red-200 font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle size={9} /> Repeat no-show
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  {tx.visits(selected.visit_count)}
                  {(selected.no_show_count ?? 0) > 0 && (
                    <span className="text-red-500"> · {selected.no_show_count} no-show{(selected.no_show_count ?? 0) > 1 ? 's' : ''}</span>
                  )}
                </p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-400">
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Contact info */}
            <section className="bg-white rounded-lg border border-zinc-200 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{tx.detail.contact}</p>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <Mail size={12} className="text-zinc-400" />
                {selected.email}
              </div>
              {selected.phone && (
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <Phone size={12} className="text-zinc-400" />
                  {selected.phone}
                </div>
              )}
              {selected.first_visit && (
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <CalendarDays size={12} className="text-zinc-400" />
                  {tx.detail.firstVisit} {new Date(selected.first_visit).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </section>

            {/* Stammgast toggle */}
            <section className="bg-white rounded-lg border border-zinc-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-700">{tx.detail.stammgast}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{tx.detail.stammgastDesc}</p>
                </div>
                <Switch
                  checked={selected.is_stammgast}
                  onCheckedChange={() => toggleStammgast(selected)}
                />
              </div>
            </section>

            {/* Notes */}
            <section className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{tx.detail.notes}</p>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder={tx.detail.notesPh}
                rows={3}
                className="w-full text-xs border border-zinc-200 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#E63946] text-zinc-700"
              />
              <Button
                onClick={saveNotes}
                disabled={saving || editNotes === (selected.notes ?? '')}
                className="h-7 text-xs bg-[#E63946] hover:bg-[#c1121f] text-white"
              >
                {saving ? tx.detail.saving : tx.detail.saveNotes}
              </Button>
            </section>

            {/* Reservation history */}
            <section className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {tx.detail.visitHistory}
              </p>
              {historyLoading ? (
                <p className="text-xs text-zinc-400">{tx.detail.loading}</p>
              ) : history.length === 0 ? (
                <p className="text-xs text-zinc-400">{tx.detail.noReservations}</p>
              ) : (
                <div className="space-y-2">
                  {history.map(h => (
                    <div key={h.id} className="flex items-start justify-between py-2 border-b border-zinc-100 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-zinc-700">
                          {new Date(h.reservation_date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}{h.reservation_time.slice(0, 5)}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {tx.detail.visitGuests(h.party_size)}
                          {h.restaurant_tables?.name && ` · ${h.restaurant_tables.name}`}
                        </p>
                        {h.special_requests && (
                          <p className="text-xs text-zinc-400 italic mt-0.5">{h.special_requests}</p>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                        h.status === 'completed'  ? 'bg-slate-100 text-slate-500' :
                        h.status === 'confirmed'  ? 'bg-emerald-50 text-emerald-700' :
                        h.status === 'cancelled'  ? 'bg-red-50 text-red-600' :
                        'bg-zinc-100 text-zinc-500'
                      }`}>
                        {h.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-zinc-50">
          <div className="text-center">
            <Users size={28} className="text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-400">{tx.detail.selectGuest}</p>
          </div>
        </div>
      )}
    </div>
  )
}
