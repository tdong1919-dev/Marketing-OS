'use server'

import { createClient } from '@/lib/supabase/server'
import type { UsageSummary } from '@/lib/types/database'

/**
 * Get usage for the currently authenticated user (reads session internally).
 * Convenience wrapper around getCurrentUsage — use this from server components and actions.
 */
export async function getMyUsage(): Promise<UsageSummary> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { used: 0, limit: 250, billingPeriodStart: new Date().toISOString(), billingPeriodEnd: null, percentUsed: 0 }
  }
  return getCurrentUsage(user.id)
}

export interface DailyUsage {
  date: string   // ISO date string 'YYYY-MM-DD'
  count: number
}

export interface UsageHistory {
  daily: DailyUsage[]
  totalInRange: number
}

/**
 * Get the current billing period usage summary for a user.
 * Includes replies used, plan limit, and percentage consumed.
 */
export async function getCurrentUsage(userId: string): Promise<UsageSummary> {
  const supabase = await createClient()

  // 1. Fetch subscription for limit + period dates
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('reply_limit, current_period_start, current_period_end')
    .eq('user_id', userId)
    .maybeSingle()

  const limit = sub?.reply_limit ?? 250
  const periodStart = sub?.current_period_start
    ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const periodEnd = sub?.current_period_end ?? null
  const billingDateStr = new Date(periodStart).toISOString().split('T')[0]

  // 2. Count events in the current billing period
  const { count } = await supabase
    .from('usage_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'reply_generated')
    .gte('billing_period_start', billingDateStr)

  const used = count ?? 0

  return {
    used,
    limit,
    billingPeriodStart: periodStart,
    billingPeriodEnd: periodEnd,
    percentUsed: limit > 0 ? Math.round((used / limit) * 100) : 0,
  }
}

/**
 * Get per-day usage counts for the last N days.
 * Always returns an entry for every day (0-count days included).
 */
export async function getUsageHistory(
  userId: string,
  days: number = 30
): Promise<UsageHistory> {
  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - days + 1)
  since.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('usage_events')
    .select('occurred_at')
    .eq('user_id', userId)
    .eq('event_type', 'reply_generated')
    .gte('occurred_at', since.toISOString())

  if (error) throw new Error(error.message)

  // Build a map of date → count
  const countByDate: Record<string, number> = {}
  for (const event of data ?? []) {
    const d = event.occurred_at.split('T')[0]
    countByDate[d] = (countByDate[d] ?? 0) + 1
  }

  // Fill in all days with 0 where no events exist
  const daily: DailyUsage[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    daily.push({ date: dateStr, count: countByDate[dateStr] ?? 0 })
  }

  return { daily, totalInRange: daily.reduce((sum, d) => sum + d.count, 0) }
}
