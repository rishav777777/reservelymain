import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const restaurantId  = searchParams.get('restaurantId')
  const search        = searchParams.get('search') ?? ''
  const stammgastOnly = searchParams.get('stammgast') === 'true'

  if (!restaurantId) {
    return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase
    .from('guest_profiles')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('visit_count', { ascending: false })
    .order('last_visit',  { ascending: false })

  if (stammgastOnly) query = query.eq('is_stammgast', true)

  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
