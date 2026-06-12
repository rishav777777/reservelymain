import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select('category')
    .eq('is_active', true)
    .order('category')

  if (error) return NextResponse.json({ categories: [] })

  const categories = [...new Set(data.map((r) => r.category as string))]
    .filter(Boolean)
    .sort()

  return NextResponse.json({ categories })
}
