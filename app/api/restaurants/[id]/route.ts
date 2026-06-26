import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_FIELDS = new Set([
  'name', 'description', 'address', 'phone', 'email',
  'cuisine_type', 'city', 'cover_image_url',
  'timezone', 'booking_enabled', 'max_party_size',
  'max_covers_per_slot', 'default_duration_minutes',
  'owner_whatsapp', 'wa_notifications', 'wa_daily_summary',
  'setup_completed',
])

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.restaurant_id !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 8) + '01'

  const [restaurantRes, todayRes, monthRes, pendingRes, guestsRes] = await Promise.all([
    supabase.from('restaurants').select('*').eq('id', id).single(),
    supabase.from('reservations').select('id', { count: 'exact', head: true })
      .eq('restaurant_id', id).eq('reservation_date', today)
      .in('status', ['confirmed', 'arrived']),
    supabase.from('reservations').select('id', { count: 'exact', head: true })
      .eq('restaurant_id', id).gte('reservation_date', monthStart)
      .not('status', 'in', '("rejected","cancelled")'),
    supabase.from('reservations').select('id', { count: 'exact', head: true })
      .eq('restaurant_id', id).eq('status', 'pending'),
    supabase.from('guest_profiles').select('id', { count: 'exact', head: true })
      .eq('restaurant_id', id),
  ])

  if (restaurantRes.error) {
    return NextResponse.json({ error: restaurantRes.error.message }, { status: 500 })
  }

  return NextResponse.json({
    restaurant: restaurantRes.data,
    stats: {
      today_reservations: todayRes.count  ?? 0,
      month_reservations: monthRes.count  ?? 0,
      pending_count:      pendingRes.count ?? 0,
      total_guests:       guestsRes.count  ?? 0,
    },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.restaurant_id !== id || profile.role === 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  // Strip any fields not in the allowed list
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(key)) patch[key] = value
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const { error } = await supabase
    .from('restaurants')
    .update(patch)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
