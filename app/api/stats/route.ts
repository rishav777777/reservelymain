import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ISR: safe because this is aggregate public data — no per-tenant content.
export const revalidate = 3600

// GET /api/stats
// Returns aggregate counts for the landing page stats strip.
// Responds with fallback values on DB error so the page always renders.
export async function GET() {
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [bookingsRes, restaurantsRes] = await Promise.all([
      admin
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .in('status', ['confirmed', 'arrived', 'completed']),
      admin
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
    ])

    return NextResponse.json({
      bookings:    bookingsRes.count   ?? 2400,
      restaurants: restaurantsRes.count ?? 40,
    })
  } catch {
    return NextResponse.json({ bookings: 2400, restaurants: 40 })
  }
}
