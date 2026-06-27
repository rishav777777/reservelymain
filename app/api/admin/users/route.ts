import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('q') ?? ''
  const role   = searchParams.get('role') ?? ''

  const admin = getAdminClient()

  let query = admin
    .from('profiles')
    .select('id, full_name, email, role, is_active, is_superadmin, created_at, restaurant_id, restaurants(name, slug, subscription_plan, deleted_at)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (role) query = query.eq('role', role)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let users = data ?? []

  if (search) {
    const q = search.toLowerCase()
    users = users.filter(u =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (u.restaurants as any)?.name?.toLowerCase().includes(q)
    )
  }

  return NextResponse.json({ users })
}
