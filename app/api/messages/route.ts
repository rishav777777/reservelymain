import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reservationId = searchParams.get('reservation_id')

  if (!reservationId) {
    return NextResponse.json({ error: 'reservation_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify the reservation belongs to this restaurant before fetching messages
  const { data: resCheck } = await supabase
    .from('reservations')
    .select('id')
    .eq('id', reservationId)
    .eq('restaurant_id', profile.restaurant_id)
    .single()
  if (!resCheck) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('reservation_id', reservationId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { reservation_id, sender_type, sender_name, content } = body as {
    reservation_id: string
    sender_type:    'guest' | 'restaurant'
    sender_name?:   string
    content:        string
  }

  if (!reservation_id || !sender_type || !content?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!['guest', 'restaurant'].includes(sender_type)) {
    return NextResponse.json({ error: 'Invalid sender_type' }, { status: 422 })
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify reservation belongs to this restaurant before inserting a message
  const { data: resCheck } = await supabase
    .from('reservations')
    .select('id')
    .eq('id', reservation_id)
    .eq('restaurant_id', profile.restaurant_id)
    .single()
  if (!resCheck) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('messages')
    .insert({
      reservation_id,
      sender_type,
      sender_name: sender_name?.trim() ?? null,
      content:     content.trim().slice(0, 2000),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
