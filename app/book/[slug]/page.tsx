import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookingClient } from '@/components/booking/BookingClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BookSlugPage({ params }: Props) {
  const { slug } = await params

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  type Restaurant = {
    id: string
    name: string
    booking_enabled: boolean
    advance_booking_days: number | null
    max_party_size: number | null
    default_duration_minutes?: number | null
  }

  const { data: r1, error: e1 } = await admin
    .from('restaurants')
    .select('id, name, booking_enabled, advance_booking_days, max_party_size, default_duration_minutes')
    .eq('slug', slug)
    .single()

  let restaurant: Restaurant | null
  if (e1?.message?.toLowerCase().includes('does not exist')) {
    // default_duration_minutes column not yet added — fall back to base columns
    const { data: r2 } = await admin
      .from('restaurants')
      .select('id, name, booking_enabled, advance_booking_days, max_party_size')
      .eq('slug', slug)
      .single()
    restaurant = r2 as Restaurant | null
  } else {
    restaurant = r1 as Restaurant | null
  }

  if (!restaurant) notFound()

  // Booking disabled — show static message, no form
  if (!restaurant.booking_enabled) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F4F6F4',
        fontFamily: "'DM Sans', sans-serif",
        padding: '24px',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '360px',
          background: 'rgba(255,255,255,0.6)',
          border: '1.5px solid rgba(255,255,255,0.7)',
          borderRadius: '24px',
          padding: '40px 32px',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍽️</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: '#1C231F', marginBottom: '12px' }}>
            {restaurant.name}
          </h1>
          <p style={{ fontSize: '14px', color: '#6A7A76', lineHeight: 1.6 }}>
            Online reservations are currently unavailable. Please contact the restaurant directly to make a booking.
          </p>
        </div>
      </div>
    )
  }

  // Fetch opening hours scoped to this restaurant (admin bypasses RLS — must filter explicitly)
  const { data: openingHours } = await admin
    .from('opening_hours')
    .select('day_of_week, is_open, open_time, last_booking')
    .eq('restaurant_id', restaurant.id)
    .order('day_of_week')

  // closed_days: set of getDow-compatible indices (0=Mon … 6=Sun)
  // DB: day_of_week uses 0=Sun … 6=Sat → convert: (db + 6) % 7
  const closedDays = new Set<number>(
    (openingHours ?? [])
      .filter((h) => !h.is_open)
      .map((h) => (h.day_of_week + 6) % 7)
  )

  // Map getDow index → {open, last} for dynamic time slot generation in Screen1
  const openingHoursMap: Record<number, { open: string; last: string | null }> = {}
  for (const h of openingHours ?? []) {
    if (!h.is_open) continue
    const dow = (h.day_of_week + 6) % 7
    openingHoursMap[dow] = {
      open: (h.open_time as string).slice(0, 5),
      last: h.last_booking ? (h.last_booking as string).slice(0, 5) : null,
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <BookingClient
          restaurantId={restaurant.id}
          restaurantSlug={slug}
          restaurantName={restaurant.name}
          closedDays={closedDays}
          advanceBookingDays={restaurant.advance_booking_days ?? 90}
          openingHoursMap={openingHoursMap}
          maxPartySize={restaurant.max_party_size ?? undefined}
          defaultDuration={restaurant.default_duration_minutes ?? 90}
        />
      </div>
      <footer className="py-4 px-6 border-t border-zinc-100 bg-white">
        <div className="max-w-lg mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {[
            { href: '/privacy',   label: 'Privacy Policy' },
            { href: '/cookies',   label: 'Cookie Policy' },
            { href: '/terms',     label: 'Terms of Service' },
            { href: '/impressum', label: 'Impressum' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} target="_blank"
              className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors">
              {label}
            </Link>
          ))}
          <span className="text-[11px] text-zinc-300">· Powered by Reservely</span>
        </div>
      </footer>
    </div>
  )
}
