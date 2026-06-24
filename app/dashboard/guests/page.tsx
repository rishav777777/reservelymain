import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GuestsClient } from '@/components/guests/GuestsClient'

export default async function GuestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) redirect('/login')
  if (profile.role === 'staff') redirect('/dashboard')

  return <GuestsClient restaurantId={profile.restaurant_id} />
}
