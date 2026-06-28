import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/admin-auth'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { UserRole } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile + maintenance check in parallel
  const admin = getAdminClient()
  const [{ data: profile }, { data: maintenanceRow }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, is_active, full_name, restaurant_id, is_superadmin')
      .eq('id', user.id)
      .single(),
    admin
      .from('platform_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single(),
  ])

  // Suspended account — sign out and redirect to login
  if (profile?.is_active === false) {
    await supabase.auth.signOut()
    redirect('/login?reason=suspended')
  }

  // Maintenance mode — superadmins bypass it
  if (!profile?.is_superadmin) {
    if (maintenanceRow?.value === true || maintenanceRow?.value === 'true') {
      redirect('/maintenance')
    }
  }

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, owner_whatsapp, dpa_signed_at')
    .eq('id', profile?.restaurant_id ?? '')
    .single()

  // Owners must sign the DPA before accessing the dashboard (GDPR Art. 28)
  if (profile?.role === 'owner' && !profile?.is_superadmin && !restaurant?.dpa_signed_at) {
    redirect('/dpa')
  }

  const userRole = (profile?.role ?? 'staff') as UserRole

  return (
    <DashboardShell
      userRole={userRole}
      restaurantName={restaurant?.name ?? ''}
      userName={profile?.full_name ?? user?.email?.split('@')[0] ?? ''}
      waSetup={!!restaurant?.owner_whatsapp}
    >
      {children}
    </DashboardShell>
  )
}
