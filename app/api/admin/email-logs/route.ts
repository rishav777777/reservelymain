import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

const PAGE_SIZE = 100

export async function GET(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const page         = Math.max(0, parseInt(searchParams.get('page') ?? '0'))
  const type         = searchParams.get('type') ?? ''
  const status       = searchParams.get('status') ?? ''
  const restaurantId = searchParams.get('restaurant_id') ?? ''

  const admin = getAdminClient()

  let query = admin
    .from('email_logs')
    .select('id, created_at, type, to_email, subject, status, error, restaurant_id, restaurants(name)')
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (type)         query = query.eq('type', type)
  if (status)       query = query.eq('status', status)
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
