'use client'

import { useEffect, useState } from 'react'
import { Building2, Calendar, FileText, TrendingUp, Activity, CheckCircle2, Euro, UserCheck, Zap } from 'lucide-react'

interface Stats {
  total_restaurants:     number
  active_restaurants:    number
  suspended_restaurants: number
  setup_completion_rate: number
  new_this_month:        number
  deleted_this_month:    number
  reservations_today:    number
  reservations_total:    number
  pending_demo_requests: number
  estimated_mrr:         number
  trialing_count:        number
  active_paying_count:   number
  trial_conversion_rate: number | null
  plans: { plan_tier: string; count: number }[]
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-zinc-400',
  pro:     'bg-brand-primary',
  growth:  'bg-emerald-500',
}

export default function AdminOverviewPage() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const total = stats?.total_restaurants ?? 1

  const convRate = stats?.trial_conversion_rate
  const statCards = [
    {
      label:   'Total restaurants',
      value:   stats?.total_restaurants ?? 0,
      sub:     `${stats?.active_restaurants ?? 0} active · ${stats?.suspended_restaurants ?? 0} suspended`,
      icon:    Building2,
      color:   'text-brand-primary bg-brand-primary/10',
      alert:   false,
    },
    {
      label:   'Reservations today',
      value:   stats?.reservations_today ?? 0,
      sub:     `${(stats?.reservations_total ?? 0).toLocaleString()} all-time`,
      icon:    Calendar,
      color:   'text-blue-600 bg-blue-50',
      alert:   false,
    },
    {
      label:   'Trial → paid conversion',
      value:   convRate !== null && convRate !== undefined ? `${convRate}%` : '—',
      sub:     `${stats?.active_paying_count ?? 0} paying · ${stats?.trialing_count ?? 0} trialing`,
      icon:    UserCheck,
      color:   (convRate ?? 0) >= 50 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-500 bg-amber-50',
      alert:   false,
    },
    {
      label:   'Est. MRR',
      value:   `€${(stats?.estimated_mrr ?? 0).toLocaleString('de-DE')}`,
      sub:     'When Stripe goes live',
      icon:    Euro,
      color:   'text-emerald-600 bg-emerald-50',
      alert:   false,
    },
  ]

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-sm font-semibold text-zinc-900">Platform Overview</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Real-time stats across all restaurant accounts</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, alert }) => (
          <div key={label} className={`bg-white border rounded-lg p-4 ${alert ? 'border-amber-200' : 'border-zinc-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-zinc-500">{label}</p>
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-zinc-900 mb-0.5">{value}</p>
            <p className="text-xs text-zinc-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Plan breakdown */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-zinc-700 mb-4">Plan distribution</p>
          <div className="space-y-3">
            {(['starter', 'pro', 'growth'] as const).map(tier => {
              const count = stats?.plans?.find(p => p.plan_tier === tier)?.count ?? 0
              const pct   = Math.round((count / total) * 100) || 0
              return (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-zinc-600 capitalize">{tier}</p>
                    <p className="text-xs text-zinc-400">{count} ({pct}%)</p>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${PLAN_COLORS[tier]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Health indicators */}
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <p className="text-xs font-semibold text-zinc-700 mb-4">Platform health</p>
          <div className="space-y-3">
            {[
              {
                label: 'Setup completion',
                value: `${stats?.setup_completion_rate ?? 0}%`,
                good:  (stats?.setup_completion_rate ?? 0) >= 70,
              },
              {
                label: 'Active accounts',
                value: total > 0 ? `${Math.round(((stats?.active_restaurants ?? 0) / total) * 100)}%` : '—',
                good:  (stats?.active_restaurants ?? 0) / (total || 1) >= 0.9,
              },
              {
                label: 'Trial conversion',
                value: convRate !== null && convRate !== undefined ? `${convRate}%` : '—',
                good:  (convRate ?? 0) >= 50,
              },
              {
                label: 'Pending demos',
                value: String(stats?.pending_demo_requests ?? 0),
                good:  (stats?.pending_demo_requests ?? 0) === 0,
              },
            ].map(({ label, value, good }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${good ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <p className="text-xs text-zinc-600">{label}</p>
                </div>
                <p className={`text-xs font-semibold ${good ? 'text-emerald-600' : 'text-amber-600'}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth + activity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900">
              +{stats?.new_this_month ?? 0} new · -{stats?.deleted_this_month ?? 0} deleted this month
            </p>
            <p className="text-xs text-zinc-400">
              {new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-5 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900">
              {(stats?.reservations_total ?? 0).toLocaleString()} total · {stats?.reservations_today ?? 0} today
            </p>
            <p className="text-xs text-zinc-400">Reservations across all accounts</p>
          </div>
        </div>
      </div>

      {/* Pending demos alert */}
      {(stats?.pending_demo_requests ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800">
              {stats?.pending_demo_requests} demo request{(stats?.pending_demo_requests ?? 0) === 1 ? '' : 's'} awaiting review
            </p>
            <p className="text-xs text-amber-600">Respond promptly to convert leads</p>
          </div>
          <a href="/admin/demo-requests" className="text-xs font-medium text-amber-700 hover:underline shrink-0">
            View →
          </a>
        </div>
      )}
    </div>
  )
}
