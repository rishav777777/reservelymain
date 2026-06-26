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

  // Fetch profile first so all subsequent queries are scoped to this user's restaurant
  const profileResult = await supabase
    .from('profiles')
    .select('*, restaurants(*)')
    .eq('id', user.id)
    .single()

  const profile = profileResult.data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const restaurant = (profile as any)?.restaurants as Record<string, unknown> | null
  const ownRestaurantId = (restaurant?.id as string) ?? null

  if (!ownRestaurantId) {
    redirect('/login')
  }

  const [reservationsResult, noticesResult, tablesResult, openingHoursResult] =
    await Promise.all([
      supabase
        .from('reservations')
        .select('*, restaurant_tables(name, capacity, category)')
        .eq('restaurant_id', ownRestaurantId)
        .eq('reservation_date', today)
        .order('reservation_time', { ascending: true }),
      supabase
        .from('notices')
        .select('*')
        .eq('restaurant_id', ownRestaurantId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('restaurant_tables')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', ownRestaurantId)
        .eq('is_active', true),
      supabase
        .from('opening_hours')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', ownRestaurantId)
        .eq('is_open', true),
    ])

  const reservations: Reservation[] = reservationsResult.data ?? []
  const notices: Notice[] = noticesResult.data ?? []
  const totalTables = tablesResult.count ?? 0
  const openingHoursCount = openingHoursResult.count ?? 0

  const restaurantId    = ownRestaurantId
  const restaurantSlug  = (restaurant?.slug as string) ?? ''
  const restaurantName  = (restaurant?.name as string) ?? 'Your Restaurant'

  // Trial banner data
  const subscriptionStatus = (restaurant?.subscription_status as string) ?? 'trialing'
  const trialEndsAt = restaurant?.trial_ends_at as string | null
  let trialDaysLeft: number | null = null
  if (subscriptionStatus === 'trialing' && trialEndsAt) {
    const msLeft = new Date(trialEndsAt).getTime() - Date.now()
    trialDaysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
  }

  const setupCompleted          = Boolean(restaurant?.setup_completed)
  const openingHoursConfigured  = openingHoursCount > 0
  const hasTablesConfigured     = totalTables > 0

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
      totalTables={totalTables}
      trialDaysLeft={trialDaysLeft}
      subscriptionStatus={subscriptionStatus}
      setupCompleted={setupCompleted}
      restaurantId={restaurantId}
      restaurantSlug={restaurantSlug}
      restaurantName={restaurantName}
      openingHoursConfigured={openingHoursConfigured}
      hasTablesConfigured={hasTablesConfigured}
      today={today}
    />
  )
}
