/**
 * Current user's subscription status — used to gate access and decide whether
 * to show the "add a card" prompt after a free trial lapses.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, plan, current_period_end, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    status: sub?.status ?? null,
    plan: sub?.plan ?? null,
    currentPeriodEnd: sub?.current_period_end ?? null,
    hasCustomer: !!sub?.stripe_customer_id,
  })
}
