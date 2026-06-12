import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'
import { Restaurant } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .single()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', profile?.restaurant_id)
    .single()

  return <SettingsClient restaurant={restaurant as Restaurant} />
}
