'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types'
import {
  CalendarDays, CalendarRange, LayoutGrid,
  Repeat2, Users2, Users, MessageSquare, BarChart2,
  UserCog, CreditCard, Settings, LogOut, Wifi, WifiOff, Clock,
} from 'lucide-react'
import { useLang } from '@/components/i18n/LanguageProvider'
import { LanguageToggle } from '@/components/i18n/LanguageToggle'
import { dashboardT } from '@/lib/i18n/dashboardT'
import { ImpersonationBanner } from '@/components/dashboard/ImpersonationBanner'

interface Props {
  children:       React.ReactNode
  userRole:       UserRole
  restaurantName: string
  userName:       string
  waSetup:        boolean
}

function colorFromName(name: string) {
  const palette = ['#E63946', '#457B9D', '#2D6A4F', '#9B5DE5', '#F4A261', '#118AB2']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xff
  return palette[h % palette.length]
}

export function DashboardShell({ children, userRole, restaurantName, userName, waSetup }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const { lang } = useLang()
  const tx       = dashboardT[lang]

  if (pathname === '/dashboard/quick') {
    return <div className="h-screen overflow-hidden">{children}</div>
  }

  const items = tx.nav.items

  const GROUPS = [
    {
      title: tx.nav.groups.daily,
      items: [
        { href: '/dashboard',               label: items.todaysView,  icon: CalendarDays,  exact: true },
        { href: '/dashboard/reservations',  label: items.allBookings, icon: CalendarRange },
        { href: '/dashboard/waitlist',      label: items.waitlist,    icon: Clock,         notStaff: true },
        { href: '/dashboard/layout-editor', label: items.floorPlan,   icon: LayoutGrid,    minRole: 'manager' as const },
      ],
    },
    {
      title: tx.nav.groups.regulars,
      items: [
        { href: '/dashboard/stammtisch', label: items.regulars,    icon: Repeat2,       notStaff: true },
        { href: '/dashboard/groups',     label: items.groupEvents, icon: Users2,        notStaff: true },
        { href: '/dashboard/guests',     label: items.guestBook,   icon: Users,         notStaff: true },
        { href: '/dashboard/messages',   label: items.messages,    icon: MessageSquare },
      ],
    },
    {
      title: tx.nav.groups.business,
      items: [
        { href: '/dashboard/analytics', label: items.insights,  icon: BarChart2,  notStaff: true },
        { href: '/dashboard/users',     label: items.myTeam,    icon: UserCog,    minRole: 'owner' as const },
        { href: '/dashboard/billing',   label: items.plan,      icon: CreditCard, minRole: 'owner' as const },
        { href: '/dashboard/settings',  label: items.settings,  icon: Settings,   notStaff: true },
      ],
    },
  ]

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function visible(item: { minRole?: 'manager' | 'owner'; notStaff?: boolean }) {
    if (item.minRole === 'owner'   && userRole !== 'owner') return false
    if (item.minRole === 'manager' && userRole === 'staff') return false
    if (item.notStaff && userRole === 'staff')              return false
    return true
  }

  const initial      = restaurantName[0]?.toUpperCase() ?? 'R'
  const accentColor  = colorFromName(restaurantName)
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ImpersonationBanner />

      <div className="flex flex-1 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-[230px] shrink-0 bg-white border-r border-zinc-100 flex flex-col">

        {/* Logo strip */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-zinc-100 shrink-0">
          <div className="w-6 h-6 rounded-[6px] bg-[#E63946] flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-black leading-none">R</span>
          </div>
          <span className="font-bold text-[15px] text-zinc-900 tracking-tight">Reservely</span>
        </div>

        {/* Restaurant identity */}
        <div className="px-4 py-3 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-sm font-bold"
              style={{ backgroundColor: accentColor }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-zinc-900 leading-tight truncate">
                {restaurantName || 'My Restaurant'}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 capitalize">{userRole}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-3 space-y-5">
          {GROUPS.map(group => {
            const visibleItems = group.items.filter(visible)
            if (!visibleItems.length) return null
            return (
              <div key={group.title}>
                <p className="mb-1.5 px-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const { href, label, icon: Icon } = item
                    const exact = 'exact' in item ? item.exact : false
                    const active = exact
                      ? pathname === href
                      : pathname === href || pathname.startsWith(href + '/')
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-100 ${
                            active
                              ? 'text-[#E63946] bg-[#E63946]/[0.07]'
                              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80'
                          }`}
                        >
                          {active && (
                            <span className="absolute left-3 w-[3px] h-5 rounded-full bg-[#E63946] -ml-0.5" />
                          )}
                          <Icon className={`w-[15px] h-[15px] shrink-0 ${active ? 'text-[#E63946]' : 'text-zinc-400'}`} />
                          {label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-zinc-100 px-4 py-3 space-y-1">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-semibold">{userInitials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-zinc-800 truncate leading-tight">{userName}</p>
              <div className={`flex items-center gap-1 mt-0.5 text-[10px] ${waSetup ? 'text-emerald-500' : 'text-zinc-400'}`}>
                {waSetup
                  ? <><Wifi className="w-2.5 h-2.5" /> {tx.footer.waOn}</>
                  : <><WifiOff className="w-2.5 h-2.5" /> {tx.footer.waOff}</>
                }
              </div>
            </div>
          </div>

          {/* Language toggle */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[11px] text-zinc-400 font-medium">{tx.language}</span>
            <LanguageToggle />
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[12px] text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {tx.footer.signOut}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-zinc-50/60">
        {children}
      </main>
      </div>
    </div>
  )
}
