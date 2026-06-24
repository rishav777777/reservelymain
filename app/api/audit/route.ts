import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const PAGE_SIZE = 50

export async function GET(request: NextRequest) {
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
  if (profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden — audit log is owner-only' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page   = Math.max(0, parseInt(searchParams.get('page') ?? '0'))
  const from   = searchParams.get('from')
  const to     = searchParams.get('to')
  const action = searchParams.get('action')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = admin
    .from('audit_logs')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (from)   query = query.gte('created_at', from)
  if (to)     query = query.lte('created_at', to)
  if (action) query = query.eq('action', action)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    logs:      data ?? [],
    page,
    page_size: PAGE_SIZE,
    has_more:  (data ?? []).length === PAGE_SIZE,
  })
}
