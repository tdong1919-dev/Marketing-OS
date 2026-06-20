import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { sendTrialEndingEmail } from '@/lib/notify'
import type { SubscriptionPlan, SubscriptionStatus } from '@/lib/types/database'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.autom8ig.io'

// Lazily instantiated so missing env vars don't crash at build time
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

/** Reply limits per subscription plan */
const PLAN_LIMITS: Record<string, number> = {
  starter:        250,
  growth:         1000,
  scale:          5000,
  agency_starter: 500,
  agency_growth:  2000,
  agency_pro:     10000,
}

/** Map each Price ID → plan key */
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_STARTER_PRICE_ID        ?? '']: 'starter',
  [process.env.STRIPE_GROWTH_PRICE_ID         ?? '']: 'growth',
  [process.env.STRIPE_SCALE_PRICE_ID          ?? '']: 'scale',
  [process.env.STRIPE_AGENCY_STARTER_PRICE_ID ?? '']: 'agency_starter',
  [process.env.STRIPE_AGENCY_GROWTH_PRICE_ID  ?? '']: 'agency_growth',
  [process.env.STRIPE_AGENCY_PRO_PRICE_ID     ?? '']: 'agency_pro',
}

/**
 * POST /api/billing/webhook
 * Verifies Stripe signature then handles:
 *   - checkout.session.completed  → activate/upgrade plan or top-up add-on replies
 *   - customer.subscription.updated → sync plan/status/period
 *   - customer.subscription.deleted → mark cancelled
 *   - invoice.payment_failed      → mark past_due
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Webhooks have no user session, so use the service role (bypasses RLS).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any

  switch (event.type) {
    // ------------------------------------------------------------------ //
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId    = session.metadata?.user_id
      const planKey   = session.metadata?.plan
      const replyLimit = Number(session.metadata?.reply_limit ?? 0)

      if (!userId) break

      if (session.mode === 'subscription' && planKey) {
        // Subscription checkout — upsert the subscription row
        await supabase.from('subscriptions').upsert({
          user_id:                userId,
          stripe_customer_id:     session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan:    planKey as SubscriptionPlan,
          status:  'active' as SubscriptionStatus,
          reply_limit: PLAN_LIMITS[planKey] ?? replyLimit,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        // Free-month claim → mark the collaborator's application as claimed.
        if (session.metadata?.source === 'collab_free_month') {
          await supabase
            .from('collab_applications')
            .update({ free_month_claimed_at: new Date().toISOString() })
            .eq('user_id', userId)
            .is('free_month_claimed_at', null)
        }
      } else if (session.mode === 'payment' && replyLimit > 0) {
        // One-time add-on — increment reply_limit on existing row
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('reply_limit')
          .eq('user_id', userId)
          .maybeSingle()

        const newLimit = (sub?.reply_limit ?? 0) + replyLimit
        await supabase.from('subscriptions')
          .update({ reply_limit: newLimit, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
      }
      break
    }

    // ------------------------------------------------------------------ //
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const priceId = sub.items.data[0]?.price.id ?? ''
      const planKey = PRICE_TO_PLAN[priceId]

      await supabase.from('subscriptions')
        .update({
          plan:       (planKey ?? 'starter') as SubscriptionPlan,
          status:     sub.status as SubscriptionStatus,
          reply_limit: planKey ? PLAN_LIMITS[planKey] : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    // ------------------------------------------------------------------ //
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    // ------------------------------------------------------------------ //
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await supabase.from('subscriptions')
        .update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', invoice.customer as string)
      break
    }

    // ------------------------------------------------------------------ //
    case 'customer.subscription.trial_will_end': {
      // Fires ~3 days before a trial ends — email the user to add a card.
      const sub = event.data.object as Stripe.Subscription
      try {
        const customer = await stripe.customers.retrieve(sub.customer as string)
        const email = customer && !('deleted' in customer) ? customer.email : null
        if (email) {
          const userId = sub.metadata?.user_id
          let name: string | null = null
          if (userId) {
            const { data: appRow } = await supabase
              .from('collab_applications').select('name').eq('user_id', userId).maybeSingle()
            name = appRow?.name ?? null
          }
          const trialEndDate = sub.trial_end
            ? new Date(sub.trial_end * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
            : null
          await sendTrialEndingEmail({ email, name, trialEndDate, billingUrl: `${APP_URL}/collab-dashboard` })
        }
      } catch (err) {
        console.error('[webhook] trial_will_end:', err)
      }
      break
    }

    // ------------------------------------------------------------------ //
    default:
      // Unhandled events return 200 so Stripe doesn't retry them
      console.log(`[webhook] unhandled event: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

// Stripe requires raw body for signature verification
export const runtime = 'nodejs'
