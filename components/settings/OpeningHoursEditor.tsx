'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

interface DayRow {
  label:        string
  day_of_week:  number
  is_open:      boolean
  open_time:    string | null
  close_time:   string | null
  last_booking: string | null
}

interface Props {
  restaurantId: string
}

export function OpeningHoursEditor({ restaurantId }: Props) {
  const [hours, setHours] = useState<DayRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { lang } = useLang()
  const tx = dashboardT[lang].openingHours

  useEffect(() => {
    fetch(`/api/opening-hours?restaurantId=${restaurantId}`)
      .then(r => r.json())
      .then(data => { setHours(data); setLoading(false) })
      .catch(() => { toast.error(tx.loadFailed); setLoading(false) })
  }, [restaurantId])

  function update(index: number, patch: Partial<DayRow>) {
    setHours(prev => prev.map((row, i) => i === index ? { ...row, ...patch } : row))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/opening-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, hours }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to save')
      } else {
        toast.success('Opening hours saved')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <p className="text-xs text-gray-400">{tx.loading}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
      {hours.map((row, i) => (
        <div key={row.day_of_week} className="flex items-center gap-3">
          {/* Day label + toggle */}
          <div className="flex items-center gap-2 w-24 shrink-0">
            <Switch
              checked={row.is_open}
              onCheckedChange={(v) => update(i, { is_open: v })}
            />
            <span className="text-xs font-medium text-gray-700">{row.label}</span>
          </div>

          {row.is_open ? (
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">{tx.open}</span>
                <input
                  type="time"
                  value={row.open_time ?? '11:00'}
                  onChange={(e) => update(i, { open_time: e.target.value })}
                  className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">{tx.close}</span>
                <input
                  type="time"
                  value={row.close_time ?? '22:00'}
                  onChange={(e) => update(i, { close_time: e.target.value })}
                  className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 whitespace-nowrap">{tx.lastBooking}</span>
                <input
                  type="time"
                  value={row.last_booking ?? '21:00'}
                  onChange={(e) => update(i, { last_booking: e.target.value })}
                  className="h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">{tx.closed}</span>
          )}
        </div>
      ))}

      <Button
        type="submit"
        className="w-full h-8 text-sm bg-[#E63946] hover:bg-[#c1121f] text-white mt-2"
        disabled={saving}
      >
        {saving ? tx.saving : tx.save}
      </Button>
    </form>
  )
}
