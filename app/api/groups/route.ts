import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'

// ─── GET /api/groups?restaurantId= ────────────────────────────────────────────
// Authenticated — owner/manager lists all group booking inquiries
export async function GET(request: NextRequest) {
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

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')

  let query = supabase
    .from('group_bookings')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('event_date', { ascending: true })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ groups: data ?? [] })
}

// ─── POST /api/groups ─────────────────────────────────────────────────────────
// Public — guest submits a group booking inquiry (no auth required)
export async function POST(request: NextRequest) {
  const body = await request.json()

  const {
    restaurant_id,
    organizer_name,
    organizer_email,
    organizer_phone,
    group_name,
    party_size,
    event_date,
    start_time,
    end_time,
    menu_type,
    special_requests,
  } = body as {
    restaurant_id:    string
    organizer_name:   string
    organizer_email:  string
    organizer_phone?: string
    group_name?:      string
    party_size:       number
    event_date:       string
    start_time:       string
    end_time?:        string
    menu_type?:       'set_menu' | 'a_la_carte' | 'buffet'
    special_requests?: string
  }

  // Required field validation
  if (!restaurant_id || !organizer_name || !organizer_email || !party_size || !event_date || !start_time) {
    return NextResponse.json(
      { error: 'Missing required fields: restaurant_id, organizer_name, organizer_email, party_size, event_date, start_time' },
      { status: 422 }
    )
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organizer_email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 })
  }

  if (party_size < 1 || party_size > 500) {
    return NextResponse.json({ error: 'Party size must be between 1 and 500' }, { status: 422 })
  }

  const ALLOWED_MENU = new Set(['set_menu', 'a_la_carte', 'buffet'])
  if (menu_type && !ALLOWED_MENU.has(menu_type)) {
    return NextResponse.json({ error: 'Invalid menu_type' }, { status: 422 })
  }

  // Use admin client so unauthenticated guests can insert (RLS allows guest_insert_group policy)
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify the restaurant exists
  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name')
    .eq('id', restaurant_id)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }

  const { data, error } = await admin
    .from('group_bookings')
    .insert({
      restaurant_id,
      organizer_name:   organizer_name.trim().slice(0, 100),
      organizer_email:  organizer_email.trim().toLowerCase(),
      organizer_phone:  organizer_phone?.trim() ?? null,
      group_name:       group_name?.trim().slice(0, 100) ?? null,
      party_size,
      event_date,
      start_time,
      end_time:         end_time ?? null,
      menu_type:        menu_type ?? null,
      special_requests: special_requests?.trim().slice(0, 1000) ?? null,
      status:           'inquiry',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
