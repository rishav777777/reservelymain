import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QuickModeClient } from '@/components/dashboard/QuickModeClient'

export default async function QuickModePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) redirect('/login')

  return (
    <QuickModeClient
      restaurantId={profile.restaurant_id}
      staffName={profile.full_name ?? 'Staff'}
    />
  )
}
