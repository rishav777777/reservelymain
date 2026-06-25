import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] ?? c))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export async function POST(request: NextRequest) {
  try {
    const { fullName, restaurantName, email, password } = await request.json() as {
      fullName: string
      restaurantName: string
      email: string
      password: string
    }

    if (!fullName?.trim() || !restaurantName?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      user_metadata: { full_name: fullName.trim() },
      email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    const userId = authData.user.id

    // Generate unique slug
    const baseSlug = slugify(restaurantName)
    const suffix   = Math.random().toString(36).slice(2, 6)
    const slug     = `${baseSlug}-${suffix}`

    // Create restaurant
    const { data: restaurant, error: restaurantError } = await admin
      .from('restaurants')
      .insert({ name: restaurantName.trim(), slug, subdomain: slug })
      .select('id')
      .single()

    if (restaurantError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Restaurant error: ${restaurantError.message}` },
        { status: 500 }
      )
    }

    // Upsert profile — handles the case where Supabase auto-created a row via trigger
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id:            userId,
        restaurant_id: restaurant.id,
        full_name:     fullName.trim(),
        email:         email.trim(),
        role:          'owner',
        is_active:     true,
      }, { onConflict: 'id' })

    if (profileError) {
      await admin.from('restaurants').delete().eq('id', restaurant.id)
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Profile error: ${profileError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
