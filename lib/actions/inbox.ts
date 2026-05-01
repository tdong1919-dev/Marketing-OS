'use server'

import { createClient } from '@/lib/supabase/server'
import type { InboxRow, ReplyStatus } from '@/lib/types/database'

export interface ListRepliesFilters {
  status?: ReplyStatus
  page?: number
  pageSize?: number
}

export interface ListRepliesResult {
  data: InboxRow[]
  total: number
  page: number
  totalPages: number
}

/**
 * List AI reply drafts for the authenticated user.
 * Optionally filter by status and paginate.
 */
export async function listReplies(
  filters: ListRepliesFilters = {}
): Promise<ListRepliesResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 20
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('ai_replies')
    .select(
      `*,
      comment:comments!inner(
        *,
        social_account:social_accounts!inner(user_id)
      )`,
      { count: 'exact' }
    )
    .eq('comment.social_account.user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, count, error } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as InboxRow[],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

/**
 * Approve an AI reply, optionally with an edited version of the text.
 */
export async function approveReply(
  id: string,
  editedText?: string
): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('ai_replies')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      ...(editedText !== undefined && { edited_text: editedText }),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

/**
 * Reject an AI reply with an optional reason.
 */
export async function rejectReply(
  id: string,
  reason?: string
): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('ai_replies')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason ?? null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
