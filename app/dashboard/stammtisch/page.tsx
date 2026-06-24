import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StammtischClient } from '@/components/stammtisch/StammtischClient'

export default async function StammtischPage() {
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

  const { data: tables } = await supabase
    .from('restaurant_tables')
    .select('id, name, capacity')
    .eq('restaurant_id', profile.restaurant_id)
    .eq('is_active', true)
    .order('name')

  return (
    <StammtischClient
      restaurantId={profile.restaurant_id}
      tables={tables ?? []}
    />
  )
}
