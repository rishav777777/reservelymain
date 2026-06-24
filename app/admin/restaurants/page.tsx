'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react'

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
}

const SUB_STATUS: Record<string, { label: string; className: string }> = {
  trialing:  { label: 'Trial',    className: 'text-blue-600 bg-blue-50' },
  active:    { label: 'Active',   className: 'text-emerald-600 bg-emerald-50' },
  past_due:  { label: 'Past due', className: 'text-amber-600 bg-amber-50' },
  cancelled: { label: 'Cancelled', className: 'text-red-500 bg-red-50' },
  paused:    { label: 'Paused',   className: 'text-zinc-500 bg-zinc-100' },
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading]         = useState(true)
  const [error,   setError]           = useState<string | null>(null)
  const [query,   setQuery]           = useState('')
  const [acting,  setActing]          = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/restaurants')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setRestaurants(d.restaurants ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function toggleActive(id: string, currentlyActive: boolean) {
    setActing(id)
    await fetch(`/api/admin/restaurants/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ owner_active: !currentlyActive }),
    })
    setRestaurants(prev =>
      prev.map(r => r.id === id ? { ...r, owner_active: !currentlyActive } : r)
    )
    setActing(null)
  }

  const filtered = restaurants.filter(r =>
    !query ||
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    (r.slug ?? '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-zinc-900">Restaurants</h1>
          <p className="text-xs text-zinc-400 mt-0.5">{restaurants.length} total accounts</p>
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

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 px-6 text-center">
            <p className="text-xs text-red-500 font-medium">Failed to load restaurants</p>
            <p className="text-[11px] text-zinc-400">{error}</p>
            <p className="text-[11px] text-zinc-400">Run migration 017_stripe_columns.sql in Supabase SQL editor</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-zinc-400">
            {query ? 'No results' : 'No restaurants yet'}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Restaurant</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Plan</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Subscription</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Account</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Last booking</th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Joined</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(r => {
                const sub = SUB_STATUS[r.subscription_status] ?? SUB_STATUS.trialing
                return (
                  <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{r.name}</p>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        {r.slug ? `/book/${r.slug}` : '—'}
                        {!r.setup_completed && (
                          <span className="ml-2 text-amber-500">· setup incomplete</span>
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
                      {r.owner_active ? (
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
                        : <span className="flex items-center gap-1"><Clock className="w-3 h-3" />None yet</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(r.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
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
    </div>
  )
}
