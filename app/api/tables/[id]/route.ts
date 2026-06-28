import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MAX_NAME_LEN = 100
const MAX_CAPACITY = 500
const VALID_CATEGORIES = new Set(['indoor', 'outdoor', 'bar', 'private', 'terrace'])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, restaurant_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role === 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!profile.restaurant_id) {
      return NextResponse.json({ error: 'No restaurant associated' }, { status: 403 })
    }

    const body = await request.json() as {
      name?: string; capacity?: number; category?: string; is_active?: boolean
    }
    const { name, capacity, category, is_active } = body

    // Input validation
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 422 })
      }
      if (name.trim().length > MAX_NAME_LEN) {
        return NextResponse.json({ error: `Name must be ${MAX_NAME_LEN} characters or fewer` }, { status: 422 })
      }
    }
    if (capacity !== undefined) {
      if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 1 || capacity > MAX_CAPACITY) {
        return NextResponse.json({ error: `Capacity must be between 1 and ${MAX_CAPACITY}` }, { status: 422 })
      }
    }
    if (category !== undefined && !VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: `Category must be one of: ${[...VALID_CATEGORIES].join(', ')}` }, { status: 422 })
    }

    const updates: Record<string, unknown> = {}
    if (name !== undefined)      updates.name      = name.trim()
    if (capacity !== undefined)  updates.capacity  = capacity
    if (category !== undefined)  updates.category  = category
    if (is_active !== undefined) updates.is_active = Boolean(is_active)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 422 })
    }

    // Ownership check: .eq('restaurant_id') ensures user can only update their own tables.
    // RLS is also applied, but defence-in-depth: explicit filter prevents cross-tenant mutation
    // even if RLS policies are misconfigured.
    const { data, error } = await supabase
      .from('restaurant_tables')
      .update(updates)
      .eq('id', tableId)
      .eq('restaurant_id', profile.restaurant_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Table not found' }, { status: 404 })

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
    const { id: tableId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, restaurant_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role === 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!profile.restaurant_id) {
      return NextResponse.json({ error: 'No restaurant associated' }, { status: 403 })
    }

    // Ownership check: prevents deletion of tables belonging to other restaurants
    const { error } = await supabase
      .from('restaurant_tables')
      .delete()
      .eq('id', tableId)
      .eq('restaurant_id', profile.restaurant_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
