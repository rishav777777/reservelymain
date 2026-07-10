'use client'

import { useEffect, useState } from 'react'
import { Check, AlertCircle } from 'lucide-react'

interface Settings {
  maintenance_mode: boolean
  trial_days:       number
  contact_email:    string
  platform_name:    string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    maintenance_mode: false,
    trial_days:       30,
    contact_email:    'support@reservely.app',
    platform_name:    'Reservely',
  })
  const [loading, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => { if (d.settings) setSettings(d.settings); setFetching(false) })
      .catch(() => setFetching(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to save')
    }
  }

  const INPUT = 'text-xs border border-zinc-200 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-brand-primary/40'

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-xl space-y-5">
      <div>
        <h1 className="text-sm font-semibold text-zinc-900">Platform Settings</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Global configuration for the Reservely platform</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Maintenance mode */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-900">Maintenance mode</p>
              <p className="text-xs text-zinc-400 mt-0.5">When on, all dashboard access is blocked with a maintenance notice</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings(p => ({ ...p, maintenance_mode: !p.maintenance_mode }))}
              className={`w-9 h-5 rounded-full transition-colors relative ${settings.maintenance_mode ? 'bg-brand-primary' : 'bg-zinc-200'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.maintenance_mode ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {settings.maintenance_mode && (
            <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">Maintenance mode is ON — dashboards will be inaccessible</p>
            </div>
          )}
        </div>

        {/* Platform name */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-zinc-900">General</p>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Platform name</label>
            <input
              value={settings.platform_name}
              onChange={e => setSettings(p => ({ ...p, platform_name: e.target.value }))}
              className={INPUT}
              required
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Support email</label>
            <input
              type="email"
              value={settings.contact_email}
              onChange={e => setSettings(p => ({ ...p, contact_email: e.target.value }))}
              className={INPUT}
              required
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Default trial duration (days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.trial_days}
              onChange={e => setSettings(p => ({ ...p, trial_days: Number(e.target.value) }))}
              className={INPUT}
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={loading}
            className="text-xs font-semibold bg-brand-primary hover:bg-brand-primary/90 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
