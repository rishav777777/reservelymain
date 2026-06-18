import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types'

const VALID_ROLES: UserRole[] = ['owner', 'manager', 'staff']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('restaurant_id, role').eq('id', user.id).single()
    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can change roles' }, { status: 403 })
    }

    const { role } = await request.json()
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (targetId === user.id) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', targetId)
      .eq('restaurant_id', profile.restaurant_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
