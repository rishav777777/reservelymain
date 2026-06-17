import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-amber-600" />
        </div>
        <h1 className="text-sm font-semibold text-zinc-900 mb-2">
          Account created
        </h1>
        <p className="text-xs text-zinc-500 leading-relaxed mb-6">
          Your account is pending activation. Ask your restaurant owner to
          add you from the Users section of the dashboard.
        </p>
        <Link
          href="/login"
          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}
