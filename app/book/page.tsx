import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function BookPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) redirect('/dashboard')

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('slug')
    .eq('id', profile.restaurant_id)
    .single()

  if (restaurant?.slug) redirect(`/book/${restaurant.slug}`)

  // Fallback if no slug yet
  redirect('/dashboard/settings')
}
