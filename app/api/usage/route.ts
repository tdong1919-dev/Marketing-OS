import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UsageSummary } from '@/lib/types/database'

// GET /api/usage — return current billing period usage and plan limit
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: fetch real data
  // 1. Get subscription to determine plan limit and billing period
  // const { data: sub } = await supabase
  //   .from('subscriptions')
  //   .select('reply_limit, current_period_start, current_period_end')
  //   .eq('user_id', user.id)
  //   .maybeSingle()
  //
  // const billingStart = sub?.current_period_start
  //   ? new Date(sub.current_period_start).toISOString().split('T')[0]
  //   : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  //       .toISOString()
  //       .split('T')[0]
  //
  // 2. Count usage_events for this billing period
  // const { count } = await supabase
  //   .from('usage_events')
  //   .select('id', { count: 'exact', head: true })
  //   .eq('user_id', user.id)
  //   .eq('event_type', 'reply_generated')
  //   .gte('billing_period_start', billingStart)

  const mockLimit = 50
  const mockUsed = 18
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const summary: UsageSummary = {
    used: mockUsed,
    limit: mockLimit,
    billingPeriodStart: periodStart.toISOString(),
    billingPeriodEnd: periodEnd.toISOString(),
    percentUsed: Math.round((mockUsed / mockLimit) * 100),
  }

  return NextResponse.json({ data: summary })
}
