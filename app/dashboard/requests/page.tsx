import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { RequestsClient } from './RequestsClient'

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
          {(requests ?? []).length} total · approve to onboard a new restaurant
        </p>
      </div>
      <RequestsClient initialRequests={requests ?? []} />
    </div>
  )
}
