import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DEFAULT_ROW = (restaurantId: string, day: number) => ({
  restaurant_id: restaurantId,
  day_of_week:   day,
  is_open:       true,
  open_time:     '11:00',
  close_time:    '22:00',
  last_booking:  '21:00',
})

export async function GET(request: NextRequest) {
  const restaurantId = request.nextUrl.searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('opening_hours')
    .select('id, day_of_week, is_open, open_time, close_time, last_booking')
    .eq('restaurant_id', restaurantId)
    .order('day_of_week')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return stable 7-element array — fill missing days with defaults
  const byDay = Object.fromEntries((data ?? []).map(r => [r.day_of_week, r]))
  const hours = Array.from({ length: 7 }, (_, i) => ({
    label: DAY_LABELS[i],
    ...(byDay[i] ?? DEFAULT_ROW(restaurantId, i)),
  }))

  return NextResponse.json(hours)
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { restaurantId, hours } = await request.json()
  if (!restaurantId || !Array.isArray(hours)) {
    return NextResponse.json({ error: 'restaurantId and hours[] required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.restaurant_id !== restaurantId || profile.role === 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  for (const h of hours) {
    if (!h.is_open) continue
    const { open_time, close_time, last_booking } = h
    if (open_time && close_time && open_time >= close_time) {
      return NextResponse.json({ error: `Day ${h.day_of_week}: opening time must be before closing time` }, { status: 400 })
    }
    if (close_time && last_booking && last_booking > close_time) {
      return NextResponse.json({ error: `Day ${h.day_of_week}: last booking time must not be after closing time` }, { status: 400 })
    }
    if (open_time && last_booking && last_booking <= open_time) {
      return NextResponse.json({ error: `Day ${h.day_of_week}: last booking time must be after opening time` }, { status: 400 })
    }
  }

  const rows = hours.map((h: {
    day_of_week: number
    is_open: boolean
    open_time: string | null
    close_time: string | null
    last_booking: string | null
  }) => ({
    restaurant_id: restaurantId,
    day_of_week:   h.day_of_week,
    is_open:       h.is_open,
    open_time:     h.is_open ? h.open_time  : null,
    close_time:    h.is_open ? h.close_time : null,
    last_booking:  h.is_open ? h.last_booking : null,
  }))

  const { error } = await supabase
    .from('opening_hours')
    .upsert(rows, { onConflict: 'restaurant_id,day_of_week' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
