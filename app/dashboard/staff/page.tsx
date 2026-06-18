import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { StaffClient } from './StaffClient'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') redirect('/dashboard')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: team } = await admin
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .eq('restaurant_id', profile.restaurant_id)
    .order('role')

  const { data: pending } = await admin
    .from('profiles')
    .select('id, full_name, email, role, is_active')
    .is('restaurant_id', null)
    .neq('id', user.id)

  return (
    <StaffClient
      team={Array.isArray(team) ? team : []}
      pending={Array.isArray(pending) ? pending : []}
      currentUserId={user.id}
    />
  )
}
