'use client'

import { useState } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DpaClient({
  restaurantName,
  ownerName,
}: {
  restaurantName: string
  ownerName: string
}) {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSign() {
    if (!accepted) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/legal/sign-dpa', { method: 'POST' })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to sign DPA')
      router.replace('/dashboard')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-zinc-100 px-8 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-900">Data Processing Agreement</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Required before accessing your dashboard · Version 1.0</p>
          </div>
        </div>

        {/* Legal body */}
        <div className="px-8 py-6 space-y-4 max-h-[480px] overflow-y-auto text-xs text-zinc-600 leading-relaxed">
          <p>
            This Data Processing Agreement (<strong>"DPA"</strong>) is entered into between{' '}
            <strong>Reservely</strong> ("<strong>Processor</strong>") and{' '}
            <strong>{restaurantName}</strong> ("<strong>Controller</strong>"), effective upon acceptance below.
          </p>

          <div>
            <p className="font-semibold text-zinc-800">1. Definitions</p>
            <p className="mt-1">
              "Personal Data" means any information relating to an identified or identifiable natural person
              (restaurant guests) processed through the Reservely platform. "Processing" means any operation
              performed on personal data, including collection, storage, retrieval, and deletion.
            </p>
          </div>

          <div>
            <p className="font-semibold text-zinc-800">2. Scope and Purpose</p>
            <p className="mt-1">
              Reservely processes guest personal data (name, email, phone number, dietary preferences,
              reservation history) solely on behalf of the Controller and strictly for the purposes of:
              (a) managing table reservations; (b) sending booking confirmations and reminders to guests;
              (c) generating aggregated analytics visible only to the Controller.
            </p>
          </div>

          <div>
            <p className="font-semibold text-zinc-800">3. Controller Obligations</p>
            <p className="mt-1">The Controller agrees to:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Use guest personal data exclusively for managing reservations at <strong>{restaurantName}</strong>.</li>
              <li>Not sell, transfer, or share guest data with third parties for marketing or profiling without explicit guest consent.</li>
              <li>Respond to guest data access or deletion requests within 30 days.</li>
              <li>Inform guests of data processing via a readily accessible privacy notice.</li>
              <li>Report any data breach to Reservely within 24 hours of becoming aware of it.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-zinc-800">4. Processor Obligations (Reservely)</p>
            <p className="mt-1">Reservely agrees to:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>Process personal data only on documented instructions from the Controller.</li>
              <li>Implement appropriate technical and organisational security measures (encryption at rest and in transit, access controls, audit logging).</li>
              <li>Automatically anonymise guest personal data 60 days after the reservation date.</li>
              <li>Delete email delivery logs after 90 days.</li>
              <li>Not engage sub-processors without prior written consent, except for: Supabase (infrastructure), Resend (transactional email), Paddle (billing). Each is bound by equivalent data protection obligations.</li>
              <li>Assist the Controller in responding to data subject rights requests at no additional charge.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-zinc-800">5. Data Transfers</p>
            <p className="mt-1">
              Personal data is stored on EU-region servers. Any transfer outside the European Economic Area
              occurs only with appropriate safeguards in place (Standard Contractual Clauses or equivalent).
            </p>
          </div>

          <div>
            <p className="font-semibold text-zinc-800">6. Retention and Deletion</p>
            <p className="mt-1">
              Reservely retains guest personal data for 60 days from the reservation date, after which it is
              automatically anonymised. The Controller may request immediate deletion of specific guest records
              via the dashboard at any time.
            </p>
          </div>

          <div>
            <p className="font-semibold text-zinc-800">7. Liability</p>
            <p className="mt-1">
              Each party is responsible for its own compliance with applicable data protection laws. Reservely's
              liability under this DPA is limited to the fees paid by the Controller in the 12 months preceding
              the claim.
            </p>
          </div>

          <div>
            <p className="font-semibold text-zinc-800">8. Governing Law</p>
            <p className="mt-1">
              This DPA is governed by the laws of the European Union, in particular the General Data Protection
              Regulation (EU) 2016/679 (GDPR). Any disputes shall be resolved in the courts of the Controller's
              place of establishment.
            </p>
          </div>

          <div>
            <p className="font-semibold text-zinc-800">9. Term</p>
            <p className="mt-1">
              This DPA remains in force for the duration of the Reservely subscription and terminates
              automatically upon account deletion, at which point all personal data will be deleted within 30 days.
            </p>
          </div>
        </div>

        {/* Acceptance */}
        <div className="border-t border-zinc-100 px-8 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-xs text-zinc-600 leading-relaxed">
              I, <strong>{ownerName || 'the account owner'}</strong>, confirm that I have read and agree to the
              Data Processing Agreement on behalf of <strong>{restaurantName}</strong>. I understand that this
              agreement governs how Reservely processes guest personal data and that my acceptance is legally
              binding.
            </span>
          </label>

          <button
            onClick={() => { handleSign().catch(() => {}) }}
            disabled={!accepted || loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-primary text-white text-xs font-semibold
              disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {loading ? 'Signing…' : 'Accept & continue to dashboard'}
          </button>

          <p className="text-center text-[10px] text-zinc-400">
            Your acceptance is recorded with a timestamp and IP address for compliance purposes.
          </p>
        </div>
      </div>
    </div>
  )
}
