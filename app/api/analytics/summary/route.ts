import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date().toISOString().split('T')[0]

  const [todayRes, pendingRes, coversRes] = await Promise.all([
    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', profile.restaurant_id)
      .eq('reservation_date', today)
      .not('status', 'in', '("cancelled","rejected")'),
    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('restaurant_id', profile.restaurant_id)
      .eq('reservation_date', today)
      .eq('status', 'pending'),
    supabase
      .from('reservations')
      .select('party_size')
      .eq('restaurant_id', profile.restaurant_id)
      .eq('reservation_date', today)
      .not('status', 'in', '("cancelled","rejected")'),
  ])

  const covers = (coversRes.data ?? []).reduce((sum, r) => sum + (r.party_size ?? 0), 0)

  return NextResponse.json({
    today_reservations: todayRes.count ?? 0,
    pending_count:      pendingRes.count ?? 0,
    today_covers:       covers,
  })
}
