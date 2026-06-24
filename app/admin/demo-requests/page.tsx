'use client'

import { useEffect, useState } from 'react'

interface DemoRequest {
  id:              string
  restaurant_name: string
  contact_name:    string
  email:           string
  phone:           string | null
  city:            string | null
  venue_type:      string | null
  message:         string | null
  status:          string
  created_at:      string
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed:    'bg-zinc-100 text-zinc-500 border-zinc-200',
}

export default function AdminDemoRequestsPage() {
  const [requests, setRequests] = useState<DemoRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState<string | null>(null)
  const [filter, setFilter]     = useState('pending')

  useEffect(() => {
    fetch('/api/admin/demo-requests')
      .then(r => r.json())
      .then(d => { setRequests(d.requests ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: string) {
    setActing(id)
    await fetch('/api/admin/demo-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setActing(null)
  }

  const visible = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter)

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900">Demo Requests</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{requests.filter(r => r.status === 'pending').length} pending</p>
        </div>
        <div className="flex gap-1.5">
          {(['all', 'pending', 'contacted', 'approved', 'closed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md border capitalize transition-colors ${
                filter === s ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-lg flex items-center justify-center h-24 text-xs text-zinc-400">
            No {filter === 'all' ? '' : filter} requests
          </div>
        ) : visible.map(req => (
          <div key={req.id} className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-zinc-900">{req.restaurant_name}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize ${STATUS_COLORS[req.status] ?? 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {req.contact_name} · {req.email}{req.phone ? ` · ${req.phone}` : ''}
                </p>
                {(req.city || req.venue_type) && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {[req.city, req.venue_type].filter(Boolean).join(' · ')}
                  </p>
                )}
                {req.message && (
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed line-clamp-2 italic">&ldquo;{req.message}&rdquo;</p>
                )}
              </div>
              <div className="shrink-0 text-right space-y-2">
                <p className="text-[11px] text-zinc-400">
                  {new Date(req.created_at).toLocaleDateString('en-GB')}
                </p>
                <select
                  value={req.status}
                  onChange={e => updateStatus(req.id, e.target.value)}
                  disabled={acting === req.id}
                  className="text-[11px] border border-zinc-200 rounded px-2 py-1 bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-brand-primary/40 disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="approved">Approved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
