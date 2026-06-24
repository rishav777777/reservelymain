'use client'

import Link from 'next/link'
import { Scale, Shield, Cookie, FileText, ChevronRight, ArrowLeft } from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { legalT } from '@/lib/i18n/translations'

const ICONS = { '/impressum': Scale, '/privacy': Shield, '/cookies': Cookie, '/terms': FileText } as const

interface Props {
  children:    React.ReactNode
  title:       string
  subtitle?:   string
  updatedAt?:  string
  currentPath: string
}

export function LegalLayout({ children, title, subtitle, updatedAt, currentPath }: Props) {
  const { lang } = useLang()
  const tx = legalT[lang].layout

  return (
    <div className="min-h-screen bg-[#F4F6F4]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Top bar */}
      <div className="bg-[#0D472B] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <span className="text-white font-semibold text-sm">Reservely</span>
          </Link>
          <Link href="/legal" className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors">
            <ArrowLeft size={13} /> {tx.allDocs}
          </Link>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-zinc-100 px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 text-xs text-zinc-400">
          <Link href="/" className="hover:text-zinc-700 transition-colors">{tx.breadcrumbHome}</Link>
          <ChevronRight size={11} />
          <Link href="/legal" className="hover:text-zinc-700 transition-colors">{tx.breadcrumbLegal}</Link>
          <ChevronRight size={11} />
          <span className="text-zinc-600 font-medium">{title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 flex gap-10 items-start">

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-2 w-56 shrink-0 sticky top-8">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 px-2">{tx.documents}</p>
          {tx.sidebar.map(({ href, label, desc }) => {
            const Icon = ICONS[href as keyof typeof ICONS] ?? FileText
            const active = currentPath === href
            return (
              <Link key={href} href={href}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  active
                    ? 'bg-[#0D472B] text-white shadow-sm'
                    : 'hover:bg-white hover:shadow-sm text-zinc-600 hover:text-zinc-900'
                }`}>
                <Icon size={15} className={`mt-0.5 shrink-0 ${active ? 'text-white/70' : 'text-zinc-400'}`} />
                <div>
                  <p className={`text-xs font-semibold leading-tight ${active ? 'text-white' : ''}`}>{label}</p>
                  <p className={`text-[11px] mt-0.5 ${active ? 'text-white/60' : 'text-zinc-400'}`}>{desc}</p>
                </div>
              </Link>
            )
          })}

          <div className="mt-6 bg-white rounded-xl border border-zinc-100 p-4">
            <p className="text-xs font-semibold text-zinc-700 mb-1">{tx.questions}</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">{tx.questionsBody}</p>
            <a href="mailto:legal@reservely.app" className="text-xs text-[#0D472B] font-semibold hover:underline">
              legal@reservely.app
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Document header */}
          <div className="bg-white rounded-2xl border border-zinc-100 px-8 py-8 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {title}
                </h1>
                {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
              </div>
              {updatedAt && (
                <span className="text-xs font-medium bg-zinc-100 text-zinc-500 px-3 py-1 rounded-full shrink-0">
                  {tx.updated} {updatedAt}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-zinc-100 px-8 py-8">
            {children}
          </div>

          {/* Mobile doc links */}
          <div className="lg:hidden mt-6 bg-white rounded-2xl border border-zinc-100 p-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">{tx.otherDocs}</p>
            <div className="flex flex-col gap-1">
              {tx.sidebar.filter(d => d.href !== currentPath).map(({ href, label }) => {
                const Icon = ICONS[href as keyof typeof ICONS] ?? FileText
                return (
                  <Link key={href} href={href}
                    className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 py-1.5 transition-colors">
                    <Icon size={13} className="text-zinc-400" /> {label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Footer nav */}
          <div className="mt-8 flex items-center justify-between text-xs text-zinc-400">
            <Link href="/" className="hover:text-zinc-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={12} /> {tx.backToReservely}
            </Link>
            <Link href="/legal" className="hover:text-zinc-600 transition-colors">{tx.allDocsFooter}</Link>
          </div>
        </main>
      </div>
    </div>
  )
}
