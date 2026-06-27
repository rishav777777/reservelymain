'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, FileText, CreditCard,
  Star, Settings, ChevronLeft, Users, ScrollText,
} from 'lucide-react'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'

const NAV = [
  { label: 'Overview',      href: '/admin',               icon: LayoutDashboard, exact: true },
  { label: 'Restaurants',   href: '/admin/restaurants',   icon: Building2 },
  { label: 'Users',         href: '/admin/users',         icon: Users },
  { label: 'Demo Requests', href: '/admin/demo-requests', icon: FileText },
  { label: 'Audit Log',     href: '/admin/audit',         icon: ScrollText },
  { label: 'Billing',       href: '/admin/billing',       icon: CreditCard },
  { label: 'Content',       href: '/admin/content',       icon: Star },
  { label: 'Settings',      href: '/admin/settings',      icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 bg-brand-sidebar border-r border-white/5 flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <div>
              <p className="text-white text-xs font-semibold leading-tight">Reservely</p>
              <p className="text-zinc-500 text-[10px]">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-auto">
          {NAV.map(({ label, href, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
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

        <div className="px-4 py-3 border-t border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Language</span>
            <LanguageToggle onDark />
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Restaurant dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Landing page
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
