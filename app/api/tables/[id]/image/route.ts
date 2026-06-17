import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { resourceLimiter } from '@/lib/ratelimit'
import { fileTypeFromBuffer } from 'file-type'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await params

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('restaurant_id, role').eq('id', user.id).single()

    if (!profile || profile.role === 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { success, limit, remaining } = await resourceLimiter.limit(
        `img:${profile.restaurant_id}`
      )
      if (!success) {
        return NextResponse.json(
          { error: 'Too many image uploads. Please try again later.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit':     String(limit),
              'X-RateLimit-Remaining': String(remaining),
            },
          }
        )
      }
    } catch {
      console.warn('[ratelimit] Redis unavailable, skipping rate limit check')
    }

    let body: { base64?: unknown; mimeType?: unknown; fileName?: unknown }
    try {
      body = await request.json()
    } catch (parseErr) {
      console.error('[image-upload] Failed to parse request body:', parseErr)
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
    }

    const { base64, mimeType, fileName } = body
    if (!base64 || !mimeType || !fileName ||
        typeof base64 !== 'string' || typeof mimeType !== 'string' || typeof fileName !== 'string') {
      return NextResponse.json({ error: 'base64, mimeType and fileName are required strings' }, { status: 400 })
    }

    const ext = fileName.split('.').pop()
    if (!ext || ext === fileName) {
      return NextResponse.json({ error: 'fileName must include a file extension' }, { status: 400 })
    }

    const storagePath = `${profile.restaurant_id}/${tableId}-${Date.now()}.${ext}`

    let buffer: Buffer
    try {
      buffer = Buffer.from(base64, 'base64')
    } catch (bufErr) {
      console.error('[image-upload] Failed to decode base64:', bufErr)
      return NextResponse.json({ error: 'Invalid base64 data' }, { status: 400 })
    }

    // Verify actual file type from bytes — never trust the client-supplied mimeType
    const detectedType = await fileTypeFromBuffer(buffer)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
      console.error('[image-upload] File type check failed:', detectedType?.mime ?? 'unknown')
      return NextResponse.json(
        { error: 'File must be a JPEG, PNG or WebP image' },
        { status: 400 }
      )
    }

    // Use the detected MIME type for storage, not the client-supplied one
    const verifiedMimeType = detectedType.mime

    console.log(`[image-upload] Uploading restaurant-table-images/${storagePath} (${buffer.length} bytes, ${verifiedMimeType})`)

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: uploadError } = await adminClient.storage
      .from('restaurant-table-images')
      .upload(storagePath, buffer, { contentType: verifiedMimeType, upsert: true })

    if (uploadError) {
      console.error('[image-upload] Storage upload failed:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = adminClient.storage
      .from('restaurant-table-images')
      .getPublicUrl(storagePath)

    console.log(`[image-upload] Upload successful → ${publicUrl}`)

    const { data: tableRow } = await adminClient
      .from('restaurant_tables')
      .select('image_urls')
      .eq('id', tableId)
      .single()

    const currentUrls: string[] = tableRow?.image_urls ?? []
    const updatedUrls = [...new Set([...currentUrls, publicUrl])]

    const { error: dbError } = await adminClient
      .from('restaurant_tables')
      .update({ image_urls: updatedUrls })
      .eq('id', tableId)

    if (dbError) {
      console.error('[image-upload] DB update failed:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ image_url: publicUrl, image_urls: updatedUrls }, { status: 200 })

  } catch (err) {
    console.error('[image-upload] Unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await params

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role === 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body: { urlToRemove?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
    }

    const { urlToRemove } = body
    if (!urlToRemove || typeof urlToRemove !== 'string') {
      return NextResponse.json({ error: 'urlToRemove is required' }, { status: 400 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: tableRow } = await adminClient
      .from('restaurant_tables')
      .select('image_urls')
      .eq('id', tableId)
      .single()

    const currentUrls: string[] = tableRow?.image_urls ?? []
    const updatedUrls = currentUrls.filter((u) => u !== urlToRemove)

    const { error: dbError } = await adminClient
      .from('restaurant_tables')
      .update({ image_urls: updatedUrls })
      .eq('id', tableId)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ image_urls: updatedUrls })

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}