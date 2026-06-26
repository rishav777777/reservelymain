import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { QuickBookForm } from '@/components/booking/QuickBookForm'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function QuickBookPage({ params }: Props) {
  const { slug } = await params

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name, booking_enabled, advance_booking_days, max_party_size, default_duration_minutes')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  if (!restaurant.booking_enabled) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA', fontFamily: 'system-ui, sans-serif', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '340px' }}>
          <p style={{ fontSize: '28px', marginBottom: '12px' }}>🍽️</p>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>{restaurant.name}</h1>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
            Online reservations are currently unavailable. Please contact the restaurant directly.
          </p>
        </div>
      </div>
    )
  }

  // Opening hours for time slots
  const { data: openingHours } = await admin
    .from('opening_hours')
    .select('day_of_week, is_open, open_time, last_booking')
    .eq('restaurant_id', restaurant.id)
    .order('day_of_week')

  // Build openingHoursMap keyed by getDow (0=Mon … 6=Sun)
  const openingHoursMap: Record<number, { open: string; last: string | null }> = {}
  for (const h of openingHours ?? []) {
    if (!h.is_open) continue
    const dow = (h.day_of_week + 6) % 7
    openingHoursMap[dow] = {
      open: (h.open_time as string).slice(0, 5),
      last: h.last_booking ? (h.last_booking as string).slice(0, 5) : null,
    }
  }

  const closedDows = new Set<number>(
    (openingHours ?? []).filter((h) => !h.is_open).map((h) => (h.day_of_week + 6) % 7)
  )

  return (
    <QuickBookForm
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      advanceBookingDays={restaurant.advance_booking_days ?? 90}
      maxPartySize={restaurant.max_party_size ?? 20}
      defaultDuration={restaurant.default_duration_minutes ?? 90}
      openingHoursMap={openingHoursMap}
      closedDows={closedDows}
    />
  )
}
