import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Runs daily. Hard-deletes restaurants whose 90-day retention window has expired.
// Profiles use ON DELETE SET NULL, so we delete auth users explicitly first.
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find all restaurants past their purge window
  const { data: expired, error } = await admin
    .from('restaurants')
    .select('id, name')
    .not('deleted_at', 'is', null)
    .lte('purge_after', new Date().toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!expired?.length) return NextResponse.json({ ok: true, purged: 0 })

  let purged = 0

  for (const restaurant of expired) {
    try {
      // 1. Get all profile IDs linked to this restaurant (auth user IDs)
      const { data: profiles } = await admin
        .from('profiles')
        .select('id')
        .eq('restaurant_id', restaurant.id)

      // 2. Delete each auth user (profiles row becomes orphaned with restaurant_id = NULL)
      for (const profile of profiles ?? []) {
        await admin.auth.admin.deleteUser(profile.id).catch(() => {})
      }

      // 3. Hard-delete the restaurant — cascades to reservations, tables, floor_zones, etc.
      await admin
        .from('restaurants')
        .delete()
        .eq('id', restaurant.id)

      purged++
    } catch {
      // Log but continue — one failure shouldn't block the rest
    }
  }

  return NextResponse.json({ ok: true, purged })
}
