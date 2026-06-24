'use client'

import Link from 'next/link'
import { Scale, Shield, Cookie, FileText, ArrowLeft, ChevronRight } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { legalT } from '@/lib/i18n/translations'

const ICONS = { '/impressum': Scale, '/privacy': Shield, '/cookies': Cookie, '/terms': FileText } as const

export default function LegalHubPage() {
  const { lang } = useLang()
  const tx = legalT[lang].hub

  return (
    <div className="min-h-screen bg-[#F4F6F4]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Top bar */}
      <div className="bg-[#0D472B] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <span className="text-white font-semibold text-sm">Reservely</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors">
            <ArrowLeft size={13} /> {tx.backHome}
          </Link>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-zinc-100 px-6 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center gap-1.5 text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-700 transition-colors">
            {legalT[lang].layout.breadcrumbHome}
          </Link>
          <ChevronRight size={11} />
          <span className="text-zinc-600 font-medium">{tx.breadcrumbLegal}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {tx.title}
          </h1>
          <p className="text-sm text-zinc-500 max-w-xl">{tx.subtitle}</p>
        </div>

        {/* Documents grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {(tx.docs as readonly { href: string; icon?: unknown; label: string; badge: string; badgeColor: string; desc: string }[]).map(({ href, label, badge, badgeColor, desc }) => {
            const Icon = ICONS[href as keyof typeof ICONS] ?? FileText
            return (
              <Link key={href} href={href}
                className="group bg-white rounded-2xl border border-zinc-100 p-6 hover:border-zinc-200 hover:shadow-md transition-all flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0D472B]/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-[#0D472B]" />
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
                    {badge}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-bold text-zinc-900 mb-1.5">{label}</h2>
                  <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#0D472B] font-semibold group-hover:gap-2 transition-all">
                  {tx.readDocument} <ChevronRight size={12} />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Info strip */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-zinc-900 mb-1">{tx.gdprTitle}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{tx.gdprBody}</p>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-zinc-900 mb-1">{tx.contactTitle}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-2">{tx.contactBody}</p>
            <a href="mailto:legal@reservely.app" className="text-xs text-[#0D472B] font-semibold hover:underline">
              legal@reservely.app
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-8">
          {tx.copyright(new Date().getFullYear())}
        </p>
      </div>
    </div>
  )
}
