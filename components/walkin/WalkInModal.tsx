'use client'

import { useState } from 'react'
import { X, Plus, Users } from 'lucide-react'
import { Reservation } from '@/types'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

const CATEGORIES = ['Indoor', 'Outdoor', 'VIP', 'Bar']

interface WalkInModalProps {
  open: boolean
  onClose: () => void
  onCreated: (reservation: Reservation) => void
}

export function WalkInModal({ open, onClose, onCreated }: WalkInModalProps) {
  const [partySize, setPartySize]   = useState(2)
  const [category,  setCategory]    = useState('Indoor')
  const [duration,  setDuration]    = useState(60)
  const [loading,   setLoading]     = useState(false)
  const [error,     setError]       = useState<string | null>(null)
  const { lang } = useLang()
  const tx = dashboardT[lang].walkIn

  if (!open) return null

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/walkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ party_size: partySize, category, duration_minutes: duration }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    onCreated(json.reservation)
    onClose()
    // Reset
    setPartySize(2)
    setCategory('Indoor')
    setDuration(60)
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center">
              <Plus size={14} color="white" strokeWidth={2.5} />
            </div>
            <h2 className="text-sm font-semibold text-zinc-900">{tx.title}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">

          {/* Party size */}
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
              {tx.partySize}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPartySize(v => Math.max(1, v - 1))}
                className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors font-medium"
              >
                −
              </button>
              <div className="flex items-center gap-2 flex-1 justify-center">
                <Users size={14} className="text-zinc-400" />
                <span className="text-lg font-bold text-zinc-900 w-6 text-center">{partySize}</span>
                <span className="text-sm text-zinc-400">{partySize === 1 ? tx.guest : tx.guests}</span>
              </div>
              <button
                onClick={() => setPartySize(v => Math.min(20, v + 1))}
                className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors font-medium"
              >
                +
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
              {tx.seatingArea}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    category === cat
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
              {tx.expectedDuration}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 90, 120, 150, 180].map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    duration === d
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {d < 60 ? `${d}m` : `${d / 60}h`}{d > 60 && d % 60 !== 0 ? `${d % 60}m` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            {tx.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? tx.seating : tx.seatGuest}
          </button>
        </div>
      </div>
    </div>
  )
}