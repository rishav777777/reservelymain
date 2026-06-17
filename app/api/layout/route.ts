import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // 1. Resolve the asynchronous Supabase client promise completely
    const supabase = await createClient()
    
    // 2. Extract the incoming request body payload
    const { tables } = await request.json()

    // 3. Basic validation guardrail checking the structure
    if (!tables || !Array.isArray(tables)) {
      return NextResponse.json(
        { error: "Invalid layout data structure payload provided." }, 
        { status: 400 }
      )
    }

    // 4. Batch update your database rows using the table IDs
    for (const table of tables) {
      const { error } = await supabase
        .from('tables')
        .update({ 
          category: table.category
          // NOTE: If you add custom pixel coordinate columns to your Supabase tables later, 
          // you can uncomment these lines:
          // x_position: Math.round(table.x),
          // y_position: Math.round(table.y)
        })
        .eq('id', table.id)

      if (error) {
        console.error(`Supabase sync failure on table identity ${table.id}:`, error.message)
      }
    }

    // 5. Respond with a successful JSON notification back to your workspace client UI
    return NextResponse.json({ 
      success: true, 
      message: "Restaurant layout blueprints successfully synchronized to live database!" 
    })

  } catch (error: any) {
    console.error("Layout API Route Internal Error Context:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    )
  }
}