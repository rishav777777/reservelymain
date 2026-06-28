import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// GET /api/restaurants/public
// Returns all booking-enabled, setup-complete restaurants for the public directory.
// Uses service role to bypass RLS — explicitly filters to public-safe records only.
export async function GET() {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await admin
    .from('restaurants')
    .select('id, name, slug, description, cuisine_type, city, address, phone, cover_image_url')
    .eq('booking_enabled', true)
    .not('slug', 'is', null)
    .is('deleted_at', null)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [], {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}
