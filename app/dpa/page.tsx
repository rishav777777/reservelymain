import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { DpaClient } from './DpaClient'

export default async function DpaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) redirect('/login')

  // Non-owners are not required to sign — only the account owner is
  if (profile.role !== 'owner') redirect('/dashboard')

  const admin = getAdminClient()
  const { data: restaurant } = await admin
    .from('restaurants')
    .select('name, dpa_signed_at')
    .eq('id', profile.restaurant_id)
    .single()

  // Already signed — send straight to dashboard
  if (restaurant?.dpa_signed_at) redirect('/dashboard')

  return <DpaClient restaurantName={restaurant?.name ?? 'your restaurant'} ownerName={profile.full_name ?? ''} />
}
