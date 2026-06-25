'use client'

import { useEffect, useState } from 'react'
import { Phone, Check, X, Clock, ChevronDown, ChevronUp } from 'lucide-react'

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
  admin_notes:     string | null
  follow_up_at:    string | null
  created_at:      string
  approved_at:     string | null
  declined_at:     string | null
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined:  'bg-red-50 text-red-600 border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pending',
  contacted: 'Contacted',
  approved:  'Approved',
  declined:  'Declined',
}

const FILTERS = ['all', 'pending', 'contacted', 'approved', 'declined'] as const

export default function AdminDemoRequestsPage() {
  const [requests,  setRequests]  = useState<DemoRequest[]>([])
  const [loading,   setLoading]   = useState(true)
  const [acting,    setActing]    = useState<string | null>(null)
  const [actionErr,  setActionErr]  = useState<string | null>(null)
  const [setupLink,  setSetupLink]  = useState<string | null>(null)
  const [filter,    setFilter]    = useState<string>('pending')
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [notes,     setNotes]     = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/admin/demo-requests')
      .then(r => r.json())
      .then((d: { requests?: DemoRequest[] }) => { setRequests(d.requests ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: string) {
    setActing(id)
    setActionErr(null)
    const res = await fetch('/api/admin/demo-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, admin_notes: notes[id] }),
    })
    const json = await res.json() as { ok?: boolean; error?: string; warning?: string; setupLink?: string }
    if (res.ok) {
      setRequests(prev => prev.map(r =>
        r.id === id ? {
          ...r, status,
          approved_at: status === 'approved' ? new Date().toISOString() : r.approved_at,
          declined_at: status === 'declined' ? new Date().toISOString() : r.declined_at,
        } : r
      ))
      if (json.warning)   setActionErr(`⚠️ ${json.warning}`)
      if (json.setupLink) setSetupLink(json.setupLink)
    } else {
      setActionErr(json.error ?? 'Something went wrong')
    }
    setActing(null)
  }

  async function saveNotes(id: string) {
    await fetch('/api/admin/demo-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: requests.find(r => r.id === id)?.status, admin_notes: notes[id] }),
    })
  }

  const visible = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900">Access Requests</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {pendingCount} pending · {requests.length} total
          </p>
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md border capitalize transition-colors ${
                filter === s
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {actionErr && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700 flex items-center justify-between">
          <span>{actionErr}</span>
          <button onClick={() => setActionErr(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {setupLink && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-800">Email not delivered — share this link manually</p>
            <button onClick={() => setSetupLink(null)} className="text-amber-400 hover:text-amber-600 text-xs">✕</button>
          </div>
          <p className="text-[11px] text-amber-700">Copy and send this to the restaurant owner so they can set their password:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] bg-white border border-amber-200 rounded px-2 py-1.5 break-all text-zinc-700">{setupLink}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(setupLink).catch(() => {}) }}
              className="shrink-0 text-[11px] px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded border border-amber-200 font-medium transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-[10px] text-amber-600">This link expires in 1 hour. Once your domain is verified in Resend, emails will be sent automatically.</p>
        </div>
      )}

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
          <div key={req.id} className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            {/* Main row */}
            <div className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-zinc-900">{req.restaurant_name}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${STATUS_COLORS[req.status] ?? 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                    {STATUS_LABELS[req.status] ?? req.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 font-medium">{req.contact_name}</p>
                <p className="text-xs text-zinc-400">
                  <a href={`mailto:${req.email}`} className="hover:text-zinc-600 transition-colors">{req.email}</a>
                  {req.phone && <> · <a href={`tel:${req.phone}`} className="hover:text-zinc-600 transition-colors">{req.phone}</a></>}
                </p>
                {(req.city || req.venue_type) && (
                  <p className="text-xs text-zinc-400 mt-0.5">{[req.city, req.venue_type].filter(Boolean).join(' · ')}</p>
                )}
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <p className="text-[11px] text-zinc-400">{new Date(req.created_at).toLocaleDateString('de-AT')}</p>

                {/* Action buttons */}
                {req.status !== 'approved' && req.status !== 'declined' && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => updateStatus(req.id, 'contacted')}
                      disabled={acting === req.id || req.status === 'contacted'}
                      title="Mark as contacted"
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 transition-colors"
                    >
                      <Phone size={10} /> Call
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, 'approved')}
                      disabled={acting === req.id}
                      title="Approve and send invite"
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                    >
                      <Check size={10} /> Approve
                    </button>
                    <button
                      onClick={() => updateStatus(req.id, 'declined')}
                      disabled={acting === req.id}
                      title="Decline request"
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-40 transition-colors"
                    >
                      <X size={10} /> Decline
                    </button>
                  </div>
                )}

                {req.status === 'approved' && (
                  <button
                    onClick={async () => {
                      setActing(req.id)
                      setActionErr(null)
                      setSetupLink(null)
                      const res = await fetch('/api/admin/demo-requests/resend-link', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: req.email }),
                      })
                      const json = await res.json() as { setupLink?: string; error?: string }
                      if (json.setupLink) setSetupLink(json.setupLink)
                      else setActionErr(json.error ?? 'Failed to generate link')
                      setActing(null)
                    }}
                    disabled={acting === req.id}
                    className="text-[11px] px-2 py-1 rounded border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                  >
                    {acting === req.id ? '...' : '↻ Resend setup link'}
                  </button>
                )}
                {req.status === 'declined' && (
                  <button
                    onClick={() => updateStatus(req.id, 'pending')}
                    disabled={acting === req.id}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors"
                  >
                    <Clock size={10} /> Reopen
                  </button>
                )}

                <button
                  onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600 flex items-center gap-0.5 transition-colors"
                >
                  {expanded === req.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {expanded === req.id ? 'Less' : 'More'}
                </button>
              </div>
            </div>

            {/* Expanded details */}
            {expanded === req.id && (
              <div className="border-t border-zinc-100 px-4 py-3 bg-zinc-50 space-y-3">
                {req.message && (
                  <div>
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">Message</p>
                    <p className="text-xs text-zinc-600 italic">&ldquo;{req.message}&rdquo;</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">Admin notes</p>
                  <textarea
                    rows={2}
                    placeholder="Internal notes..."
                    defaultValue={req.admin_notes ?? ''}
                    onChange={e => setNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                    className="w-full text-xs border border-zinc-200 rounded px-2 py-1.5 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-brand-primary/40"
                  />
                  <button
                    onClick={() => saveNotes(req.id)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-700 mt-1 transition-colors"
                  >
                    Save notes
                  </button>
                </div>
                {req.approved_at && (
                  <p className="text-[11px] text-zinc-400">Approved {new Date(req.approved_at).toLocaleString('de-AT')}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
