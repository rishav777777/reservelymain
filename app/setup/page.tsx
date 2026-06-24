import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SetupWizard } from '@/components/setup/SetupWizard'
import { Restaurant } from '@/types'

export default async function SetupPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) redirect('/login')
  if (profile.role === 'staff') redirect('/dashboard')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, address, phone, email, owner_whatsapp, wa_notifications, wa_daily_summary, setup_completed')
    .eq('id', profile.restaurant_id)
    .single()

  if (restaurant?.setup_completed) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-brand-sidebar flex items-center justify-center p-4">
      <SetupWizard restaurant={restaurant as Restaurant} />
    </div>
  )
}
