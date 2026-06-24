import { createClient } from '@/lib/supabase/server'
import { logAction } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'

const VALID_STATUSES = new Set(['inquiry', 'confirmed', 'cancelled', 'completed'])

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
    .select('restaurant_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role === 'staff') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('group_bookings')
    .select('id, restaurant_id, organizer_name, status')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Group booking not found' }, { status: 404 })
  }

  if (existing.restaurant_id !== profile.restaurant_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  const patch: Record<string, unknown> = {}

  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 422 })
    }
    patch.status = body.status
  }

  if (body.notes !== undefined)            patch.notes            = body.notes?.toString().slice(0, 1000) ?? null
  if (body.deposit_required !== undefined) patch.deposit_required = Boolean(body.deposit_required)
  if (body.deposit_amount !== undefined)   patch.deposit_amount   = body.deposit_amount !== null ? Number(body.deposit_amount) : null
  if (body.deposit_paid_at !== undefined)  patch.deposit_paid_at  = body.deposit_paid_at ?? null

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('group_bookings')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAction({
    restaurant_id: profile.restaurant_id,
    actor_id:      user.id,
    actor_name:    profile.full_name ?? null,
    action:        `group_booking.${patch.status ?? 'updated'}`,
    target_type:   'group_booking',
    target_id:     id,
    metadata: { organizer: existing.organizer_name, new_status: patch.status ?? existing.status },
  }).catch(() => {})

  return NextResponse.json(data)
}
