import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TablesClient } from './TablesClient'
import { RestaurantTable } from '@/types'

export default async function TablesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('restaurant_id, role').eq('id', user.id).single()
  if (!profile?.restaurant_id) redirect('/login')

  const restaurantId = profile.restaurant_id
  const userRole = (profile?.role ?? 'staff') as 'owner' | 'manager' | 'staff'

  const { data: tables } = await supabase
    .from('restaurant_tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name', { ascending: true })

  return <TablesClient tables={(tables ?? []) as RestaurantTable[]} restaurantId={restaurantId} userRole={userRole} />
}
