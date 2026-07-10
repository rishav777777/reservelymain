'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, XCircle, ExternalLink, CreditCard, User, MapPin, Trash2, RotateCcw, AlertTriangle, Building2, KeyRound, LogIn } from 'lucide-react'
import Link from 'next/link'

interface RestaurantDetail {
  id:                  string
  name:                string
  slug:                string | null
  email:               string | null
  phone:               string | null
  address:             string | null
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
  deleted_at:          string | null
  deleted_reason:      string | null
  purge_after:         string | null
  owner_active:        boolean
  owner_name:          string | null
  owner_email:         string | null
  staff_count:         number
  reservation_count:   number
  last_reservation:    string | null
}

const SUB_STATUS: Record<string, { label: string; className: string }> = {
  trialing:  { label: 'Trial',     className: 'text-blue-600 bg-blue-50'      },
  active:    { label: 'Active',    className: 'text-emerald-600 bg-emerald-50' },
  past_due:  { label: 'Past due',  className: 'text-amber-600 bg-amber-50'    },
  cancelled: { label: 'Cancelled', className: 'text-red-500 bg-red-50'        },
  paused:    { label: 'Paused',    className: 'text-zinc-500 bg-zinc-100'     },
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex px-4 py-2.5 items-start">
      <dt className="text-xs text-zinc-400 w-44 shrink-0 pt-px">{label}</dt>
      <dd className="text-xs text-zinc-800 font-medium break-all">{value ?? '—'}</dd>
    </div>
  )
}

export default function AdminRestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id     = params.id as string

  const [data,         setData]         = useState<RestaurantDetail | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [acting,          setActing]          = useState(false)
  const [togglingBook,    setTogglingBook]    = useState(false)
  const [showDelete,      setShowDelete]      = useState(false)
  const [deleteReason,    setDeleteReason]    = useState('')
  const [resetSent,       setResetSent]       = useState(false)
  const [showImpersonate, setShowImpersonate] = useState(false)
  const [impReason,       setImpReason]       = useState('')
  const [impersonating,   setImpersonating]   = useState(false)

  function load() {
    fetch(`/api/admin/restaurants/${id}`)
      .then(r => r.json())
      .then(d => { setData(d.restaurant); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

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

  async function softDelete() {
    setActing(true)
    setShowDelete(false)
    await fetch(`/api/admin/restaurants/${id}`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason: deleteReason || null }),
    })
    setDeleteReason('')
    load()
    setActing(false)
  }

  async function reactivate() {
    setActing(true)
    await fetch(`/api/admin/restaurants/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reactivate: true }),
    })
    load()
    setActing(false)
  }

  async function impersonate() {
    if (!data?.owner_email || !impReason.trim()) return
    setImpersonating(true)
    setShowImpersonate(false)
    const res = await fetch('/api/admin/impersonate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: data.owner_email, reason: impReason.trim() }),
    })
    const json = await res.json()
    setImpersonating(false)
    setImpReason('')
    if (json.url) window.open(json.url, '_blank')
    else alert(json.error ?? 'Failed to generate link')
  }

  async function toggleBooking() {
    if (!data) return
    setTogglingBook(true)
    await fetch(`/api/admin/restaurants/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ booking_enabled: !data.booking_enabled }),
    })
    setData(prev => prev ? { ...prev, booking_enabled: !prev.booking_enabled } : prev)
    setTogglingBook(false)
  }

  async function sendPasswordReset() {
    if (!data?.owner_email) return
    setActing(true)
    await fetch('/api/auth/reset-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: data.owner_email }),
    })
    setResetSent(true)
    setActing(false)
    setTimeout(() => setResetSent(false), 4000)
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

  const sub    = SUB_STATUS[data.subscription_status] ?? SUB_STATUS.trialing
  const pDays  = data.purge_after ? daysUntil(data.purge_after) : null
  const isDeleted = !!data.deleted_at

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-5">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link href="/admin/restaurants" className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-zinc-900 truncate">{data.name}</h1>
          <p className="text-xs text-zinc-400">Restaurant detail</p>
        </div>
        {isDeleted && (
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600">
            Deleted
          </span>
        )}
      </div>

      {/* Deletion notice */}
      {isDeleted && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-red-700">
            Deleted on {fmt(data.deleted_at)}
            {data.deleted_reason && ` · ${data.deleted_reason}`}
          </p>
          <p className={`text-xs ${pDays !== null && pDays <= 14 ? 'text-red-600 font-semibold' : 'text-red-500'}`}>
            {pDays !== null
              ? pDays > 0 ? `Data purged in ${pDays} days (${fmt(data.purge_after)})` : 'Purge overdue'
              : ''}
          </p>
        </div>
      )}

      {/* Status bar + actions */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {isDeleted
            ? <Trash2 className="w-4 h-4 text-red-400" />
            : data.owner_active
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              : <XCircle      className="w-4 h-4 text-red-500" />
          }
          <p className="text-xs font-medium text-zinc-900">
            {isDeleted ? 'Account deleted' : data.owner_active ? 'Account active' : 'Account suspended'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {data.slug && (
            <a
              href={`/book/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-brand-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Booking page
            </a>
          )}
          {isDeleted ? (
            <button
              onClick={reactivate}
              disabled={acting}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              {acting ? '…' : 'Reactivate'}
            </button>
          ) : (
            <>
              <button
                onClick={toggleActive}
                disabled={acting}
                className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors disabled:opacity-50 ${
                  data.owner_active
                    ? 'border-red-200 text-red-500 hover:bg-red-50'
                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {acting ? '…' : data.owner_active ? 'Suspend' : 'Activate'}
              </button>
              <button
                onClick={() => { setShowDelete(true); setDeleteReason('') }}
                disabled={acting}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-zinc-200 text-zinc-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Owner / contact */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
          <User className="w-3.5 h-3.5 text-zinc-400" />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Owner / Contact</p>
        </div>
        <dl className="divide-y divide-zinc-100">
          <Row label="Name"  value={data.owner_name} />
          <Row label="Email" value={
            data.owner_email
              ? <a href={`mailto:${data.owner_email}`} className="text-brand-primary hover:underline">{data.owner_email}</a>
              : null
          } />
          <Row label="Password" value={
            data.owner_email ? (
              <button
                onClick={sendPasswordReset}
                disabled={acting || !data.owner_email}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-brand-primary transition-colors disabled:opacity-50"
              >
                <KeyRound className="w-3 h-3" />
                {resetSent ? 'Reset email sent' : 'Send password reset email'}
              </button>
            ) : null
          } />
          <Row label="Impersonate" value={
            data.owner_email ? (
              <button
                onClick={() => { setImpReason(''); setShowImpersonate(true) }}
                disabled={impersonating || !data.owner_email}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-amber-600 transition-colors disabled:opacity-50"
              >
                <LogIn className="w-3 h-3" />
                {impersonating ? 'Generating link…' : 'Log in as this user'}
              </button>
            ) : null
          } />
        </dl>
      </div>

      {/* Restaurant info */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Restaurant Info</p>
        </div>
        <dl className="divide-y divide-zinc-100">
          <Row label="Restaurant email" value={
            data.email
              ? <a href={`mailto:${data.email}`} className="text-brand-primary hover:underline">{data.email}</a>
              : null
          } />
          <Row label="Phone"   value={data.phone} />
          <Row label="Address" value={data.address} />
          <Row label="Timezone"       value={data.timezone} />
          <Row label="Max party size" value={data.max_party_size ? String(data.max_party_size) : null} />
          <Row label="Booking enabled" value={
            <button
              onClick={toggleBooking}
              disabled={togglingBook || isDeleted}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                data.booking_enabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
              }`}
            >
              {togglingBook ? '…' : data.booking_enabled ? '✓ Enabled — click to disable' : '✗ Disabled — click to enable'}
            </button>
          } />
          <Row label="Setup complete"  value={data.setup_completed ? 'Yes' : 'No'} />
        </dl>
      </div>

      {/* Usage */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Usage</p>
        </div>
        <dl className="divide-y divide-zinc-100">
          <Row label="Staff accounts"      value={String(data.staff_count)} />
          <Row label="Total reservations"  value={String(data.reservation_count)} />
          <Row label="Last reservation"    value={fmt(data.last_reservation)} />
          <Row label="Joined"              value={fmt(data.created_at)} />
          <Row label="ID"                  value={<span className="font-mono text-[11px] text-zinc-500">{data.id}</span>} />
          <Row label="Slug"                value={data.slug} />
        </dl>
      </div>

      {/* Subscription */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
          <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Subscription</p>
        </div>
        <dl className="divide-y divide-zinc-100">
          <Row label="Plan"   value={<span className="capitalize font-medium">{data.subscription_plan}</span>} />
          <Row label="Status" value={<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${sub.className}`}>{sub.label}</span>} />
          <Row label="Subscribed until" value={fmt(data.subscribed_until)} />
          <Row label="Trial ends"       value={fmt(data.trial_ends_at)} />
          <Row label="Stripe customer"  value={
            data.stripe_customer_id
              ? <span className="font-mono text-[11px] text-zinc-600">{data.stripe_customer_id}</span>
              : <span className="text-zinc-400 font-normal">Not connected</span>
          } />
        </dl>
      </div>

      {/* Impersonation reason modal (GDPR: reason is mandatory before access) */}
      {showImpersonate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <LogIn className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Log in as {data.owner_name ?? data.owner_email}</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Required by GDPR. Your admin ID, this reason, and the timestamp are permanently recorded.
                  A banner will warn you that all actions are audited.
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700">Reason for access <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={impReason}
                onChange={e => setImpReason(e.target.value)}
                placeholder="e.g. Support ticket #1204 — user can't access dashboard"
                className="w-full text-xs border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowImpersonate(false); setImpReason('') }}
                className="flex-1 text-xs font-medium py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={impersonate}
                disabled={!impReason.trim()}
                className="flex-1 text-xs font-medium py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-40"
              >
                Confirm & open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Delete restaurant?</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  <span className="font-medium text-zinc-700">{data.name}</span> will be deactivated immediately.
                  Data is retained for <span className="font-medium">90 days</span> and can be reactivated. After that it is permanently deleted.
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Reason (optional)</label>
              <input
                type="text"
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="e.g. fraud, duplicate account…"
                className="w-full text-xs border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-300"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 text-xs font-medium py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={softDelete}
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
