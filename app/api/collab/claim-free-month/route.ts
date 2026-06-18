/**
 * Approved collaborators claim their 1-month free trial — NO card required.
 * Creates a Stripe Checkout session with a 30-day trial; at trial end Stripe
 * issues an invoice (no payment method on file → subscription goes past_due),
 * which triggers the "add a card to continue" prompt in the dashboard.
 */
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

// The plan the free month grants. Change here to use a different tier.
const COLLAB_PLAN = { key: 'starter', priceEnv: 'STRIPE_STARTER_PRICE_ID', limit: 250 }

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any

  // Must be an approved collaborator (match by user_id, fall back to email).
  let { data: app } = await svc.from('collab_applications').select('*').eq('user_id', user.id).maybeSingle()
  if (!app && user.email) {
    app = (await svc.from('collab_applications').select('*').eq('email', user.email).maybeSingle()).data
  }
  if (!app || app.status !== 'approved') {
    return NextResponse.json({ error: 'Not an approved collaborator' }, { status: 403 })
  }
  if (app.free_month_claimed_at) {
    return NextResponse.json({ error: 'Free month already claimed' }, { status: 400 })
  }

  // Don't hand out a second plan if they already have one.
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('status, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existingSub && ['active', 'trialing'].includes(existingSub.status ?? '')) {
    return NextResponse.json({ error: 'You already have an active plan' }, { status: 400 })
  }

  const priceId = process.env[COLLAB_PLAN.priceEnv]
  if (!priceId) return NextResponse.json({ error: 'Plan not configured' }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: existingSub?.stripe_customer_id ?? undefined,
    customer_email: existingSub?.stripe_customer_id ? undefined : user.email ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_collection: 'if_required', // no card during the trial
    subscription_data: {
      trial_period_days: 30,
      trial_settings: { end_behavior: { missing_payment_method: 'create_invoice' } },
      metadata: { user_id: user.id, plan: COLLAB_PLAN.key, source: 'collab_free_month' },
    },
    success_url: `${appUrl}/collab-dashboard?claimed=1`,
    cancel_url: `${appUrl}/collab-dashboard?cancelled=1`,
    metadata: {
      user_id: user.id,
      plan: COLLAB_PLAN.key,
      reply_limit: String(COLLAB_PLAN.limit),
      source: 'collab_free_month',
    },
  })

  return NextResponse.json({ url: session.url })
}
