'use client'

import { useEffect, useState } from 'react'
import { CreditCard, CheckCircle2, Clock } from 'lucide-react'
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

      {/* Paddle notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <p className="text-xs text-emerald-800">
          Paddle billing is wired up. Webhook at <code className="font-mono bg-emerald-100 px-1 rounded">/api/billing/webhook</code> handles
          checkout, renewal, payment failure, trial activation, and cancellation.
          Subscription data here is live — populated automatically via Paddle events.
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

          {/* Paddle setup checklist */}
          <div className="bg-white border border-zinc-200 rounded-lg p-5 flex items-start gap-3">
            <CreditCard className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-900">Paddle setup checklist (manual steps)</p>
              <ol className="text-xs text-zinc-500 space-y-1 list-decimal pl-4">
                <li>Set <code className="font-mono bg-zinc-100 px-1 rounded">PADDLE_API_KEY</code> in Vercel environment variables</li>
                <li>Set <code className="font-mono bg-zinc-100 px-1 rounded">PADDLE_WEBHOOK_SECRET</code> from Paddle dashboard → Notifications</li>
                <li>Set <code className="font-mono bg-zinc-100 px-1 rounded">PADDLE_PRICE_STARTER</code>, <code className="font-mono bg-zinc-100 px-1 rounded">PADDLE_PRICE_PRO</code>, <code className="font-mono bg-zinc-100 px-1 rounded">PADDLE_PRICE_GROWTH</code> with your Paddle price IDs</li>
                <li>Register webhook URL in Paddle dashboard: <code className="font-mono bg-zinc-100 px-1 rounded">https://yourdomain.com/api/billing/webhook</code></li>
                <li>Subscribe to events: <em>transaction.completed, transaction.payment_succeeded, transaction.payment_failed, subscription.activated, subscription.updated, subscription.cancelled</em></li>
              </ol>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
