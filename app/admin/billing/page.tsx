'use client'

import { useEffect, useState } from 'react'
import { Zap, CreditCard, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'

interface Restaurant {
  id:                  string
  name:                string
  subscription_plan:   string
  subscription_status: string
  subscribed_until:    string | null
  owner_active:        boolean
}

interface Stats {
  estimated_mrr: number
  total_restaurants: number
  plans: { plan_tier: string; count: number }[]
}

const SUB_STATUS: Record<string, { label: string; className: string }> = {
  trialing:  { label: 'Trial',     className: 'text-blue-600 bg-blue-50' },
  active:    { label: 'Active',    className: 'text-emerald-600 bg-emerald-50' },
  past_due:  { label: 'Past due',  className: 'text-amber-600 bg-amber-50' },
  cancelled: { label: 'Cancelled', className: 'text-red-500 bg-red-50' },
  paused:    { label: 'Paused',    className: 'text-zinc-500 bg-zinc-100' },
}

const PRICES: Record<string, number> = { starter: 29, pro: 59, growth: 89 }

export default function AdminBillingPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [stats,       setStats]       = useState<Stats | null>(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/restaurants').then(r => r.json()),
      fetch('/api/admin/stats').then(r => r.json()),
    ]).then(([rData, sData]) => {
      setRestaurants(rData.restaurants ?? [])
      setStats(sData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const mrr = stats?.estimated_mrr ?? 0

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-sm font-semibold text-zinc-900">Billing</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Subscription status across all restaurant accounts</p>
      </div>

      {/* Stripe notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-xs text-amber-800">
          Stripe integration is Phase 3. All accounts are on free beta access.
          Billing starts only after payment methods are configured per restaurant.
        </p>
      </div>

      {!loading && (
        <>
          {/* MRR + plan summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <p className="text-xs text-zinc-500 mb-1">Estimated MRR (when Stripe goes live)</p>
              <p className="text-3xl font-bold text-zinc-900">€{mrr.toLocaleString('de-DE')}</p>
              <p className="text-xs text-zinc-400 mt-1">{stats?.total_restaurants ?? 0} restaurants · based on plan distribution</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <p className="text-xs font-semibold text-zinc-700 mb-3">By plan</p>
              <div className="space-y-2">
                {(['starter', 'pro', 'growth'] as const).map(tier => {
                  const count = stats?.plans?.find(p => p.plan_tier === tier)?.count ?? 0
                  return (
                    <div key={tier} className="flex items-center justify-between text-xs">
                      <span className="capitalize text-zinc-700 font-medium">{tier}</span>
                      <span className="text-zinc-400">{count} × €{PRICES[tier]} = <span className="text-zinc-700 font-semibold">€{(count * PRICES[tier]).toLocaleString('de-DE')}</span></span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Per-restaurant table */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <p className="text-xs font-semibold text-zinc-500 px-4 py-3 border-b border-zinc-100 uppercase tracking-wider">
              Per-restaurant subscriptions
            </p>
            {restaurants.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-xs text-zinc-400">No restaurants yet</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Restaurant</th>
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Plan</th>
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Status</th>
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Valid until</th>
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Monthly value</th>
                    <th className="text-left px-4 py-2.5 text-zinc-500 font-semibold">Account</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {restaurants.map(r => {
                    const sub = SUB_STATUS[r.subscription_status] ?? SUB_STATUS.trialing
                    return (
                      <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-zinc-900">{r.name}</td>
                        <td className="px-4 py-3 capitalize text-zinc-700">{r.subscription_plan}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${sub.className}`}>
                            {sub.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {r.subscribed_until
                            ? new Date(r.subscribed_until).toLocaleDateString('en-GB')
                            : <span className="flex items-center gap-1"><Clock className="w-3 h-3" />—</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-zinc-700 font-medium">
                          €{PRICES[r.subscription_plan] ?? 59}
                        </td>
                        <td className="px-4 py-3">
                          {r.owner_active
                            ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />Active</span>
                            : <span className="text-red-500">Suspended</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/restaurants/${r.id}`}
                            className="text-[11px] text-brand-primary hover:underline"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Next steps */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5 flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-zinc-900 mb-1">Phase 3: Stripe integration</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Connect Stripe, activate subscription plans, and route billing through the
                /api/billing/checkout and /api/billing/webhook endpoints.
                Live subscription dates and Stripe customer IDs will populate this table automatically.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
