import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export default async function RequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'owner') redirect('/dashboard')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: requests } = await admin
    .from('demo_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-5">
      <div className="mb-5">
        <h1 className="text-sm font-semibold text-gray-900">Demo Requests</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {(requests ?? []).length} total · review and follow up directly via email
        </p>
      </div>

      {(requests ?? []).length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No demo requests yet</p>
          <p className="text-xs text-zinc-400 mt-1">Requests submitted on the landing page appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(requests ?? []).map((r: any) => (
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
                <div className="text-right shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    r.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {r.status}
                  </span>
                  <p className="text-xs text-zinc-400 mt-1">
                    {new Date(r.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
