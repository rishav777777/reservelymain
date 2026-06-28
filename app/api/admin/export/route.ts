import { requireSuperAdmin, getAdminClient } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function rowToCsv(values: unknown[]): string {
  return values.map(escapeCsv).join(',')
}

// GET /api/admin/export
// Downloads a CSV of all restaurants — for finance, CRM, and compliance purposes.
// Requires superadmin session.
export async function GET() {
  const adminUser = await requireSuperAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = getAdminClient()

  // Single query: restaurants + owner profile via nested select
  const { data: restaurants, error } = await admin
    .from('restaurants')
    .select(`
      id, name, slug,
      subscription_plan, subscription_status, subscribed_until, trial_ends_at,
      stripe_customer_id,
      created_at, deleted_at, deleted_reason, purge_after,
      dpa_signed_at,
      booking_enabled,
      profiles!profiles_restaurant_id_fkey (
        full_name, email, role, is_active
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = [
    'ID', 'Name', 'Slug',
    'Plan', 'Subscription Status', 'Subscribed Until', 'Trial Ends At',
    'Paddle Customer ID',
    'Owner Name', 'Owner Email', 'Owner Active',
    'Staff Count',
    'DPA Signed', 'Booking Enabled',
    'Created At', 'Deleted At', 'Purge After', 'Deletion Reason',
  ]

  const rows: string[] = [headers.join(',')]

  for (const r of restaurants ?? []) {
    const profiles = (r.profiles as { full_name: string; email: string; role: string; is_active: boolean }[]) ?? []
    const owner    = profiles.find(p => p.role === 'owner')
    const staffCnt = profiles.length

    rows.push(rowToCsv([
      r.id,
      r.name,
      r.slug,
      r.subscription_plan ?? '',
      r.subscription_status ?? '',
      r.subscribed_until ?? '',
      r.trial_ends_at ?? '',
      r.stripe_customer_id ?? '',
      owner?.full_name ?? '',
      owner?.email ?? '',
      owner?.is_active ? 'Yes' : 'No',
      staffCnt,
      r.dpa_signed_at ? new Date(r.dpa_signed_at).toISOString().split('T')[0] : 'Not signed',
      r.booking_enabled ? 'Yes' : 'No',
      r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '',
      r.deleted_at ? new Date(r.deleted_at).toISOString().split('T')[0] : '',
      r.purge_after ? new Date(r.purge_after).toISOString().split('T')[0] : '',
      r.deleted_reason ?? '',
    ]))
  }

  const csv  = rows.join('\n')
  const date = new Date().toISOString().split('T')[0]

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reservely-restaurants-${date}.csv"`,
    },
  })
}
