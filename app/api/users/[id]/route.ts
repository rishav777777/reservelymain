import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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
      return NextResponse.json({ error: 'Only owners can manage users' }, { status: 403 })
    }

    if (targetId === user.id) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
    }

    const body = await request.json()
    const { role, action } = body

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    if (action === 'add') {
      const { data, error } = await admin
        .from('profiles')
        .update({ restaurant_id: profile.restaurant_id, role: role ?? 'staff' })
        .eq('id', targetId)
        .select()
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    if (action === 'toggle_active') {
      const { data: targetProfile } = await admin
        .from('profiles').select('is_active').eq('id', targetId).single()
      const newActive = !(targetProfile?.is_active ?? true)

      const { error: banError } = await admin.auth.admin.updateUserById(targetId, {
        ban_duration: newActive ? 'none' : '876000h',
      })
      if (banError) {
        return NextResponse.json({ error: banError.message }, { status: 500 })
      }

      const { data, error } = await admin
        .from('profiles')
        .update({ is_active: newActive })
        .eq('id', targetId)
        .eq('restaurant_id', profile.restaurant_id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const { data, error } = await admin
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

export async function DELETE(
  _request: NextRequest,
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
      return NextResponse.json({ error: 'Only owners can delete users' }, { status: 403 })
    }
    if (targetId === user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: targetProfile } = await admin
      .from('profiles').select('restaurant_id').eq('id', targetId).single()
    if (!targetProfile || targetProfile.restaurant_id !== profile.restaurant_id) {
      return NextResponse.json({ error: 'User not found in your restaurant' }, { status: 404 })
    }

    const { error } = await admin.auth.admin.deleteUser(targetId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
