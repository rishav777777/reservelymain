'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, CheckCircle2, XCircle, Clock, Trash2, RotateCcw, AlertTriangle } from 'lucide-react'

interface Restaurant {
  id:                  string
  name:                string
  slug:                string | null
  subscription_status: string
  subscription_plan:   string
  booking_enabled:     boolean
  setup_completed:     boolean
  created_at:          string
  owner_active:        boolean
  last_reservation:    string | null
  deleted_at:          string | null
  deleted_reason:      string | null
  purge_after:         string | null
}

type Tab = 'active' | 'suspended' | 'deleted'

const SUB_STATUS: Record<string, { label: string; className: string }> = {
  trialing:  { label: 'Trial',     className: 'text-blue-600 bg-blue-50'     },
  active:    { label: 'Active',    className: 'text-emerald-600 bg-emerald-50'},
  past_due:  { label: 'Past due',  className: 'text-amber-600 bg-amber-50'   },
  cancelled: { label: 'Cancelled', className: 'text-red-500 bg-red-50'       },
  paused:    { label: 'Paused',    className: 'text-zinc-500 bg-zinc-100'    },
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function AdminRestaurantsPage() {
  const [tab,         setTab]         = useState<Tab>('active')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [query,       setQuery]       = useState('')
  const [acting,      setActing]      = useState<string | null>(null)

  // Delete confirm dialog state
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null)
  const [deleteReason, setDeleteReason] = useState('')

  function load(t: Tab) {
    setLoading(true)
    setError(null)
    fetch(`/api/admin/restaurants?tab=${t}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setRestaurants(d.restaurants ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load(tab) }, [tab])

  async function toggleActive(id: string, currentlyActive: boolean) {
    setActing(id)
    await fetch(`/api/admin/restaurants/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ owner_active: !currentlyActive }),
    })
    load(tab)
    setActing(null)
  }

  async function softDelete(r: Restaurant) {
    setActing(r.id)
    setDeleteTarget(null)
    await fetch(`/api/admin/restaurants/${r.id}`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason: deleteReason || null }),
    })
    setDeleteReason('')
    load(tab)
    setActing(null)
  }

  async function reactivate(id: string) {
    setActing(id)
    await fetch(`/api/admin/restaurants/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reactivate: true }),
    })
    load(tab)
    setActing(null)
  }

  const filtered = restaurants.filter(r =>
    !query ||
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    (r.slug ?? '').toLowerCase().includes(query.toLowerCase())
  )

  const tabCounts = { active: 0, suspended: 0, deleted: 0 }

  return (
    <div className="p-6 max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900">Restaurants</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{filtered.length} shown</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or slug…"
            className="text-xs pl-7 pr-3 py-1.5 border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary/40 w-56"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {(['active', 'suspended', 'deleted'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setQuery('') }}
            className={`px-3 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 px-6 text-center">
            <p className="text-xs text-red-500 font-medium">Failed to load restaurants</p>
            <p className="text-[11px] text-zinc-400">{error}</p>
            <p className="text-[11px] text-zinc-400">Run migration 023_soft_delete_restaurants.sql if missing columns</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-zinc-400">
            {query ? 'No results' : `No ${tab} restaurants`}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Restaurant</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Plan</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Subscription</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Status</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Last booking</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">
                  {tab === 'deleted' ? 'Deleted' : 'Joined'}
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(r => {
                const sub   = SUB_STATUS[r.subscription_status] ?? SUB_STATUS.trialing
                const pDays = r.purge_after ? daysUntil(r.purge_after) : null
                return (
                  <tr key={r.id} className={`hover:bg-zinc-50 transition-colors ${r.deleted_at ? 'opacity-70' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{r.name}</p>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        {r.slug ? `/book/${r.slug}` : '—'}
                        {!r.setup_completed && !r.deleted_at && (
                          <span className="ml-2 text-amber-500">· setup incomplete</span>
                        )}
                        {r.deleted_reason && (
                          <span className="ml-2 text-red-400">· {r.deleted_reason}</span>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-zinc-700 font-medium">{r.subscription_plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${sub.className}`}>
                        {sub.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.deleted_at ? (
                        <span className="inline-flex items-center gap-1 text-red-500">
                          <Trash2 className="w-3 h-3" /> Deleted
                        </span>
                      ) : r.owner_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500">
                          <XCircle className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {r.last_reservation
                        ? new Date(r.last_reservation).toLocaleDateString('en-GB')
                        : <span className="flex items-center gap-1"><Clock className="w-3 h-3" />None</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {r.deleted_at ? (
                        <div>
                          <p>{new Date(r.deleted_at).toLocaleDateString('en-GB')}</p>
                          {pDays !== null && (
                            <p className={`text-[11px] mt-0.5 ${pDays <= 14 ? 'text-red-400 font-medium' : 'text-zinc-400'}`}>
                              {pDays > 0 ? `Purge in ${pDays}d` : 'Purge overdue'}
                            </p>
                          )}
                        </div>
                      ) : (
                        new Date(r.created_at).toLocaleDateString('en-GB')
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.deleted_at ? (
                          <button
                            onClick={() => reactivate(r.id)}
                            disabled={acting === r.id}
                            title="Reactivate restaurant"
                            className="text-[11px] font-medium px-2.5 py-1 rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {acting === r.id ? '…' : 'Reactivate'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => toggleActive(r.id, r.owner_active)}
                              disabled={acting === r.id}
                              className={`text-[11px] font-medium px-2.5 py-1 rounded border transition-colors disabled:opacity-50 ${
                                r.owner_active
                                  ? 'border-red-200 text-red-500 hover:bg-red-50'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {acting === r.id ? '…' : r.owner_active ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => { setDeleteTarget(r); setDeleteReason('') }}
                              disabled={acting === r.id}
                              title="Delete restaurant (data kept 90 days)"
                              className="text-[11px] font-medium px-2 py-1 rounded border border-zinc-200 text-zinc-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        <Link href={`/admin/restaurants/${r.id}`}>
                          <ChevronRight className="w-4 h-4 text-zinc-300 hover:text-zinc-600 transition-colors" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Delete restaurant?</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  <span className="font-medium text-zinc-700">{deleteTarget.name}</span> will be deactivated immediately.
                  All data is retained for <span className="font-medium">90 days</span> and can be reactivated during that window.
                  After 90 days the data is permanently deleted.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Reason (optional)</label>
              <input
                type="text"
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="e.g. fraud, payment issue, duplicate account…"
                className="w-full text-xs border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-300"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 text-xs font-medium py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => softDelete(deleteTarget)}
                className="flex-1 text-xs font-medium py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
