'use client'

import { useState, useEffect } from 'react'
import { Check, Zap, ChevronRight, Loader2, AlertTriangle, CreditCard, X } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'
import { ReferralWidget } from '@/components/dashboard/ReferralWidget'

type Tier = {
  id: string; name: string; price: number; tagline: string
  features: readonly string[]; popular?: boolean
}
type Addon = {
  id: string; name: string; price: number; desc: string
  tag?: string; perUnit?: string
}
type SubStatus = {
  status: string
  plan: string
  stripe_customer_id: string | null
  trial_ends_at: string | null
  subscribed_until: string | null
}

async function startCheckout(planId: string): Promise<void> {
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan: planId }),
  })
  const json = await res.json() as { url?: string; error?: string }
  if (json.url) { window.location.href = json.url; return }
  throw new Error(json.error ?? 'Checkout failed')
}

async function openPortal(): Promise<void> {
  const res = await fetch('/api/billing/portal', { method: 'POST' })
  const json = await res.json() as { url?: string; error?: string }
  if (json.url) { window.location.href = json.url; return }
  throw new Error(json.error ?? 'Could not open billing portal')
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    trialing: 'bg-amber-50 text-amber-700 border-amber-200',
    active:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    past_due: 'bg-red-50 text-red-700 border-red-200',
    canceled: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    paused:   'bg-zinc-100 text-zinc-500 border-zinc-200',
  }
  const label: Record<string, string> = {
    trialing: 'Trial',
    active:   'Active',
    past_due: 'Past due',
    canceled: 'Canceled',
    paused:   'Paused',
  }
  const cls = map[status] ?? 'bg-zinc-100 text-zinc-500 border-zinc-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      {label[status] ?? status}
    </span>
  )
}

// Two-step cancellation modal (EU right of withdrawal compliance)
function CancelModal({ onClose, onConfirm, loading }: {
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const [step, setStep] = useState(1)

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <p className="text-sm font-semibold text-zinc-900">
            {step === 1 ? 'Cancel subscription' : 'Are you absolutely sure?'}
          </p>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>

        {step === 1 && (
          <div className="px-5 py-5 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex gap-3">
              <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 space-y-1">
                <p className="font-semibold">Before you cancel, please note:</p>
                <ul className="list-disc pl-3 space-y-1">
                  <li>Your account will remain active until the end of the current billing period.</li>
                  <li>All your reservations and guest data will still be accessible until then.</li>
                  <li>After cancellation, your data will be retained for 30 days then deleted.</li>
                  <li>You can resubscribe at any time to restore access.</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Under EU consumer law you have a <strong>14-day right of withdrawal</strong> from your
              subscription start date. If you subscribed within the last 14 days and have not used the
              service, you may be entitled to a full refund — contact us at{' '}
              <a href="mailto:support@reservely.app" className="underline text-zinc-700">
                support@reservely.app
              </a>.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 text-xs py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Keep subscription
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 text-xs py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                Continue to cancel
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="px-5 py-5 space-y-4">
            <p className="text-xs text-zinc-600">
              You are about to open the billing portal to cancel your subscription. This action will
              schedule your subscription to end at the next renewal date.
            </p>
            <p className="text-xs font-semibold text-zinc-800">
              Click "Cancel my subscription" below to proceed.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 text-xs py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Go back
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {loading && <Loader2 size={11} className="animate-spin" />}
                Cancel my subscription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BillingPage() {
  const { lang } = useLang()
  const tx = dashboardT[lang].billing
  const tiers      = tx.tiers     as readonly Tier[]
  const addonsData = tx.addonsData as readonly Addon[]

  const [loading, setLoading]       = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [subStatus, setSubStatus]   = useState<SubStatus | null>(null)
  const [subLoading, setSubLoading] = useState(true)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    fetch('/api/billing/status')
      .then(r => r.json() as Promise<SubStatus>)
      .then(data => setSubStatus(data))
      .catch(() => {})
      .finally(() => setSubLoading(false))
  }, [])

  async function handleCheckout(planId: string) {
    setLoading(planId)
    setError(null)
    try { await startCheckout(planId) }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); setLoading(null) }
  }

  async function handleCancel() {
    setCancelLoading(true)
    try { await openPortal() }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not open billing portal'); setShowCancel(false) }
    finally { setCancelLoading(false) }
  }

  const isPaying = subStatus?.status === 'active' || subStatus?.status === 'past_due'
  const isTrialing = subStatus?.status === 'trialing'

  return (
    <div className="p-5 max-w-4xl space-y-8">
      <div>
        <h1 className="text-sm font-semibold text-zinc-900">{tx.title}</h1>
        <p className="text-xs text-zinc-400 mt-0.5">{tx.subtitle}</p>
      </div>

      {/* Current subscription status */}
      {!subLoading && subStatus && (
        <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-zinc-400" />
              <p className="text-xs font-semibold text-zinc-800">Current subscription</p>
            </div>
            <StatusBadge status={subStatus.status} />
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-zinc-500">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">Plan</p>
              <p className="font-medium text-zinc-700 capitalize">{subStatus.plan}</p>
            </div>
            {isTrialing && subStatus.trial_ends_at && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">Trial ends</p>
                <p className="font-medium text-zinc-700">{formatDate(subStatus.trial_ends_at)}</p>
              </div>
            )}
            {isPaying && subStatus.subscribed_until && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">Next renewal</p>
                <p className="font-medium text-zinc-700">{formatDate(subStatus.subscribed_until)}</p>
              </div>
            )}
          </div>
          {isPaying && (
            <div className="pt-1 border-t border-zinc-100">
              <button
                onClick={() => setShowCancel(true)}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Cancel subscription
              </button>
              <span className="mx-2 text-zinc-200">·</span>
              <button
                onClick={() => { openPortal().catch(e => setError(e instanceof Error ? e.message : 'Error')) }}
                className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                Manage billing &amp; invoices
              </button>
            </div>
          )}
          {isTrialing && (
            <p className="text-[10px] text-zinc-400">
              14-day right of withdrawal applies from your trial conversion date.
            </p>
          )}
        </div>
      )}

      {/* Trial notice (shown when no active paid plan) */}
      {!isPaying && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <Zap size={14} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">{tx.trialTitle}</p>
            <p className="text-xs text-amber-600 mt-0.5">{tx.trialDesc}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Plan tiers */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{tx.plans}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-lg border p-5 flex flex-col gap-4 ${
                tier.popular
                  ? 'border-brand-primary shadow-sm ring-1 ring-brand-primary/20'
                  : 'border-zinc-200 bg-white'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {tx.mostPopular}
                  </span>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{tier.name}</p>
                <div className="flex items-end gap-1 mt-1.5">
                  <span className="text-2xl font-bold text-zinc-900">€{tier.price}</span>
                  <span className="text-xs text-zinc-400 mb-1">{tx.perMonth}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{tier.tagline}</p>
              </div>

              <ul className="space-y-1.5 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-zinc-700">
                    <Check size={11} className="text-emerald-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {tier.price === 0 ? (
                <button
                  className="w-full text-xs font-medium py-2 rounded-md border border-zinc-200 bg-zinc-50 text-zinc-500 cursor-default"
                  disabled
                >
                  Current plan
                </button>
              ) : (
                <button
                  onClick={() => { handleCheckout(tier.id).catch(() => {}) }}
                  disabled={loading === tier.id}
                  className={`w-full text-xs font-medium py-2 rounded-md border transition-colors flex items-center justify-center gap-1.5 ${
                    tier.popular
                      ? 'bg-brand-primary text-white border-brand-primary hover:opacity-90'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loading === tier.id && <Loader2 size={11} className="animate-spin" />}
                  {tx.choosePlan}
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 mt-3 text-center">
          {tx.noFees}
        </p>
        <p className="text-[10px] text-zinc-400 mt-1 text-center">
          By subscribing you have a <strong>14-day right of withdrawal</strong>. Cancel any time from this page.
        </p>
      </div>

      {/* Add-ons */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{tx.addons}</p>
        <div className="space-y-3">
          {addonsData.map((addon) => (
            <div
              key={addon.id}
              className="bg-white border border-zinc-200 rounded-lg p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-zinc-900">{addon.name}</p>
                  {addon.tag && (
                    <span className="text-[10px] font-medium text-zinc-400 border border-zinc-200 rounded px-1.5 py-0.5">
                      {addon.tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{addon.desc}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-zinc-900">
                  +€{addon.price}
                  <span className="text-xs font-normal text-zinc-400">/mo{addon.perUnit ? ` · ${addon.perUnit}` : ''}</span>
                </p>
                <button
                  onClick={() => { handleCheckout(addon.id).catch(() => {}) }}
                  disabled={loading === addon.id}
                  className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-600 border border-zinc-200 rounded px-2 py-1 hover:bg-zinc-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading === addon.id
                    ? <Loader2 size={9} className="animate-spin" />
                    : <>{tx.addBtn} <ChevronRight size={9} /></>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ note */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-zinc-700 mb-1">{tx.faqTitle}</p>
        <p className="text-xs text-zinc-500 leading-relaxed">{tx.faqDesc}</p>
      </div>

      {/* Two-step cancellation modal */}
      {showCancel && (
        <CancelModal
          onClose={() => setShowCancel(false)}
          onConfirm={() => { handleCancel().catch(() => {}) }}
          loading={cancelLoading}
        />
      )}

      <ReferralWidget />
    </div>
  )
}
