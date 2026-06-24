'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useLang } from '@/components/i18n/LanguageProvider'
import { dashboardT } from '@/lib/i18n/dashboardT'

interface DemoRequest {
  id: string
  restaurant_name: string
  contact_name: string
  email: string
  city: string
  venue_type: string
  message: string | null
  status: string
  created_at: string
}

export function RequestsClient({ initialRequests }: { initialRequests: DemoRequest[] }) {
  const { lang } = useLang()
  const tx = dashboardT[lang].requests
  const locale = lang === 'EN' ? 'en-GB' : 'de-AT'

  const [requests, setRequests] = useState<DemoRequest[]>(initialRequests)

  async function handleStatus(id: string, status: 'approved' | 'declined') {
    const res = await fetch(`/api/demo-request/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const body = await res.json()
    if (!res.ok) { toast.error(body.error ?? 'Failed'); return }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    toast.success(status === 'approved' ? tx.approve : tx.decline)
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg px-6 py-12 text-center">
        <p className="text-sm text-zinc-500">{tx.empty}</p>
        <p className="text-xs text-zinc-400 mt-1">{tx.emptySub}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <div key={r.id} className="bg-white border border-zinc-200 rounded-lg px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-900">{r.restaurant_name}</p>
              <p className="text-xs text-zinc-500">{r.contact_name} · {r.email}</p>
              <p className="text-xs text-zinc-400">{r.city} · {r.venue_type}</p>
              {r.message && (
                <p className="text-xs text-zinc-400 mt-1 italic">{r.message}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  r.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : r.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {r.status}
                </span>
                <p className="text-xs text-zinc-400">
                  {new Date(r.created_at).toLocaleDateString(locale)}
                </p>
              </div>
              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleStatus(r.id, 'declined')}
                    style={{ padding: '6px 16px', borderRadius: '10px', fontSize: '12px',
                      fontWeight: 700, color: '#A82929', border: '1.5px solid rgba(168,41,41,0.3)',
                      background: 'rgba(168,41,41,0.06)', cursor: 'pointer' }}
                  >
                    {tx.decline}
                  </button>
                  <button
                    onClick={() => handleStatus(r.id, 'approved')}
                    style={{ padding: '6px 16px', borderRadius: '10px', fontSize: '12px',
                      fontWeight: 700, color: '#fff', border: 'none',
                      background: '#1B7A43', cursor: 'pointer' }}
                  >
                    {tx.approve}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
