import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { UserRole } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user?.id ?? '')
    .single()

  if (profile?.is_active === false) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  const userRole = (profile?.role ?? 'staff') as UserRole

  return <DashboardShell userRole={userRole}>{children}</DashboardShell>
}
