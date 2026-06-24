import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function ownershipGuard(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, recordId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', userId)
    .single()

  if (!profile || profile.role === 'staff') return null

  const { data: record } = await supabase
    .from('recurring_reservations')
    .select('restaurant_id')
    .eq('id', recordId)
    .single()

  if (!record || record.restaurant_id !== profile.restaurant_id) return null

  return profile
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await ownershipGuard(supabase, user.id, id)
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const ALLOWED = new Set([
    'guest_name', 'guest_email', 'guest_phone', 'party_size',
    'day_of_week', 'start_time', 'duration_minutes', 'table_id',
    'label', 'notes', 'effective_until', 'is_active',
  ])

  const patch: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED.has(k)) patch[k] = v
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('recurring_reservations')
    .update(patch)
    .eq('id', id)
    .select('*, restaurant_tables(name, capacity)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await ownershipGuard(supabase, user.id, id)
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Soft delete — preserve history
  const { error } = await supabase
    .from('recurring_reservations')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
