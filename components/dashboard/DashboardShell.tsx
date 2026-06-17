'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types'
import { LayoutDashboard, Table2, Settings, BarChart3, LogOut, Users, Inbox } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/tables',     label: 'Tables',    icon: Table2 },
  { href: '/dashboard/analytics',  label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings',   label: 'Settings',  icon: Settings },
  { href: '/dashboard/staff',      label: 'Users',     icon: Users },
  { href: '/dashboard/requests',   label: 'Requests',  icon: Inbox },
]

export function DashboardShell({ children, userRole }: { children: React.ReactNode; userRole: UserRole }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-36 bg-brand-sidebar flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-primary flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <span className="text-white text-sm font-semibold tracking-tight">Reservely</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.filter((item) => {
            if (item.href === '/dashboard/settings')  return userRole !== 'staff'
            if (item.href === '/dashboard/analytics') return userRole !== 'staff'
            if (item.href === '/dashboard/staff')     return userRole === 'owner'
            if (item.href === '/dashboard/requests')  return userRole === 'owner'
            return true
          }).map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-2 pb-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-zinc-500 hover:text-white hover:bg-white/5 w-full transition-colors duration-150"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-zinc-50">
        {children}
      </main>
    </div>
  )
}
