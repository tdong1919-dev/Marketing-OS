/**
 * GET /api/inbox — three views for the Inbox:
 *   posted      = log of everything the AI auto-sent (comments + DMs)
 *   needsReview = escalations awaiting a human (pending comment drafts + escalated DMs)
 *   approved    = items a human approved + sent from the Inbox
 * All scoped to the logged-in user.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type LogItem = { id: string; kind: 'comment' | 'dm'; platform: string; who: string; incoming: string; response: string; ts: string | null }
type ReviewItem = { id: string; kind: 'comment' | 'dm'; refId: string; externalId: string | null; platform: string; who: string; incoming: string; draft: string; reason: string; ts: string | null }

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // Connected accounts → platform lookups
  const { data: userAccounts } = await sb
    .from('social_accounts')
    .select('id, platform')
    .eq('user_id', user.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts = (userAccounts ?? []) as any[]
  const accountIds = accounts.map((a) => a.id)
  const platformByAccountId: Record<string, string> = {}
  for (const a of accounts) platformByAccountId[a.id] = a.platform ?? 'instagram'

  // DM conversations (RLS scopes to caller)
  const { data: allDms } = await sb
    .from('dm_conversations')
    .select('id, social_account_id, recipient_ig_id, recipient_username, history, conversation_stage, handoff_reason, last_message_at')
    .order('last_message_at', { ascending: false })
    .limit(200)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dmRows = (allDms ?? []) as any[]

  // Comments + AI replies for the user's accounts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let replies: any[] = []
  if (accountIds.length) {
    const { data: comments } = await sb
      .from('comments')
      .select('id, external_comment_id, commenter_username, comment_text, social_account_id')
      .in('social_account_id', accountIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commentList = (comments ?? []) as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commentById: Record<string, any> = {}
    for (const c of commentList) commentById[c.id] = c
    const commentIds = commentList.map((c) => c.id)
    if (commentIds.length) {
      const { data: aiReplies } = await sb
        .from('ai_replies')
        .select('id, comment_id, draft_text, edited_text, status, created_at, reviewed_at')
        .in('comment_id', commentIds)
        .order('created_at', { ascending: false })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      replies = ((aiReplies ?? []) as any[]).map((r) => ({ ...r, comment: commentById[r.comment_id] }))
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platformOfComment = (c: any) => platformByAccountId[c?.social_account_id] ?? 'instagram'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dmPlatform = (d: any) => platformByAccountId[d.social_account_id] ?? 'instagram'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastOf = (hist: any[], role: string) => [...hist].reverse().find((m) => m.role === role)

  // ── POSTED: auto-sent log ──
  const posted: LogItem[] = []
  for (const r of replies) {
    if (r.status !== 'posted') continue
    posted.push({ id: `c:${r.id}`, kind: 'comment', platform: platformOfComment(r.comment), who: r.comment?.commenter_username ?? 'commenter', incoming: r.comment?.comment_text ?? '', response: r.edited_text ?? r.draft_text ?? '', ts: r.created_at })
  }
  for (const d of dmRows) {
    const hist = Array.isArray(d.history) ? d.history : []
    // Skip the human-approved final turn of a resolved convo (that's in Approved).
    hist.forEach((m: { role: string; content: string; ts?: string }, i: number) => {
      if (m.role !== 'assistant') return
      if (d.conversation_stage === 'resolved' && i === hist.length - 1) return
      let incoming = ''
      for (let j = i - 1; j >= 0; j--) { if (hist[j].role === 'user') { incoming = hist[j].content; break } }
      posted.push({ id: `dm:${d.id}:${i}`, kind: 'dm', platform: dmPlatform(d), who: d.recipient_username ?? `IG ${d.recipient_ig_id}`, incoming, response: m.content, ts: m.ts ?? d.last_message_at })
    })
  }
  posted.sort((a, b) => new Date(b.ts ?? 0).getTime() - new Date(a.ts ?? 0).getTime())

  // ── NEEDS REVIEW: escalations awaiting a human ──
  const needsReview: ReviewItem[] = []
  for (const r of replies) {
    if (r.status !== 'pending') continue
    needsReview.push({ id: `c:${r.id}`, kind: 'comment', refId: r.id, externalId: r.comment?.external_comment_id ?? null, platform: platformOfComment(r.comment), who: r.comment?.commenter_username ?? 'commenter', incoming: r.comment?.comment_text ?? '', draft: r.edited_text ?? r.draft_text ?? '', reason: 'Comment flagged for review', ts: r.created_at })
  }
  for (const d of dmRows) {
    if (d.conversation_stage !== 'escalated') continue
    const hist = Array.isArray(d.history) ? d.history : []
    const reason = d.handoff_reason === 'max_messages_reached' ? 'Long conversation — needs a human' : 'Sensitive topic (refund/billing/legal)'
    needsReview.push({ id: `dm:${d.id}`, kind: 'dm', refId: d.id, externalId: d.recipient_ig_id, platform: dmPlatform(d), who: d.recipient_username ?? `IG ${d.recipient_ig_id}`, incoming: lastOf(hist, 'user')?.content ?? '', draft: '', reason, ts: d.last_message_at })
  }
  needsReview.sort((a, b) => new Date(b.ts ?? 0).getTime() - new Date(a.ts ?? 0).getTime())

  // ── APPROVED: human approved + sent ──
  const approved: LogItem[] = []
  for (const r of replies) {
    if (r.status !== 'approved') continue
    approved.push({ id: `c:${r.id}`, kind: 'comment', platform: platformOfComment(r.comment), who: r.comment?.commenter_username ?? 'commenter', incoming: r.comment?.comment_text ?? '', response: r.edited_text ?? r.draft_text ?? '', ts: r.reviewed_at ?? r.created_at })
  }
  for (const d of dmRows) {
    if (d.conversation_stage !== 'resolved') continue
    const hist = Array.isArray(d.history) ? d.history : []
    approved.push({ id: `dm:${d.id}`, kind: 'dm', platform: dmPlatform(d), who: d.recipient_username ?? `IG ${d.recipient_ig_id}`, incoming: lastOf(hist, 'user')?.content ?? '', response: lastOf(hist, 'assistant')?.content ?? '', ts: d.last_message_at })
  }
  approved.sort((a, b) => new Date(b.ts ?? 0).getTime() - new Date(a.ts ?? 0).getTime())

  const platforms = Array.from(new Set([...posted, ...needsReview, ...approved].map((x) => x.platform))).sort()

  return NextResponse.json({ posted, needsReview, approved, platforms })
}
