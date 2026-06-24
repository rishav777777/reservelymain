import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: guest, error } = await supabase
    .from('guest_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !guest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (profile?.restaurant_id !== guest.restaurant_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch last 20 reservations for this guest (matched by email)
  const { data: history } = await supabase
    .from('reservations')
    .select('id, reservation_date, reservation_time, party_size, status, special_requests, restaurant_tables(name)')
    .eq('restaurant_id', guest.restaurant_id)
    .eq('guest_email', guest.email)
    .order('reservation_date', { ascending: false })
    .limit(20)

  return NextResponse.json({ guest, history: history ?? [] })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: guest } = await supabase
    .from('guest_profiles')
    .select('restaurant_id')
    .eq('id', id)
    .single()

  if (!guest) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.restaurant_id !== guest.restaurant_id || profile.role === 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const allowed: Record<string, unknown> = {}
  if (typeof body.notes        === 'string'  || body.notes        === null) allowed.notes        = body.notes
  if (typeof body.is_stammgast === 'boolean')                                allowed.is_stammgast = body.is_stammgast
  if (typeof body.preferences  === 'object'  && body.preferences !== null)   allowed.preferences  = body.preferences

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('guest_profiles')
    .update(allowed)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
