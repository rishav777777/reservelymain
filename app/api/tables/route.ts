import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('restaurant_id, role').eq('id', user.id).single()
    if (!profile || profile.role === 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, capacity, category } = await request.json()
    if (!name || !capacity || !category) {
      return NextResponse.json(
        { error: 'name, capacity and category are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert({
        restaurant_id: profile.restaurant_id,
        name,
        capacity: parseInt(capacity),
        category,
        is_active: true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
