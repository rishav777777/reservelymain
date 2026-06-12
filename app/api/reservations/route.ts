import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('reservations')
    .select('*, restaurant_tables(name, capacity, category)')
    .eq('reservation_date', today)
    .order('reservation_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    guest_name,
    guest_email,
    guest_phone,
    party_size,
    reservation_date,
    reservation_time,
    category,
    special_requests,
    status = 'pending',
  } = body

  if (!guest_name?.trim() || !guest_email?.trim() || !party_size || !reservation_date || !reservation_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const refCode = 'RSV-' + Math.random().toString(36).toUpperCase().slice(2, 8)

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      restaurant_id: profile.restaurant_id,
      reference_code: refCode,
      guest_name: guest_name.trim(),
      guest_email: guest_email.trim(),
      guest_phone: guest_phone?.trim() ?? null,
      party_size,
      reservation_date,
      reservation_time,
      category: category ?? null,
      special_requests: special_requests?.trim() ?? null,
      status,
      is_walk_in: false,
    })
    .select('*, restaurant_tables(name, capacity, category)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
