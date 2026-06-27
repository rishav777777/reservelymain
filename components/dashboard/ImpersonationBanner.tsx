'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldAlert } from 'lucide-react'

function BannerCore() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (searchParams.get('_imp') === '1') {
      sessionStorage.setItem('_imp', '1')
      const url = new URL(window.location.href)
      url.searchParams.delete('_imp')
      window.history.replaceState({}, '', url.toString())
    }
    setActive(sessionStorage.getItem('_imp') === '1')
  }, [searchParams])

  async function endSession() {
    sessionStorage.removeItem('_imp')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (!active) return null

  return (
    <div className="w-full bg-amber-500 px-4 py-2.5 flex items-center gap-3 shrink-0">
      <ShieldAlert className="w-4 h-4 text-white shrink-0" />
      <p className="flex-1 text-sm font-semibold text-white">
        Admin impersonation active — your actions are logged under your admin account, not the restaurant owner's.
      </p>
      <button
        onClick={endSession}
        className="text-xs font-bold text-white/90 hover:text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-md transition-colors shrink-0"
      >
        End session
      </button>
    </div>
  )
}

export function ImpersonationBanner() {
  return (
    <Suspense fallback={null}>
      <BannerCore />
    </Suspense>
  )
}
