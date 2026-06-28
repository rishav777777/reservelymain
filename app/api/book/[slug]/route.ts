import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getClientIp } from '@/lib/ratelimit'
import { sendConfirmationEmail } from '@/lib/services/email'

export const runtime = 'edge'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

let limiter: Ratelimit | null = null
function getRateLimiter() {
  if (!limiter && process.env.UPSTASH_REDIS_REST_URL) {
    limiter = new Ratelimit({
      redis: new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(8, '10 m'),
      prefix: 'rl:guest_book',
    })
  }
  return limiter
}

type BookingBody = {
  guest_name:         string
  guest_email:        string
  guest_phone?:       string | null
  party_size:         number
  reservation_date:   string
  reservation_time:   string
  table_id?:          string | null
  menu_preference?:   string | null
  notes?:             string | null
  duration_minutes?:  number
  guest_consented?:   boolean
  profiling_consent?: boolean
  marketing_consent?: boolean
  session_id?:        string | null
}

// POST /api/book/[slug]
// Public — called by the guest booking portal (Screen3) to create a reservation.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const rl = getRateLimiter()

  // Parallelize: rate limit check + body parse run at the same time
  const [rateLimitResult, body] = await Promise.all([
    rl ? rl.limit(getClientIp(request)) : Promise.resolve({ success: true }),
    request.json() as Promise<BookingBody>,
  ])

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes and try again.' },
      { status: 429 }
    )
  }

  const {
    guest_name,
    guest_email,
    guest_phone       = null,
    party_size,
    reservation_date,
    reservation_time,
    table_id          = null,
    menu_preference   = null,
    notes             = null,
    duration_minutes  = 90,
    guest_consented   = false,
    profiling_consent = false,
    marketing_consent = false,
    session_id        = null,
  } = body

  // Validate required fields
  if (!guest_name?.trim() || !guest_email?.trim() || !party_size || !reservation_date || !reservation_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 })
  }
  if (!EMAIL_RE.test(guest_email.trim())) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 })
  }
  if (guest_name.trim().length > 200) {
    return NextResponse.json({ error: 'Name too long' }, { status: 422 })
  }
  if (party_size < 1 || party_size > 500) {
    return NextResponse.json({ error: 'Invalid party size' }, { status: 422 })
  }
  if (notes && notes.length > 2000) {
    return NextResponse.json({ error: 'Notes must be 2000 characters or fewer' }, { status: 422 })
  }
  if (menu_preference && menu_preference.length > 500) {
    return NextResponse.json({ error: 'Menu preference must be 500 characters or fewer' }, { status: 422 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name, booking_enabled, max_party_size, max_covers_per_slot, default_duration_minutes')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }
  if (!restaurant.booking_enabled) {
    return NextResponse.json({ error: 'Online booking is currently unavailable' }, { status: 409 })
  }
  if (restaurant.max_party_size && party_size > restaurant.max_party_size) {
    return NextResponse.json(
      { error: `Maximum party size is ${restaurant.max_party_size}` },
      { status: 422 }
    )
  }

  // Capacity check: count covers already booked at this timeslot
  if (restaurant.max_covers_per_slot) {
    const { data: slotRes } = await admin
      .from('reservations')
      .select('party_size')
      .eq('restaurant_id', restaurant.id)
      .eq('reservation_date', reservation_date)
      .eq('reservation_time', reservation_time)
      .in('status', ['pending', 'confirmed', 'arrived'])

    const coveredSoFar = (slotRes ?? []).reduce((sum: number, r: { party_size: number }) => sum + r.party_size, 0)
    if (coveredSoFar + party_size > restaurant.max_covers_per_slot) {
      return NextResponse.json(
        {
          error: `This time slot is fully booked (${coveredSoFar}/${restaurant.max_covers_per_slot} covers taken). Please choose a different time or join the waitlist.`,
          waitlist_eligible: true,
          slot_full: true,
        },
        { status: 409 }
      )
    }
  }

  // Cryptographic reference code (Web Crypto — available in Edge runtime)
  const refBytes = new Uint8Array(5)
  crypto.getRandomValues(refBytes)
  const refCode = 'RSV-' + Array.from(refBytes)
    .map(b => b.toString(36).toUpperCase().padStart(2, '0'))
    .join('')
    .slice(0, 8)

  // PII purge date: reservation_date + 60 days
  const purgeDate = new Date(reservation_date)
  purgeDate.setDate(purgeDate.getDate() + 60)

  const { data: reservation, error: insertErr } = await admin
    .from('reservations')
    .insert({
      restaurant_id:        restaurant.id,
      table_id:             table_id || null,
      reference_code:       refCode,
      guest_name:           guest_name.trim(),
      guest_email:          guest_email.trim().toLowerCase(),
      guest_phone:          guest_phone?.trim() || null,
      party_size,
      reservation_date,
      reservation_time,
      duration_minutes:     duration_minutes || restaurant.default_duration_minutes || 90,
      status:               'pending',
      source:               'guest_portal',
      menu_preference:      menu_preference || null,
      notes:                notes?.trim() || null,
      guest_consented,
      consented_at:         guest_consented ? new Date().toISOString() : null,
      profiling_consent,
      profiling_consent_at: profiling_consent ? new Date().toISOString() : null,
      marketing_consent,
      marketing_consent_at: marketing_consent ? new Date().toISOString() : null,
      pii_purge_after:      purgeDate.toISOString(),
    })
    .select('*, restaurant_tables(name, capacity)')
    .single()

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Fire-and-forget: hold release and confirmation email — don't block the response
  if (session_id && table_id) {
    void admin.from('table_holds').delete()
      .eq('restaurant_id', restaurant.id)
      .eq('table_id', table_id)
      .eq('session_id', session_id)
  }

  if (process.env.RESEND_API_KEY) {
    sendConfirmationEmail(reservation as never, restaurant.name).catch(() => {})
  }

  return NextResponse.json(
    { ok: true, reference_code: refCode },
    { status: 201 }
  )
}
