import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resourceLimiter } from '@/lib/ratelimit'
import { logAction } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('restaurant_id, role').eq('id', user.id).single()
    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can create users' }, { status: 403 })
    }

    try {
      const { success, limit, remaining } = await resourceLimiter.limit(user.id)
      if (!success) {
        return NextResponse.json(
          { error: 'Too many user creation requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit':     String(limit),
              'X-RateLimit-Remaining': String(remaining),
            },
          }
        )
      }
    } catch {
      console.warn('[ratelimit] Redis unavailable, skipping rate limit check')
    }

    const { name, email, password, role } = await request.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'name, email and password are required' }, { status: 400 })
    }
    if (!['owner', 'manager', 'staff'].includes(role ?? 'staff')) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: name },
      email_confirm: true,
    })
    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

    const { error: profileError } = await admin
      .from('profiles')
      .update({
        restaurant_id: profile.restaurant_id,
        role: role ?? 'staff',
        full_name: name,
        email,
        is_active: true,
      })
      .eq('id', newUser.user.id)

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    logAction({
      restaurant_id: profile.restaurant_id,
      actor_id:      user.id,
      action:        'user.created',
      target_type:   'user',
      target_id:     newUser.user.id,
      metadata: { email, role: role ?? 'staff' },
    }).catch(() => {})

    return NextResponse.json({
      id: newUser.user.id,
      full_name: name,
      email,
      role: role ?? 'staff',
      is_active: true,
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('restaurant_id, role').eq('id', user.id).single()
    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: team } = await admin
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('restaurant_id', profile.restaurant_id)
      .order('role')

    const { data: pending } = await admin
      .from('profiles')
      .select('id, full_name, email, role')
      .is('restaurant_id', null)
      .neq('id', user.id)

    return NextResponse.json({
      team: team ?? [],
      pending: pending ?? [],
      restaurantId: profile.restaurant_id,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
