'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

const STORAGE_KEY = 'rsvly_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const { lang } = useLang()
  const tx = dashboardT[lang].cookie

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function accept() { localStorage.setItem(STORAGE_KEY, 'accepted'); setVisible(false) }
  function decline() { localStorage.setItem(STORAGE_KEY, 'declined'); setVisible(false) }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-zinc-950/95 backdrop-blur-sm px-4 py-4 shadow-2xl">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-xs text-zinc-300 leading-relaxed flex-1">
          {tx.text}{' '}
          <Link href="/cookies" className="text-brand-primary hover:underline underline-offset-2">
            {tx.policy}
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-md border border-zinc-700 hover:border-zinc-500 transition-colors"
          >
            {tx.decline}
          </button>
          <button
            onClick={accept}
            className="text-xs bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold px-4 py-1.5 rounded-md transition-colors"
          >
            {tx.accept}
          </button>
          <button onClick={decline} aria-label="Close" className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 ml-1">
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
