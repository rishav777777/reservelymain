import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

const ACTION_LABELS: Record<string, string> = {
  'reservation.confirmed':    'Reservation approved',
  'reservation.rejected':     'Reservation rejected',
  'reservation.arrived':      'Guest arrived',
  'reservation.completed':    'Reservation completed',
  'reservation.cancelled':    'Reservation cancelled',
  'reservation.no_show':      'Guest no-show',
  'user.created':             'User created',
  'user.role_changed':        'Role changed',
  'user.activated':           'User activated',
  'user.deactivated':         'User deactivated',
  'user.deleted':             'User deleted',
  'user.added_to_restaurant': 'User added to restaurant',
}

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, restaurant_id').eq('id', user.id).single()
  if (!profile || profile.role !== 'owner') redirect('/dashboard')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: logs } = await admin
    .from('audit_logs')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-5">
      <div className="mb-5">
        <h1 className="text-sm font-semibold text-gray-900">Audit Log</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Last 100 actions · owner only
        </p>
      </div>

      {(logs ?? []).length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-lg px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No actions logged yet</p>
          <p className="text-xs text-zinc-400 mt-1">
            Actions appear here as reservations are managed and users are modified
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(logs ?? []).map((log: any) => (
            <div
              key={log.id}
              className="flex items-start gap-4 bg-white border border-zinc-200
                         rounded-lg px-4 py-3 text-xs"
            >
              <div className="w-36 shrink-0 text-zinc-400 tabular-nums pt-0.5">
                {new Date(log.created_at).toLocaleString('en-GB', {
                  day: '2-digit', month: 'short',
                  hour: '2-digit', minute: '2-digit',
                })}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-zinc-900">
                  {ACTION_LABELS[log.action] ?? log.action}
                </span>
                {log.metadata?.reference_code && (
                  <span className="text-zinc-400 ml-1.5">
                    · {log.metadata.reference_code}
                  </span>
                )}
                {log.metadata?.guest_name && (
                  <span className="text-zinc-400 ml-1">
                    ({log.metadata.guest_name})
                  </span>
                )}
                {log.metadata?.email && (
                  <span className="text-zinc-400 ml-1.5">
                    · {log.metadata.email}
                  </span>
                )}
              </div>
              <div className="shrink-0 text-zinc-400">
                {log.actor_name ?? 'System'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
