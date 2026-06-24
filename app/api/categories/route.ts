import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.restaurant_id) return NextResponse.json({ categories: [] })

  const { data } = await supabase
    .from('restaurant_tables')
    .select('category')
    .eq('restaurant_id', profile.restaurant_id)
    .eq('is_active', true)

  const categories = [...new Set((data ?? []).map((r) => r.category as string))]
    .filter(Boolean)
    .sort()

  return NextResponse.json({ categories })
}
