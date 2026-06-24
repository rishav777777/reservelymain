'use client'

import { usePathname } from 'next/navigation'
import { LanguageToggle } from './LanguageToggle'

const SUPPRESSED_PREFIXES = [
  '/dashboard',
  '/admin',
]

const SUPPRESSED_EXACT = ['/', '/for-restaurants', '/restaurants']

export function GlobalLangToggle() {
  const pathname = usePathname()

  const hide =
    SUPPRESSED_EXACT.includes(pathname) ||
    SUPPRESSED_PREFIXES.some(p => pathname.startsWith(p))

  if (hide) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
      }}
    >
      <LanguageToggle />
    </div>
  )
}
