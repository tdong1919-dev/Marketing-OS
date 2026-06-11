/**
 * POST /api/inbox/approve — a human approves (or rejects) an escalated item and,
 * on approve, Autom8 actually sends it (posts the comment reply / sends the DM),
 * then marks it approved/resolved so it moves to the Approved tab.
 *
 * Body: { kind: 'comment'|'dm', refId: string, text?: string, action?: 'approve'|'reject' }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendInstagramMessage } from '@/lib/agent/comment-responder'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const kind: string = body.kind
  const refId: string = body.refId
  const text: string = (body.text ?? '').trim()
  const action: string = body.action ?? 'approve'

  if (!kind || !refId) return NextResponse.json({ error: 'kind and refId required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any

  // The Meta account holds the Page token used to post comment replies / send DMs.
  const { data: meta } = await svc
    .from('social_accounts')
    .select('page_token_encrypted, page_id, external_account_id, user_id')
    .eq('user_id', user.id)
    .not('page_token_encrypted', 'is', null)
    .limit(1)
    .maybeSingle()

  // ─── Comment ───
  if (kind === 'comment') {
    // Verify ownership: the reply's comment must belong to one of the user's accounts.
    const { data: reply } = await svc
      .from('ai_replies')
      .select('id, comment_id, comment:comments(external_comment_id, social_account_id)')
      .eq('id', refId)
      .maybeSingle()
    if (!reply) return NextResponse.json({ error: 'Reply not found' }, { status: 404 })

    const { data: owns } = await svc
      .from('social_accounts')
      .select('id')
      .eq('id', reply.comment?.social_account_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (action === 'reject') {
      await svc.from('ai_replies').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', refId)
      return NextResponse.json({ ok: true, status: 'rejected' })
    }

    if (!text) return NextResponse.json({ error: 'text required to approve' }, { status: 400 })
    const commentId = reply.comment?.external_comment_id
    if (!commentId || !meta?.page_token_encrypted) {
      return NextResponse.json({ error: 'Missing comment id or Instagram token' }, { status: 400 })
    }

    // Post the (edited) reply to Instagram.
    const res = await fetch(`https://graph.facebook.com/v23.0/${commentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ message: text, access_token: meta.page_token_encrypted }),
    })
    if (!res.ok) {
      return NextResponse.json({ error: `Instagram rejected the reply: ${await res.text()}` }, { status: 502 })
    }

    await svc.from('ai_replies').update({ status: 'approved', edited_text: text, reviewed_at: new Date().toISOString() }).eq('id', refId)
    return NextResponse.json({ ok: true, status: 'approved' })
  }

  // ─── DM ───
  if (kind === 'dm') {
    const { data: convo } = await svc
      .from('dm_conversations')
      .select('id, user_id, recipient_ig_id, history')
      .eq('id', refId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!convo) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    if (action === 'reject') {
      await svc.from('dm_conversations').update({ conversation_stage: 'resolved' }).eq('id', refId)
      return NextResponse.json({ ok: true, status: 'resolved' })
    }

    if (!text) return NextResponse.json({ error: 'text required to approve' }, { status: 400 })
    if (!meta?.page_token_encrypted) return NextResponse.json({ error: 'Instagram not connected' }, { status: 400 })

    const send = await sendInstagramMessage({
      pageToken: meta.page_token_encrypted,
      pageId: meta.page_id,
      recipient: { id: convo.recipient_ig_id },
      text,
    })
    if (!send.ok) return NextResponse.json({ error: `Failed to send DM: ${send.error}` }, { status: 502 })

    const history = Array.isArray(convo.history) ? convo.history : []
    history.push({ role: 'assistant', content: text, ts: new Date().toISOString() })
    await svc.from('dm_conversations').update({ conversation_stage: 'resolved', history, last_message_at: new Date().toISOString() }).eq('id', refId)
    return NextResponse.json({ ok: true, status: 'resolved' })
  }

  return NextResponse.json({ error: 'Unknown kind' }, { status: 400 })
}
