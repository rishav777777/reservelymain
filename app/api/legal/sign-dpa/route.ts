import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'

const DPA_CURRENT_VERSION = '1.0'

// POST /api/legal/sign-dpa
// Records the restaurant owner's acceptance of the Data Processing Agreement.
// Called once during onboarding; subsequent dashboard access checks dpa_signed_at.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only restaurant owners can sign the DPA' }, { status: 403 })
  }

  const admin = getAdminClient()

  // Idempotent — already signed
  const { data: restaurant } = await admin
    .from('restaurants')
    .select('dpa_signed_at, name')
    .eq('id', profile.restaurant_id)
    .single()

  if (restaurant?.dpa_signed_at) {
    return NextResponse.json({ ok: true, already_signed: true })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
       ?? request.headers.get('x-real-ip')
       ?? null

  const { error } = await admin
    .from('restaurants')
    .update({
      dpa_signed_at: new Date().toISOString(),
      dpa_version:   DPA_CURRENT_VERSION,
    })
    .eq('id', profile.restaurant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  logAction({
    restaurant_id: profile.restaurant_id,
    actor_id:      user.id,
    actor_name:    null,
    action:        'dpa.signed',
    target_type:   'restaurant',
    target_id:     profile.restaurant_id,
    metadata:      { version: DPA_CURRENT_VERSION, ip },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
