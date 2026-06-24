import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { CookieConsent } from '@/components/CookieConsent'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { LanguageProvider } from '@/components/i18n/LanguageProvider'
import { GlobalLangToggle } from '@/components/i18n/GlobalLangToggle'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
  weight: ['400'],
})

export const metadata: Metadata = {
  title: 'Reservely',
  description: 'Restaurant reservation operations platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${dmSans.variable} ${dmSerif.variable} h-full antialiased`}
    >
      <body
        className="min-h-full bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-200"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <Toaster richColors position="top-right" />
            <CookieConsent />
            <GlobalLangToggle />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
