'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, FileText, CreditCard,
  Star, Settings, ChevronLeft, Users, ScrollText, Mail, ShieldAlert,
  Menu, X,
} from 'lucide-react'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'

const NAV = [
  { label: 'Overview',      href: '/admin',               icon: LayoutDashboard, exact: true },
  { label: 'Restaurants',   href: '/admin/restaurants',   icon: Building2 },
  { label: 'Users',         href: '/admin/users',         icon: Users },
  { label: 'Demo Requests', href: '/admin/demo-requests', icon: FileText },
  { label: 'Email Logs',    href: '/admin/email-logs',    icon: Mail },
  { label: 'Audit Log',     href: '/admin/audit',         icon: ScrollText },
  { label: 'Billing',       href: '/admin/billing',       icon: CreditCard },
  { label: 'Content',       href: '/admin/content',       icon: Star },
  { label: 'GDPR Erasure',  href: '/admin/gdpr',          icon: ShieldAlert },
  { label: 'Settings',      href: '/admin/settings',      icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname()
  const [open, setOpen] = useState(false)

  const sidebarContent = (
    <>
      <div className="px-4 py-5 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <div>
              <p className="text-white text-xs font-semibold leading-tight">Reservely</p>
              <p className="text-zinc-500 text-[10px]">Super Admin</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="md:hidden text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-auto">
        {NAV.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 md:py-2 rounded-md text-xs font-medium transition-colors ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-white/5 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Language</span>
          <LanguageToggle onDark />
        </div>
        <Link href="/dashboard" onClick={() => setOpen(false)}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
          <ChevronLeft className="w-3 h-3" /> Restaurant dashboard
        </Link>
        <Link href="/" onClick={() => setOpen(false)}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
          <ChevronLeft className="w-3 h-3" /> Landing page
        </Link>
      </div>
    </>
  )

  return (
    <div className="flex flex-col h-screen bg-zinc-50 overflow-hidden">

      {/* ── Mobile top bar ────────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 h-12 bg-brand-sidebar border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-primary flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">R</span>
          </div>
          <span className="text-white text-xs font-semibold">Super Admin</span>
        </div>
        <button onClick={() => setOpen(v => !v)} className="text-zinc-400 hover:text-white p-1" aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className={`
          fixed md:relative inset-y-0 left-0 z-50
          w-52 bg-brand-sidebar border-r border-white/5 flex flex-col
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}>
          {sidebarContent}
        </aside>

        {/* ── Main ──────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
