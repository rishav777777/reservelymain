'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Mail, AlertCircle } from 'lucide-react'

interface EmailLog {
  id:            string
  created_at:    string
  type:          string
  to_email:      string
  subject:       string
  status:        'sent' | 'failed'
  error:         string | null
  restaurant_id: string | null
  restaurants:   { name: string } | null
}

const TYPE_LABELS: Record<string, string> = {
  reservation_confirmation:    'Booking confirmed',
  reservation_rejection:       'Booking rejected',
  reservation_reminder_24h:    'Reminder 24h',
  reservation_reminder_2h:     'Reminder 2h',
  signup_admin_notification:   'Signup (admin)',
  signup_applicant_confirmation:'Signup (applicant)',
  demo_approval:               'Demo approved',
  demo_rejection:              'Demo rejected',
  password_reset:              'Password reset',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminEmailLogsPage() {
  const [logs,    setLogs]    = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [type,    setType]    = useState('')
  const [status,  setStatus]  = useState('')

  const load = useCallback(async (p: number, t: string, s: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (t) params.set('type', t)
    if (s) params.set('status', s)
    const res  = await fetch(`/api/admin/email-logs?${params}`)
    const data = await res.json()
    if (p === 0) setLogs(data.logs ?? [])
    else setLogs(prev => [...prev, ...(data.logs ?? [])])
    setHasMore(data.has_more ?? false)
    setPage(p)
    setLoading(false)
  }, [])

  useEffect(() => { load(0, type, status) }, [load, type, status])

  const failedCount = logs.filter(l => l.status === 'failed').length

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900">Email Delivery Log</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Every outbound email — sent and failed
            {failedCount > 0 && (
              <span className="ml-2 text-red-500 font-medium">{failedCount} failed in view</span>
            )}
          </p>
        </div>
        <button
          onClick={() => load(0, type, status)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="h-8 px-3 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none"
        >
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="h-8 px-3 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        {(type || status) && (
          <button onClick={() => { setType(''); setStatus('') }} className="text-xs text-zinc-400 hover:text-zinc-700">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-x-auto">
        <div className="grid grid-cols-[140px_1fr_160px_80px_100px] gap-0 border-b border-zinc-100 px-4 py-2">
          {['Type', 'Recipient / Subject', 'Restaurant', 'Status', 'Sent at'].map(h => (
            <span key={h} className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Mail className="w-6 h-6 text-zinc-300" />
            <p className="text-xs text-zinc-400">No emails logged yet</p>
            <p className="text-[11px] text-zinc-300 max-w-xs text-center">
              Emails will appear here after you run migration 026 in Supabase.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {logs.map(log => (
              <div
                key={log.id}
                className={`grid grid-cols-[140px_1fr_160px_80px_100px] gap-0 px-4 py-2.5 hover:bg-zinc-50 transition-colors ${log.status === 'failed' ? 'bg-red-50/40' : ''}`}
              >
                <span className="text-[10px] font-medium text-zinc-600 self-center truncate">
                  {TYPE_LABELS[log.type] ?? log.type}
                </span>
                <div className="min-w-0 self-center">
                  <p className="text-xs text-zinc-800 truncate">{log.to_email}</p>
                  <p className="text-[10px] text-zinc-400 truncate">{log.subject}</p>
                  {log.error && (
                    <p className="text-[10px] text-red-500 truncate flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" />{log.error}
                    </p>
                  )}
                </div>
                <span className="text-xs text-zinc-500 self-center truncate">
                  {log.restaurants?.name ?? '—'}
                </span>
                <span className="self-center">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${log.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
                    {log.status}
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 self-center">{fmt(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasMore && (
        <button
          onClick={() => load(page + 1, type, status)}
          disabled={loading}
          className="w-full text-xs font-medium py-2 border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
