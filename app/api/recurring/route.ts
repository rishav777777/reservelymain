import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export async function GET(request: NextRequest) {
  const restaurantId = request.nextUrl.searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('recurring_reservations')
    .select('*, restaurant_tables(name, capacity)')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const withLabels = (data ?? []).map(r => ({
    ...r,
    day_label: DAY_LABELS[r.day_of_week] ?? '?',
  }))

  return NextResponse.json(withLabels)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { guest_name, party_size, day_of_week, start_time, table_id,
          duration_minutes, label, notes, guest_email, guest_phone,
          effective_from, effective_until } = body

  if (!guest_name?.trim() || !party_size || day_of_week === undefined || !start_time) {
    return NextResponse.json({ error: 'guest_name, party_size, day_of_week, start_time required' }, { status: 400 })
  }
  if (day_of_week < 0 || day_of_week > 6) {
    return NextResponse.json({ error: 'day_of_week must be 0–6' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('recurring_reservations')
    .insert({
      restaurant_id:    profile.restaurant_id,
      guest_name:       guest_name.trim(),
      guest_email:      guest_email ?? null,
      guest_phone:      guest_phone ?? null,
      party_size:       Number(party_size),
      day_of_week:      Number(day_of_week),
      start_time,
      duration_minutes: Number(duration_minutes ?? 120),
      table_id:         table_id ?? null,
      label:            label ?? null,
      notes:            notes ?? null,
      effective_from:   effective_from ?? new Date().toISOString().split('T')[0],
      effective_until:  effective_until ?? null,
      is_active:        true,
    })
    .select('*, restaurant_tables(name, capacity)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
