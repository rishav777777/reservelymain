'use client'

import { useState } from 'react'
import { ShieldAlert, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

type EraseResult = {
  ok: boolean
  reservations_anonymised: number
  guest_profiles_deleted:  number
  email_logs_anonymised:   boolean
}

export default function AdminGdprPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<EraseResult | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  async function handleErase() {
    if (!email.trim() || !confirm) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res  = await fetch('/api/admin/gdpr/erase', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const json = await res.json() as EraseResult & { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Request failed')
      setResult(json)
      setEmail('')
      setConfirm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-sm font-semibold text-zinc-900">GDPR Erasure</h1>
        <p className="text-xs text-zinc-400 mt-0.5">Art. 17 — Right to erasure. Anonymise all guest PII for a given email address.</p>
      </div>

      {/* What this does */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-zinc-700">What gets anonymised</p>
        <ul className="text-xs text-zinc-500 space-y-1 list-disc pl-4">
          <li>All <strong>reservations</strong>: guest name → "Anonymized Guest", email → anonymized@deleted.local, phone removed</li>
          <li>All <strong>email logs</strong>: recipient address replaced with anonymized@deleted.local</li>
          <li><strong>Guest profile</strong> (CRM record) deleted entirely</li>
          <li>Booking history, dates, table, and party size are <strong>kept</strong> for operational records — only PII is removed</li>
        </ul>
        <p className="text-xs text-zinc-400 mt-2">This action is irreversible. It is logged to the audit trail.</p>
      </div>

      {/* Form */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-700 mb-1">
            Guest email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setConfirm(false); setResult(null); setError(null) }}
            placeholder="guest@example.com"
            className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>

        {email.trim().length > 3 && (
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirm}
              onChange={e => setConfirm(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-red-500 focus:ring-red-400"
            />
            <span className="text-xs text-zinc-600">
              I confirm this is a legitimate GDPR erasure request and understand this action cannot be undone.
            </span>
          </label>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
            <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
            <div className="text-xs text-emerald-700 space-y-0.5">
              <p className="font-semibold">Erasure complete</p>
              <p>{result.reservations_anonymised} reservation{result.reservations_anonymised !== 1 ? 's' : ''} anonymised</p>
              <p>{result.guest_profiles_deleted} guest profile deleted</p>
              <p>Email logs: {result.email_logs_anonymised ? 'anonymised' : 'skipped (run migration 026 first)'}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => { handleErase().catch(() => {}) }}
          disabled={!email.trim() || !confirm || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold
            disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
        >
          {loading
            ? <><Loader2 size={12} className="animate-spin" />Erasing…</>
            : <><ShieldAlert size={12} />Erase guest data</>
          }
        </button>
      </div>

      {/* Info box */}
      <div className="text-xs text-zinc-400 space-y-1">
        <p>All erasure actions are recorded in the <a href="/admin/audit" className="underline text-zinc-500">Audit Log</a> with the admin's identity and timestamp.</p>
        <p>Respond to Art. 17 requests within <strong>30 days</strong> of receipt.</p>
      </div>
    </div>
  )
}
