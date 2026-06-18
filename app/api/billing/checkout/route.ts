import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Lazily instantiated so missing env vars don't crash at build time
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

interface PlanConfig {
  priceId: string
  limit: number
  mode: 'subscription' | 'payment'
}

/** All purchasable plans and add-ons with their Price IDs and reply limits. */
const PLAN_CONFIG: Record<string, PlanConfig> = {
  // Individual plans
  starter:        { priceId: process.env.STRIPE_STARTER_PRICE_ID!,        limit: 250,   mode: 'subscription' },
  growth:         { priceId: process.env.STRIPE_GROWTH_PRICE_ID!,         limit: 1000,  mode: 'subscription' },
  scale:          { priceId: process.env.STRIPE_SCALE_PRICE_ID!,          limit: 5000,  mode: 'subscription' },
  // Agency plans
  agency_starter: { priceId: process.env.STRIPE_AGENCY_STARTER_PRICE_ID!, limit: 500,   mode: 'subscription' },
  agency_growth:  { priceId: process.env.STRIPE_AGENCY_GROWTH_PRICE_ID!,  limit: 2000,  mode: 'subscription' },
  agency_pro:     { priceId: process.env.STRIPE_AGENCY_PRO_PRICE_ID!,     limit: 10000, mode: 'subscription' },
  // Add-ons (one-time)
  replies_100:    { priceId: process.env.STRIPE_REPLIES_100_PRICE_ID!,    limit: 100,   mode: 'payment' },
  replies_500:    { priceId: process.env.STRIPE_REPLIES_500_PRICE_ID!,    limit: 500,   mode: 'payment' },
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan }: { plan: string } = await request.json()
  const config = PLAN_CONFIG[plan]

  if (!config?.priceId) {
    return NextResponse.json({ error: `Invalid or unconfigured plan: ${plan}` }, { status: 400 })
  }

  // Re-use existing Stripe customer if available
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const stripe = getStripe()

  // Public plans are card-first. If a first-month coupon is configured, apply it
  // so month 1 is free with a card on file (auto-converts to paid in month 2).
  const firstMonthCoupon = process.env.STRIPE_FIRST_MONTH_COUPON

  const session = await stripe.checkout.sessions.create({
    mode: config.mode,
    customer: sub?.stripe_customer_id ?? undefined,
    customer_email: sub?.stripe_customer_id ? undefined : user.email ?? undefined,
    line_items: [{ price: config.priceId, quantity: 1 }],
    success_url: `${appUrl}/onboarding?paid=1`,
    cancel_url:  `${appUrl}/billing?cancelled=true`,
    metadata: {
      user_id:     user.id,
      plan,
      reply_limit: String(config.limit),
    },
    ...(config.mode === 'subscription' && {
      payment_method_collection: 'always',
      subscription_data: { metadata: { user_id: user.id, plan } },
      ...(firstMonthCoupon && { discounts: [{ coupon: firstMonthCoupon }] }),
    }),
  })

  return NextResponse.json({ url: session.url })
}
