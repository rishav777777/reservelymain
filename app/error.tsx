'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console for now; swap for Sentry.captureException(error) when monitoring is added
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mx-auto mb-5">
          <span className="text-red-500 text-lg font-bold">!</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-zinc-500 mb-1 leading-relaxed">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-xs text-zinc-400 mb-6 font-mono">
            Reference: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="text-xs font-medium px-4 py-2 rounded-lg bg-brand-primary text-white hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="text-xs font-medium px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
