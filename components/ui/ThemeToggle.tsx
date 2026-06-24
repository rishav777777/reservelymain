'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

interface Props {
  /** Pass true when the toggle sits on a dark background (hero, dark sections) */
  onDark?: boolean
  className?: string
}

export function ThemeToggle({ onDark = false, className = '' }: Props) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={[
        'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
        'active:scale-90 select-none cursor-pointer',
        onDark
          ? 'bg-white/10 hover:bg-white/20 border border-white/15 text-white/65 hover:text-white'
          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-white',
        className,
      ].join(' ')}
    >
      {theme === 'dark'
        ? <Sun  size={14} strokeWidth={2} />
        : <Moon size={14} strokeWidth={2} />}
    </button>
  )
}
