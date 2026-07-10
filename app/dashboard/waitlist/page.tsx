'use client'

import { useCallback, useEffect, useState } from 'react'
import { Clock, Users, Mail, Phone, Check, X, Bell } from 'lucide-react'
import { toast } from 'sonner'

interface WaitlistEntry {
  id:             string
  guest_name:     string
  guest_email:    string
  guest_phone:    string | null
  party_size:     number
  requested_date: string
  requested_time: string | null
  notes:          string | null
  status:         'waiting' | 'notified' | 'booked' | 'cancelled'
  notified_at:    string | null
  created_at:     string
}

const STATUS_LABELS: Record<string, string> = {
  waiting:   'Waiting',
  notified:  'Notified',
  booked:    'Booked',
  cancelled: 'Cancelled',
}
const STATUS_COLORS: Record<string, string> = {
  waiting:   'bg-amber-100 text-amber-700',
  notified:  'bg-blue-100 text-blue-700',
  booked:    'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
}

export default function WaitlistPage() {
  const [entries, setEntries]   = useState<WaitlistEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter,  setFilter]    = useState<'all' | 'waiting' | 'notified' | 'booked' | 'cancelled'>('all')
  const [patching, setPatching] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/waitlist')
    const data = await res.json()
    setEntries(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function patch(id: string, status: string) {
    setPatching(id)
    const res = await fetch('/api/waitlist', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, status }),
    })
    if (res.ok) {
      setEntries(prev => prev.map(e => e.id === id
        ? { ...e, status: status as WaitlistEntry['status'], notified_at: status === 'notified' ? new Date().toISOString() : e.notified_at }
        : e
      ))
      toast.success('Updated')
    } else {
      toast.error('Failed to update')
    }
    setPatching(null)
  }

  const visible = entries.filter(e => filter === 'all' || e.status === filter)
  const waitingCount = entries.filter(e => e.status === 'waiting').length

  return (
    <div className="p-5 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900">Waitlist</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {waitingCount} guest{waitingCount !== 1 ? 's' : ''} currently waiting
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {(['all', 'waiting', 'notified', 'booked', 'cancelled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === f ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABELS[f]}
            {f === 'waiting' && waitingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {waitingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-zinc-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-white border border-zinc-200 rounded-xl text-center">
          <Clock size={24} className="text-zinc-300 mb-3" />
          <p className="text-sm font-medium text-zinc-500">No waitlist entries</p>
          <p className="text-xs text-zinc-400 mt-1">Guests appear here when time slots are fully booked</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(entry => (
            <div key={entry.id} className="bg-white border border-zinc-200 rounded-lg px-4 py-3 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {entry.guest_name.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-zinc-900">{entry.guest_name}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[entry.status]}`}>
                    {STATUS_LABELS[entry.status]}
                  </span>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Users size={9} /> {entry.party_size}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Clock size={10} />
                    {entry.requested_date}{entry.requested_time ? ` at ${entry.requested_time.slice(0,5)}` : ''}
                  </span>
                  <a href={`mailto:${entry.guest_email}`} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                    <Mail size={10} /> {entry.guest_email}
                  </a>
                  {entry.guest_phone && (
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Phone size={10} /> {entry.guest_phone}
                    </span>
                  )}
                </div>
                {entry.notes && (
                  <p className="text-xs text-zinc-400 mt-1 italic truncate">{entry.notes}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 shrink-0">
                {entry.status === 'waiting' && (
                  <button
                    onClick={() => patch(entry.id, 'notified')}
                    disabled={patching === entry.id}
                    title="Mark as notified"
                    className="p-1.5 rounded text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-40"
                  >
                    <Bell size={14} />
                  </button>
                )}
                {(entry.status === 'waiting' || entry.status === 'notified') && (
                  <button
                    onClick={() => patch(entry.id, 'booked')}
                    disabled={patching === entry.id}
                    title="Mark as booked"
                    className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                  >
                    <Check size={14} />
                  </button>
                )}
                {entry.status !== 'cancelled' && entry.status !== 'booked' && (
                  <button
                    onClick={() => patch(entry.id, 'cancelled')}
                    disabled={patching === entry.id}
                    title="Cancel"
                    className="p-1.5 rounded text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
