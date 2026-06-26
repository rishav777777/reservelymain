'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Lang } from '@/lib/i18n/translations'

interface LangCtx { lang: Lang; setLang: (l: Lang) => void }
const Ctx = createContext<LangCtx>({ lang: 'EN', setLang: () => {} })

export function useLang(): LangCtx { return useContext(Ctx) }

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('EN')

  useEffect(() => {
    const stored = localStorage.getItem('reservely-lang') as Lang | null
    if (stored === 'DE' || stored === 'EN') {
      setLangState(stored)
    } else {
      const browserLang = navigator.language || ''
      if (browserLang.toLowerCase().startsWith('de')) setLangState('DE')
    }
  }, [])

  function setLang(l: Lang) {
    localStorage.setItem('reservely-lang', l)
    setLangState(l)
  }

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}
