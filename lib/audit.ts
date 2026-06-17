import { createClient as createAdminClient } from '@supabase/supabase-js'

interface AuditEntry {
  restaurant_id: string
  actor_id:      string
  actor_name?:   string | null
  action:        string
  target_type?:  string
  target_id?:    string
  metadata?:     Record<string, unknown>
}

// Always fire-and-forget — audit failure must never break the main operation
export async function logAction(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await admin.from('audit_logs').insert(entry)
  } catch {
    console.warn('[audit] Failed to write audit log:', entry.action)
  }
}
