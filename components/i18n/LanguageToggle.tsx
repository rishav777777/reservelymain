'use client'
import { useLang } from './LanguageProvider'

interface Props {
  onDark?: boolean
  className?: string
}

export function LanguageToggle({ onDark, className = '' }: Props) {
  const { lang, setLang } = useLang()

  const base = onDark
    ? 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/20'
    : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700'

  return (
    <div
      className={`inline-flex items-center rounded-full overflow-hidden transition-all ${base} ${className}`}
      style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}
    >
      {(['EN', 'DE'] as const).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: '4px 10px',
            cursor: 'pointer',
            borderRadius: '100px',
            transition: 'background 0.15s, color 0.15s',
            background: lang === l ? (onDark ? 'rgba(255,255,255,0.22)' : '#0D472B') : 'transparent',
            color: lang === l ? '#fff' : undefined,
          }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
