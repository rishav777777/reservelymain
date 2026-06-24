'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, XCircle, ExternalLink, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface RestaurantDetail {
  id:                  string
  name:                string
  slug:                string | null
  subscription_status: string
  subscription_plan:   string
  subscribed_until:    string | null
  trial_ends_at:       string | null
  stripe_customer_id:  string | null
  booking_enabled:     boolean
  setup_completed:     boolean
  timezone:            string | null
  max_party_size:      number | null
  created_at:          string
  owner_active:        boolean
  staff_count:         number
  reservation_count:   number
  last_reservation:    string | null
}

const SUB_STATUS: Record<string, { label: string; className: string }> = {
  trialing:  { label: 'Trial',     className: 'text-blue-600 bg-blue-50' },
  active:    { label: 'Active',    className: 'text-emerald-600 bg-emerald-50' },
  past_due:  { label: 'Past due',  className: 'text-amber-600 bg-amber-50' },
  cancelled: { label: 'Cancelled', className: 'text-red-500 bg-red-50' },
  paused:    { label: 'Paused',    className: 'text-zinc-500 bg-zinc-100' },
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminRestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id     = params.id as string

  const [data,    setData]    = useState<RestaurantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting,  setActing]  = useState(false)

  useEffect(() => {
    fetch(`/api/admin/restaurants/${id}`)
      .then(r => r.json())
      .then(d => { setData(d.restaurant); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function toggleActive() {
    if (!data) return
    setActing(true)
    await fetch(`/api/admin/restaurants/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ owner_active: !data.owner_active }),
    })
    setData(prev => prev ? { ...prev, owner_active: !prev.owner_active } : prev)
    setActing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-sm text-zinc-500">Restaurant not found.</p>
        <button onClick={() => router.back()} className="text-xs text-brand-primary mt-2 hover:underline">← Back</button>
      </div>
    )
  }

  const sub = SUB_STATUS[data.subscription_status] ?? SUB_STATUS.trialing

  const accountRows: [string, string][] = [
    ['ID',                data.id],
    ['Slug',              data.slug ?? '—'],
    ['Timezone',          data.timezone ?? '—'],
    ['Max party size',    String(data.max_party_size ?? '—')],
    ['Setup complete',    data.setup_completed ? 'Yes' : 'No'],
    ['Booking enabled',   data.booking_enabled ? 'Yes' : 'No'],
    ['Staff accounts',    String(data.staff_count)],
    ['Total reservations',String(data.reservation_count)],
    ['Last reservation',  fmt(data.last_reservation)],
    ['Joined',            fmt(data.created_at)],
  ]

  const billingRows: [string, React.ReactNode][] = [
    ['Plan',           <span className="capitalize font-medium text-zinc-900">{data.subscription_plan}</span>],
    ['Status',         <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${sub.className}`}>{sub.label}</span>],
    ['Subscribed until', fmt(data.subscribed_until)],
    ['Trial ends',     fmt(data.trial_ends_at)],
    ['Stripe customer', data.stripe_customer_id
        ? <span className="font-mono text-[11px] text-zinc-600">{data.stripe_customer_id}</span>
        : <span className="text-zinc-400">Not connected</span>
    ],
  ]

  return (
    <div className="p-6 max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/restaurants" className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-zinc-900">{data.name}</h1>
          <p className="text-xs text-zinc-400">Restaurant detail</p>
        </div>
      </div>

      {/* Status + actions */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data.owner_active
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            : <XCircle     className="w-4 h-4 text-red-500" />
          }
          <p className="text-xs font-medium text-zinc-900">
            {data.owner_active ? 'Account active' : 'Account suspended'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data.slug && (
            <a
              href={`/book/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-brand-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Booking page
            </a>
          )}
          <button
            onClick={toggleActive}
            disabled={acting}
            className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors disabled:opacity-50 ${
              data.owner_active
                ? 'border-red-200 text-red-500 hover:bg-red-50'
                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {acting ? '…' : data.owner_active ? 'Suspend account' : 'Reactivate account'}
          </button>
        </div>
      </div>

      {/* Billing */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
          <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Subscription</p>
        </div>
        <dl className="divide-y divide-zinc-100">
          {billingRows.map(([label, value]) => (
            <div key={label} className="flex px-4 py-2.5 items-center">
              <dt className="text-xs text-zinc-400 w-40 shrink-0">{label}</dt>
              <dd className="text-xs text-zinc-800">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Account details */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <p className="text-xs font-semibold text-zinc-500 px-4 py-3 border-b border-zinc-100 uppercase tracking-wider">
          Account details
        </p>
        <dl className="divide-y divide-zinc-100">
          {accountRows.map(([label, value]) => (
            <div key={label} className="flex px-4 py-2.5">
              <dt className="text-xs text-zinc-400 w-40 shrink-0">{label}</dt>
              <dd className="text-xs text-zinc-800 font-medium break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
