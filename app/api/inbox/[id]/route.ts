import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AiReplyUpdate, InboxRow } from '@/lib/types/database'

// GET /api/inbox/[id] — fetch a single ai_reply with its parent comment
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // TODO: fetch from Supabase and verify ownership
  // const { data, error } = await supabase
  //   .from('ai_replies')
  //   .select('*, comment:comments(*, social_account:social_accounts(user_id))')
  //   .eq('id', id)
  //   .single()
  // if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // if (data.comment.social_account.user_id !== user.id) {
  //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // }

  const mock: InboxRow = {
    id,
    comment_id: 'comment-1',
    draft_text: 'Thanks for reaching out! We\'d love to help you. 💜',
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
  }

  return NextResponse.json({ data: mock })
}

// PATCH /api/inbox/[id] — approve or reject a single reply (with optional edit)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body: {
    status: 'approved' | 'rejected'
    editedText?: string
    rejectionReason?: string
  } = await request.json()

  if (!['approved', 'rejected'].includes(body.status)) {
    return NextResponse.json(
      { error: 'status must be "approved" or "rejected"' },
      { status: 400 }
    )
  }

  const update: AiReplyUpdate = {
    status: body.status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    ...(body.editedText !== undefined && { edited_text: body.editedText }),
    ...(body.rejectionReason !== undefined && {
      rejection_reason: body.rejectionReason,
    }),
  }

  // TODO: verify ownership then update
  // const { data, error } = await supabase
  //   .from('ai_replies')
  //   .update(update)
  //   .eq('id', id)
  //   .select()
  //   .single()
  // if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: { id, ...update },
    message: `Reply ${body.status}`,
  })
}
