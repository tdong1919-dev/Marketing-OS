import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AiReplyUpdate, InboxRow, ReplyStatus } from '@/lib/types/database'

const PAGE_SIZE = 20

// GET /api/inbox — list ai_replies with optional status filter and pagination
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const VALID_STATUSES: ReplyStatus[] = ['pending', 'approved', 'rejected', 'posted']
  const rawStatus = searchParams.get('status')
  const _status: ReplyStatus | null = rawStatus && (VALID_STATUSES as string[]).includes(rawStatus) ? (rawStatus as ReplyStatus) : null
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const _offset = (page - 1) * PAGE_SIZE

  // TODO: replace with real Supabase query
  // let query = supabase
  //   .from('ai_replies')
  //   .select(`
  //     *,
  //     comment:comments(*)
  //   `, { count: 'exact' })
  //   .order('created_at', { ascending: false })
  //   .range(offset, offset + PAGE_SIZE - 1)
  //
  // // Join through comments → social_accounts to enforce user ownership
  // query = query.eq('comments.social_accounts.user_id', user.id)
  //
  // if (status) {
  //   query = query.eq('status', status)
  // }
  //
  // const { data, count, error } = await query
  // if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mock response
  const mock: InboxRow[] = [
    {
      id: 'reply-1',
      comment_id: 'comment-1',
      draft_text: 'Thanks for reaching out! We\'d love to help you with that. 💜',
      edited_text: null,
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      created_at: new Date().toISOString(),
      comment: {
        id: 'comment-1',
        social_account_id: 'sa-1',
        external_comment_id: 'ig-123456',
        commenter_username: '@jane_doe',
        comment_text: 'How much do your facials cost?',
        post_url: 'https://instagram.com/p/example',
        received_at: new Date().toISOString(),
      },
    },
  ]

  return NextResponse.json({
    data: mock,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total: 1,
      totalPages: 1,
    },
  })
}

// PATCH /api/inbox — bulk update reply statuses
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: { ids: string[]; update: AiReplyUpdate } = await request.json()
  const ALLOWED_UPDATE_FIELDS: (keyof AiReplyUpdate)[] = ['status', 'edited_text', 'rejection_reason']
  const _sanitizedUpdate = Object.fromEntries(
    Object.entries(body.update ?? {}).filter(([k]) => ALLOWED_UPDATE_FIELDS.includes(k as keyof AiReplyUpdate))
  ) as AiReplyUpdate

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json(
      { error: 'ids must be a non-empty array' },
      { status: 400 }
    )
  }

  // TODO: validate ownership before updating
  // const { data, error } = await supabase
  //   .from('ai_replies')
  //   .update({ ...body.update, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
  //   .in('id', body.ids)
  //   .select()
  // if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: { updated: body.ids.length },
    message: `${body.ids.length} replies updated`,
  })
}
