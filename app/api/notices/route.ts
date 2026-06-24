import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// ─── GET /api/notices ──────────────────────────────────────────────────────
// Returns active (non-expired) notices for the authenticated user's restaurant.
export async function GET(_request: NextRequest) {
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

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ notices: data ?? [] })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { content } = body as { content: string }

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (profile.role === 'staff') {
    return NextResponse.json({ error: 'Forbidden — staff cannot create notices' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('notices')
    .insert({
      restaurant_id: profile.restaurant_id,
      content:       content.trim().slice(0, 1000),
      created_by:    user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
