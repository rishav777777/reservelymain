import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GroupsClient } from '@/components/groups/GroupsClient'
import type { GroupBooking } from '@/types'

export default async function GroupsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'staff') redirect('/dashboard')

  const { data: groups } = await supabase
    .from('group_bookings')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('event_date', { ascending: true })

  return (
    <GroupsClient
      initialGroups={(groups ?? []) as GroupBooking[]}
    />
  )
}
