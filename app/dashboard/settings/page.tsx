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
    .select('restaurant_id, role')
    .single()

  if (profile?.role === 'staff') redirect('/dashboard')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, phone, address, slug, description, email, subdomain, created_at, timezone, booking_enabled, max_party_size, owner_whatsapp, wa_notifications, wa_daily_summary')
    .eq('id', profile?.restaurant_id)
    .single()

  return <SettingsClient restaurant={restaurant as Restaurant} isOwner={profile?.role === 'owner'} />
}
