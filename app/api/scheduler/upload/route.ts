/**
 * POST /api/scheduler/upload — authorize a direct-to-Storage media upload.
 *
 * Returns a short-lived SIGNED UPLOAD URL so the browser can upload the file
 * bytes straight to Supabase Storage. This bypasses Vercel's ~4.5MB request
 * body limit (routing a 500MB video through the function would fail) while
 * still enforcing auth + a server-controlled path/type here.
 *
 * Body: { filename: string, content_type: string }
 * Returns: { path, token, publicUrl, media_type }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const BUCKET = 'content-media'
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'video/mp4': 'mp4', 'video/quicktime': 'mov',
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const contentType: string = body.content_type ?? ''

  const ext = EXT_BY_TYPE[contentType]
  if (!ext) {
    return NextResponse.json({ error: `Unsupported file type: ${contentType || 'unknown'}` }, { status: 415 })
  }

  // Server-controlled path keeps the extension (publisher detects video by it)
  // and scopes the object to the user's folder.
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any
  const { data, error } = await svc.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: pub } = svc.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({
    path,
    token: data.token,
    publicUrl: pub.publicUrl,
    media_type: contentType.startsWith('video') ? 'reel' : 'image',
  })
}
