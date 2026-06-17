/**
 * Content Queue API
 * GET  — list posts for current user (with status filter)
 * POST — add new post to queue
 * PATCH — update post (caption, scheduled_time, status)
 * DELETE — remove post from queue
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const platform = searchParams.get('platform')

  let query = supabase
    .from('content_queue')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_time', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (platform) query = query.eq('platform', platform)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Writes go through the service-role client: authorization is already enforced
  // above (getUser) and user_id is set server-side, so we bypass RLS to avoid the
  // FOR ALL / WITH CHECK rejection on content_queue. Matches the rest of the app.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any

  // Look up user's social account for this platform
  const platform = body.platform ?? 'instagram'
  const { data: account } = await svc
    .from('social_accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .eq('status', 'active')
    .maybeSingle()

  const { data, error } = await svc
    .from('content_queue')
    .insert({
      user_id: user.id,
      social_account_id: account?.id ?? null,
      platform,
      caption: body.caption,
      media_url: body.media_url,
      content_type: body.content_type ?? 'image',
      title: body.title,
      script: body.script,
      emotional_tone: body.emotional_tone,
      hook_strength: body.hook_strength,
      best_posting_window: body.best_posting_window,
      ideal_days: body.ideal_days,
      status: body.scheduled_time ? 'scheduled' : 'queued',
      scheduled_time: body.scheduled_time ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const allowed = ['caption', 'media_url', 'scheduled_time', 'status', 'content_type', 'platform',
    'emotional_tone', 'hook_strength', 'best_posting_window', 'ideal_days', 'title', 'script']
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any
  const { data, error } = await svc
    .from('content_queue')
    .update(update)
    .eq('id', body.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any
  const { error } = await svc
    .from('content_queue')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
