import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { logAction } from '@/lib/audit'

export async function DELETE() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('restaurant_id, role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can delete their account' }, { status: 403 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Audit log before deletion (fire-and-forget)
    logAction({
      restaurant_id: profile.restaurant_id,
      actor_id:      user.id,
      actor_name:    profile.full_name ?? null,
      action:        'account.delete_requested',
      target_type:   'profile',
      target_id:     user.id,
      metadata:      { email: user.email },
    }).catch(() => {})

    // Deactivate the account — hard delete happens after 90-day retention per privacy policy
    const { error: profileError } = await admin
      .from('profiles')
      .update({ is_active: false })
      .eq('id', user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Ban the auth account so it cannot log in again
    const { error: banError } = await admin.auth.admin.updateUserById(user.id, {
      ban_duration: '876000h', // effectively permanent until support reviews
    })

    if (banError) {
      return NextResponse.json({ error: banError.message }, { status: 500 })
    }

    // Sign out all sessions
    await supabase.auth.signOut()

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
