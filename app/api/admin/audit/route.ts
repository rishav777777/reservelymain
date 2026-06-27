import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

const PAGE_SIZE = 100

export async function GET(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const page         = Math.max(0, parseInt(searchParams.get('page') ?? '0'))
  const action       = searchParams.get('action') ?? ''
  const restaurantId = searchParams.get('restaurant_id') ?? ''

  const admin = getAdminClient()

  let query = admin
    .from('audit_logs')
    .select('id, created_at, restaurant_id, actor_id, actor_name, action, target_type, target_id, metadata, restaurants(name)')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (action)       query = query.eq('action', action)
  if (restaurantId) query = query.eq('restaurant_id', restaurantId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    logs:      data ?? [],
    page,
    page_size: PAGE_SIZE,
    has_more:  (data ?? []).length === PAGE_SIZE,
  })
}
