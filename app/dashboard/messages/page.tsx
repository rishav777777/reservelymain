'use client'

import { MessageSquare } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

export default function MessagesPage() {
  const { lang } = useLang()
  const tx = dashboardT[lang].messagesPage

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">{tx.title}</h1>
        <p className="text-sm text-zinc-400 mt-0.5">{tx.subtitle}</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-6 h-6 text-zinc-400" />
        </div>
        <p className="text-sm font-medium text-zinc-700 mb-1">{tx.coming}</p>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto">{tx.desc}</p>
      </div>
    </div>
  )
}
