import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { BookingClient } from '@/components/booking/BookingClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BookSlugPage({ params }: Props) {
  const { slug } = await params

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!restaurant) notFound()

  return (
    <BookingClient
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
    />
  )
}
