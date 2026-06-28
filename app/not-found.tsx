import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-5">
          <span className="text-brand-primary text-lg font-bold">R</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Page not found</h1>
        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-medium px-4 py-2 rounded-lg bg-brand-primary text-white hover:opacity-90 transition-opacity"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="text-xs font-medium px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
