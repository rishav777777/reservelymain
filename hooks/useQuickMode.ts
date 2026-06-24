'use client'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'reservely_quick_mode'

export function useQuickMode() {
  const [quickMode, setQuickMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      setQuickMode(saved === 'true')
    } else {
      // Default to quick mode on small screens
      setQuickMode(window.innerWidth < 768)
    }
  }, [])

  const toggle = (value: boolean) => {
    setQuickMode(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }

  return { quickMode, toggle }
}
