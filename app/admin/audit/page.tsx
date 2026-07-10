'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

interface AuditLog {
  id:          string
  created_at:  string
  actor_name:  string | null
  actor_id:    string
  action:      string
  target_type: string | null
  target_id:   string | null
  metadata:    Record<string, unknown> | null
  restaurants: { name: string } | null
}

const ACTION_COLORS: Record<string, string> = {
  'reservation.created':   'bg-blue-50 text-blue-700',
  'reservation.confirmed': 'bg-emerald-50 text-emerald-700',
  'reservation.cancelled': 'bg-red-50 text-red-600',
  'reservation.rejected':  'bg-red-50 text-red-600',
  'reservation.arrived':   'bg-purple-50 text-purple-700',
  'reservation.no_show':   'bg-zinc-100 text-zinc-500',
}

function badge(action: string) {
  return ACTION_COLORS[action] ?? 'bg-zinc-100 text-zinc-600'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminAuditPage() {
  const [logs,      setLogs]      = useState<AuditLog[]>([])
  const [loading,   setLoading]   = useState(true)
  const [page,      setPage]      = useState(0)
  const [hasMore,   setHasMore]   = useState(false)
  const [action,    setAction]    = useState('')
  const [expanded,  setExpanded]  = useState<string | null>(null)

  const load = useCallback(async (p: number, act: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p) })
    if (act) params.set('action', act)
    const res  = await fetch(`/api/admin/audit?${params}`)
    const data = await res.json()
    if (p === 0) setLogs(data.logs ?? [])
    else setLogs(prev => [...prev, ...(data.logs ?? [])])
    setHasMore(data.has_more ?? false)
    setPage(p)
    setLoading(false)
  }, [])

  useEffect(() => { load(0, action) }, [load, action])

  const actions = Array.from(new Set(logs.map(l => l.action))).sort()

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900">Platform Audit Log</h1>
          <p className="text-xs text-zinc-400 mt-0.5">All activity across every restaurant</p>
        </div>
        <button
          onClick={() => load(0, action)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="w-full pl-8 pr-3 h-8 text-xs border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
          >
            <option value="">All actions</option>
            {actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {action && (
          <button onClick={() => setAction('')} className="text-xs text-zinc-400 hover:text-zinc-700">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-x-auto">
        <div className="grid grid-cols-[1fr_120px_160px_140px] gap-0 border-b border-zinc-100 px-4 py-2">
          {['Action', 'Actor', 'Restaurant', 'Time'].map(h => (
            <span key={h} className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{h}</span>
          ))}
        </div>

        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xs text-zinc-400">No audit events found</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {logs.map(log => (
              <div key={log.id}>
                <button
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="w-full grid grid-cols-[1fr_120px_160px_140px] gap-0 px-4 py-2.5 hover:bg-zinc-50 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {log.metadata && (
                      expanded === log.id
                        ? <ChevronUp className="w-3 h-3 text-zinc-300 shrink-0" />
                        : <ChevronDown className="w-3 h-3 text-zinc-300 shrink-0" />
                    )}
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${badge(log.action)}`}>
                      {log.action}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-600 truncate self-center">
                    {log.actor_name ?? log.actor_id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-zinc-500 truncate self-center">
                    {log.restaurants?.name ?? '—'}
                  </span>
                  <span className="text-[11px] text-zinc-400 self-center">
                    {fmtDate(log.created_at)}
                  </span>
                </button>
                {expanded === log.id && log.metadata && (
                  <div className="px-4 pb-3 pl-10">
                    <pre className="text-[10px] text-zinc-500 bg-zinc-50 rounded p-2 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {hasMore && (
        <button
          onClick={() => load(page + 1, action)}
          disabled={loading}
          className="w-full text-xs font-medium py-2 border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
