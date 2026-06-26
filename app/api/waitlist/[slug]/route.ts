import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await request.json()
  const {
    guest_name,
    guest_email,
    guest_phone  = null,
    party_size,
    requested_date,
    requested_time = null,
    notes          = null,
  } = body as {
    guest_name:     string
    guest_email:    string
    guest_phone?:   string | null
    party_size:     number
    requested_date: string
    requested_time?: string | null
    notes?:         string | null
  }

  if (!guest_name?.trim() || !guest_email?.trim() || !party_size || !requested_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 })
  }
  if (!EMAIL_RE.test(guest_email.trim())) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }

  const { error } = await admin
    .from('waitlist_entries')
    .insert({
      restaurant_id:  restaurant.id,
      guest_name:     guest_name.trim(),
      guest_email:    guest_email.trim().toLowerCase(),
      guest_phone:    guest_phone?.trim() || null,
      party_size,
      requested_date,
      requested_time: requested_time || null,
      notes:          notes?.trim() || null,
      status:         'waiting',
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
