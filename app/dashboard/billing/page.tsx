'use client'

import { useState } from 'react'
import { Check, Zap, ChevronRight, Loader2 } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

type Tier = {
  id: string; name: string; price: number; tagline: string
  features: readonly string[]; popular?: boolean
}
type Addon = {
  id: string; name: string; price: number; desc: string
  tag?: string; perUnit?: string
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

export default function BillingPage() {
  const { lang } = useLang()
  const tx = dashboardT[lang].billing
  const tiers      = tx.tiers     as readonly Tier[]
  const addonsData = tx.addonsData as readonly Addon[]
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  async function handleCheckout(planId: string) {
    setLoading(planId)
    setError(null)
    try { await startCheckout(planId) }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); setLoading(null) }
  }

  return (
    <div className="p-5 max-w-4xl space-y-8">
      <div>
        <h1 className="text-sm font-semibold text-zinc-900">{tx.title}</h1>
        <p className="text-xs text-zinc-400 mt-0.5">{tx.subtitle}</p>
      </div>

      {/* Trial notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <Zap size={14} className="text-amber-500 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-amber-800">{tx.trialTitle}</p>
          <p className="text-xs text-amber-600 mt-0.5">{tx.trialDesc}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Plan tiers */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">{tx.plans}</p>
        <div className="grid grid-cols-3 gap-4">
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
                {tier.popular ? tx.choosePlan : tx.choosePlan}
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 mt-3 text-center">
          {tx.noFees}
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
    </div>
  )
}
