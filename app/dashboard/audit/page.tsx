import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { AuditClient } from './AuditClient'

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, restaurant_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'owner') redirect('/dashboard')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: logs } = await admin
    .from('audit_logs')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return <AuditClient logs={logs ?? []} />
}
