import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { logAction } from '@/lib/audit'
import { NextRequest, NextResponse } from 'next/server'

type PatchBody = {
  is_active?:      boolean   // suspend / reactivate individual user
  role?:           'owner' | 'manager' | 'staff'
  is_superadmin?:  boolean   // promote / demote superadmin
}

const VALID_ROLES = new Set(['owner', 'manager', 'staff'])

// PATCH /api/admin/users/[id]
// Mutate a single platform user: suspend, change role, or promote to superadmin.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await requireSuperAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json() as PatchBody

  // Nothing to do
  if (body.is_active === undefined && body.role === undefined && body.is_superadmin === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 422 })
  }

  if (body.role !== undefined && !VALID_ROLES.has(body.role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 422 })
  }

  // Safety: superadmin cannot demote themselves
  if (body.is_superadmin === false && id === adminUser.id) {
    return NextResponse.json({ error: 'You cannot remove your own superadmin status' }, { status: 422 })
  }

  const admin = getAdminClient()

  // Fetch current profile to build audit metadata
  const { data: profile, error: fetchErr } = await admin
    .from('profiles')
    .select('id, full_name, email, role, is_active, is_superadmin, restaurant_id')
    .eq('id', id)
    .single()

  if (fetchErr || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Build the update patch — only include fields that were sent
  const patch: Record<string, unknown> = {}
  if (body.is_active !== undefined)     patch.is_active     = body.is_active
  if (body.role !== undefined)          patch.role          = body.role
  if (body.is_superadmin !== undefined) patch.is_superadmin = body.is_superadmin

  const { error: updateErr } = await admin
    .from('profiles')
    .update(patch)
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Determine action label for audit log
  const action = body.is_active !== undefined
    ? (body.is_active ? 'user.reactivated' : 'user.suspended')
    : body.is_superadmin !== undefined
    ? (body.is_superadmin ? 'user.promoted_superadmin' : 'user.demoted_superadmin')
    : 'user.role_changed'

  void logAction({
    restaurant_id: profile.restaurant_id ?? '00000000-0000-0000-0000-000000000000',
    actor_id:      adminUser.id,
    actor_name:    adminUser.email ?? null,
    action,
    target_type:   'user',
    target_id:     id,
    metadata: {
      target_email: profile.email,
      before:       { is_active: profile.is_active, role: profile.role, is_superadmin: profile.is_superadmin },
      after:        patch,
    },
  })

  return NextResponse.json({ ok: true })
}
