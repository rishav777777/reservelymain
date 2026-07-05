'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Gift } from 'lucide-react'

type ReferralData = {
  code:      string
  url:       string
  credits:   number
  converted: number
}

export function ReferralWidget() {
  const [data,    setData]    = useState<ReferralData | null>(null)
  const [copied,  setCopied]  = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/restaurants/referral')
      const json = await res.json() as ReferralData
      setData(json)
    } catch {
      // non-fatal — widget just stays hidden
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const copy = async () => {
    if (!data?.url) return
    await navigator.clipboard.writeText(data.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !data) return null

  return (
    <div className="border border-zinc-200 rounded-xl p-6 bg-white">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-semibold text-zinc-900">Refer a restaurant</h3>
      </div>
      <p className="text-xs text-zinc-500 mb-4">
        When a referred restaurant upgrades to a paid plan, you both get <strong>1 month free (€59)</strong>.
      </p>

      <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 mb-4">
        <span className="text-xs font-mono text-zinc-700 truncate flex-1">{data.url}</span>
        <button
          onClick={copy}
          className="shrink-0 flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          {copied
            ? <><Check className="h-3 w-3" /> Copied</>
            : <><Copy className="h-3 w-3" /> Copy</>
          }
        </button>
      </div>

      <div className="flex gap-6 text-xs text-zinc-500">
        <span><strong className="text-zinc-900">{data.converted}</strong> restaurant{data.converted !== 1 ? 's' : ''} converted</span>
        <span><strong className="text-zinc-900">€{data.credits}</strong> earned</span>
      </div>
    </div>
  )
}
