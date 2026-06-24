'use client'

import { useCallback, useEffect, useState } from 'react'
import { RecurringReservation } from '@/types'
import { toast } from 'sonner'
import { Plus, Trash2, Users, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

const EMPTY_FORM = {
  guest_name: '', guest_email: '', guest_phone: '',
  party_size: 2, day_of_week: 4, start_time: '19:00',
  duration_minutes: 120, table_id: '', label: '', notes: '',
}

interface Table { id: string; name: string; capacity: number }
interface Props  { restaurantId: string; tables: Table[] }

export function StammtischClient({ restaurantId, tables }: Props) {
  const { lang } = useLang()
  const tx = dashboardT[lang].stammtisch

  const [recurring, setRecurring]   = useState<RecurringReservation[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const res  = await fetch(`/api/recurring?restaurantId=${restaurantId}`)
    const data = await res.json()
    setRecurring(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [restaurantId])

  useEffect(() => { fetch_() }, [fetch_])

  function field(key: keyof typeof EMPTY_FORM, value: string | number) {
    setForm(p => ({ ...p, [key]: value }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.guest_name.trim()) { toast.error(tx.form.guestName); return }
    setSaving(true)
    const res = await fetch('/api/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        restaurant_id: restaurantId,
        table_id:      form.table_id || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? 'Failed to create')
    } else {
      setRecurring(prev => [...prev, data])
      setShowForm(false)
      setForm(EMPTY_FORM)
      toast.success(tx.addButton)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setRecurring(prev => prev.filter(r => r.id !== id))
      toast.success(tx.title)
    } else {
      toast.error('Failed to remove')
    }
    setDeletingId(null)
  }

  // Group by day_of_week
  const byDay: Record<number, RecurringReservation[]> = {}
  for (const r of recurring) {
    if (!byDay[r.day_of_week]) byDay[r.day_of_week] = []
    byDay[r.day_of_week].push(r)
  }

  return (
    <div className="p-5 max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900">{tx.title}</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{tx.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetch_}
            disabled={loading}
            className="p-2 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <Button
            onClick={() => setShowForm(v => !v)}
            className="h-8 text-xs bg-[#E63946] hover:bg-[#c1121f] text-white gap-1.5"
          >
            <Plus size={13} />
            {tx.addButton}
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <p className="text-xs font-semibold text-zinc-700">{tx.form.title}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs text-zinc-600">{tx.form.guestName}</Label>
              <Input value={form.guest_name} onChange={e => field('guest_name', e.target.value)} className="h-8 text-xs" placeholder="Stammtisch Müller" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-600">{tx.form.email}</Label>
              <Input type="email" value={form.guest_email} onChange={e => field('guest_email', e.target.value)} className="h-8 text-xs" placeholder="optional" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-600">{tx.form.phone}</Label>
              <Input value={form.guest_phone} onChange={e => field('guest_phone', e.target.value)} className="h-8 text-xs" placeholder="optional" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-600">{tx.form.day}</Label>
              <select
                value={form.day_of_week}
                onChange={e => field('day_of_week', Number(e.target.value))}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {tx.days.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-600">{tx.form.startTime}</Label>
              <Input type="time" value={form.start_time} onChange={e => field('start_time', e.target.value)} className="h-8 text-xs" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-600">{tx.form.duration}</Label>
              <Input type="number" min={30} max={480} value={form.duration_minutes} onChange={e => field('duration_minutes', Number(e.target.value))} className="h-8 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-600">{tx.form.partySize}</Label>
              <Input type="number" min={1} max={50} value={form.party_size} onChange={e => field('party_size', Number(e.target.value))} className="h-8 text-xs" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-600">{tx.form.table}</Label>
              <select
                value={form.table_id}
                onChange={e => field('table_id', e.target.value)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">{tx.form.anyTable}</option>
                {tables.map(t => <option key={t.id} value={t.id}>{t.name} (cap. {t.capacity})</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-600">{tx.form.label}</Label>
            <Input value={form.label} onChange={e => field('label', e.target.value)} className="h-8 text-xs" placeholder="e.g. Stammtisch Montag" />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => setShowForm(false)}>
              {tx.form.cancel}
            </Button>
            <Button type="submit" disabled={saving} className="h-8 text-xs bg-[#E63946] hover:bg-[#c1121f] text-white flex-1">
              {saving ? tx.form.creating : tx.form.create}
            </Button>
          </div>
        </form>
      )}

      {/* List grouped by day */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : recurring.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center">
          <RefreshCw size={24} className="text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-500">{tx.empty.title}</p>
          <p className="text-xs text-zinc-400 mt-1">{tx.empty.subtitle}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[0, 1, 2, 3, 4, 5, 6]
            .filter(d => byDay[d]?.length)
            .map(dayIdx => (
              <div key={dayIdx}>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                  {tx.days[dayIdx]}
                </p>
                <div className="space-y-2">
                  {byDay[dayIdx].map(r => (
                    <div key={r.id} className="bg-white rounded-xl border border-zinc-200 px-4 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-zinc-900 truncate">{r.guest_name}</p>
                          {r.label && (
                            <span className="text-xs bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full shrink-0">
                              {r.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {r.start_time.slice(0, 5)} · {r.duration_minutes}min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={10} />
                            {r.party_size}
                          </span>
                          {r.restaurant_tables && (
                            <span>{r.restaurant_tables.name}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
