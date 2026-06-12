import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'
import { Reservation, Notice } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const [profileResult, reservationsResult, noticesResult] = await Promise.all([
    supabase.from('profiles').select('*, restaurants(*)').single(),
    supabase
      .from('reservations')
      .select('*, restaurant_tables(name, capacity, category)')
      .eq('reservation_date', today)
      .order('reservation_time', { ascending: true }),
    supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  const profile = profileResult.data
  const reservations: Reservation[] = reservationsResult.data ?? []
  const notices: Notice[] = noticesResult.data ?? []

  const staffName = profile?.full_name ?? 'Staff'

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const dateLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <DashboardClient
      initialReservations={reservations}
      notices={notices}
      staffName={staffName}
      greeting={greeting}
      dateLabel={dateLabel}
    />
  )
}
