import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { name, email, instagram_handle, follower_count, content_niche, message } = body

  if (!name || !email || !instagram_handle) {
    return NextResponse.json({ error: 'Name, email, and Instagram handle are required.' }, { status: 400 })
  }

  // Get user if logged in (optional)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const svc = createServiceClient()

  // Check for duplicate by email or handle
  const { data: existing } = await svc
    .from('collab_applications')
    .select('id, status')
    .or(`email.eq.${email},instagram_handle.eq.${instagram_handle}`)
    .maybeSingle() as { data: { id: string; status: string } | null }

  if (existing) {
    return NextResponse.json(
      { error: 'An application with this email or Instagram handle already exists.', status: existing.status },
      { status: 409 }
    )
  }

  const { error } = await svc.from('collab_applications').insert({
    user_id: user?.id ?? null,
    name,
    email,
    instagram_handle: instagram_handle.replace(/^@/, ''),
    follower_count: follower_count ?? null,
    content_niche: content_niche ?? null,
    message: message ?? null,
    status: 'pending',
  })

  if (error) {
    console.error('[collab/apply] insert error:', error)
    return NextResponse.json({ error: 'Failed to submit application. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
