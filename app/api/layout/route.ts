import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ─── GET /api/layout?restaurantId=xxx ──────────────────────────────────────
// Public endpoint — called by /book (Screen2) to get zones + table positions
export async function GET(request: NextRequest) {
  try {
    const restaurantId = request.nextUrl.searchParams.get('restaurantId')
    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [{ data: zones }, { data: tables }] = await Promise.all([
      admin
        .from('floor_zones')
        .select('id, label, x, y, w, h, is_seasonal, season_start, season_end, is_open')
        .eq('restaurant_id', restaurantId)
        .order('created_at'),
      admin
        .from('restaurant_tables')
        .select('id, name, capacity, category, x, y, w, h')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true),
    ])

    return NextResponse.json({
      zones:  zones  ?? [],
      tables: tables ?? [],
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}

// ─── POST /api/layout ──────────────────────────────────────────────────────
// Authenticated — called by layout editor on "Save Configurations"
// Body: { zones: Zone[], tables: TableItem[] }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('restaurant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role === 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { zones, tables } = await request.json()
    const restaurantId = profile.restaurant_id

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Zones: upsert preserving IDs (so table zone_id FKs survive) ────────
    type ZonePayload = {
      id: string; label: string; x: number; y: number; w: number; h: number
      is_seasonal: boolean; season_start: string | null; season_end: string | null; is_open: boolean
    }

    if (zones?.length) {
      const incomingIds = (zones as ZonePayload[]).map(z => z.id)

      // Delete zones no longer present
      const { data: existing } = await admin
        .from('floor_zones').select('id').eq('restaurant_id', restaurantId)
      const toDelete = (existing ?? []).map((e: { id: string }) => e.id).filter((id: string) => !incomingIds.includes(id))
      if (toDelete.length) {
        await admin.from('floor_zones').delete().in('id', toDelete)
      }

      const zoneRows = (zones as ZonePayload[]).map(z => ({
        id:            z.id,
        restaurant_id: restaurantId,
        label:         z.label,
        x:             Math.round(z.x),
        y:             Math.round(z.y),
        w:             Math.round(z.w),
        h:             Math.round(z.h),
        is_seasonal:   z.is_seasonal  ?? false,
        season_start:  z.season_start || null,
        season_end:    z.season_end   || null,
        is_open:       z.is_open      ?? true,
      }))
      const { error: zoneErr } = await admin
        .from('floor_zones')
        .upsert(zoneRows, { onConflict: 'id' })
      if (zoneErr) return NextResponse.json({ error: zoneErr.message }, { status: 500 })
    } else {
      await admin.from('floor_zones').delete().eq('restaurant_id', restaurantId)
    }

    // ── Tables: upsert + deactivate removed (preserve IDs so reservations stay linked) ─
    const { data: existingTables } = await admin
      .from('restaurant_tables')
      .select('id, name')
      .eq('restaurant_id', restaurantId)

    const existingByName: Record<string, string> = {}
    ;(existingTables ?? []).forEach((t: { id: string; name: string }) => {
      existingByName[t.name] = t.id
    })

    if (tables?.length) {
      const incomingNames = new Set(
        (tables as Array<{ name: string }>).map(t => t.name)
      )

      // Deactivate tables removed from the layout (soft-delete preserves reservation history)
      const toDeactivate = (existingTables ?? [])
        .filter((t: { name: string }) => !incomingNames.has(t.name))
        .map((t: { id: string }) => t.id)
      if (toDeactivate.length) {
        await admin
          .from('restaurant_tables')
          .update({ is_active: false })
          .in('id', toDeactivate)
      }

      for (const tb of tables as Array<{
        id: string; name: string; capacity: number; category: string;
        x: number; y: number; w: number; h: number
      }>) {
        const existingId = existingByName[tb.name]

        if (existingId) {
          await admin
            .from('restaurant_tables')
            .update({
              category:  tb.category,
              x:         Math.round(tb.x),
              y:         Math.round(tb.y),
              w:         Math.round(tb.w),
              h:         Math.round(tb.h),
              is_active: true,
            })
            .eq('id', existingId)
        } else {
          await admin
            .from('restaurant_tables')
            .insert({
              id:            tb.id,
              restaurant_id: restaurantId,
              name:          tb.name,
              capacity:      tb.capacity,
              category:      tb.category,
              x:             Math.round(tb.x),
              y:             Math.round(tb.y),
              w:             Math.round(tb.w),
              h:             Math.round(tb.h),
              is_active:     true,
            })
        }
      }
    } else {
      // All tables removed — deactivate everything
      const allIds = (existingTables ?? []).map((t: { id: string }) => t.id)
      if (allIds.length) {
        await admin
          .from('restaurant_tables')
          .update({ is_active: false })
          .in('id', allIds)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
