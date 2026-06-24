import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('restaurant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can export data' }, { status: 403 })
    }

    const restaurantId = profile.restaurant_id

    const [
      { data: reservations },
      { data: tables },
      { data: staff },
      { data: restaurant },
      { data: guestProfiles },
    ] = await Promise.all([
      supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false }),
      supabase
        .from('restaurant_tables')
        .select('id, name, capacity, category, is_active, created_at')
        .eq('restaurant_id', restaurantId)
        .order('name'),
      supabase
        .from('profiles')
        .select('id, full_name, email, role, is_active, created_at')
        .eq('restaurant_id', restaurantId)
        .order('role'),
      supabase
        .from('restaurants')
        .select('id, name, created_at')
        .eq('id', restaurantId)
        .single(),
      supabase
        .from('guest_profiles')
        .select('id, email, name, phone, visit_count, first_visit, last_visit, is_stammgast, preferences, notes, created_at')
        .eq('restaurant_id', restaurantId)
        .order('visit_count', { ascending: false }),
    ])

    const exportDate = new Date().toISOString().split('T')[0]

    const payload = {
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      restaurant: restaurant ?? {},
      summary: {
        total_reservations: (reservations ?? []).length,
        total_tables:       (tables ?? []).length,
        total_staff:        (staff ?? []).length,
        total_guests:       (guestProfiles ?? []).length,
      },
      reservations:  reservations ?? [],
      tables:        tables ?? [],
      staff:         staff ?? [],
      guest_profiles: guestProfiles ?? [],
    }

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="reservely-export-${exportDate}.json"`,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
