/**
 * POST /api/help — store a support ticket in Supabase and notify the team.
 * Ticket is always saved; email (Resend) + SMS (Twilio) fire if configured.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendHelpEmail, sendHelpSms } from '@/lib/notify'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim()
  const message = (body.message ?? '').trim()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'name, email, and message are required' }, { status: 400 })
  }

  // Capture the logged-in user if there is one (form is in the dashboard).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const ticket = {
    user_id: user?.id ?? null,
    name,
    email,
    phone: body.phone || null,
    page_name: body.pageName || body.page_name || null,
    concern_type: body.concernType || body.concern_type || null,
    message,
  }

  // 1. Save the ticket (service role — reliable, bypasses RLS).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as any
  const { data: saved, error } = await svc
    .from('help_tickets')
    .insert(ticket)
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2. Fire notifications (never block the ticket on these).
  const [emailRes, smsRes] = await Promise.allSettled([
    sendHelpEmail(ticket),
    sendHelpSms(ticket),
  ])

  const settle = (r: PromiseSettledResult<{ ok: boolean; skipped?: boolean; error?: string }>) =>
    r.status === 'fulfilled' ? r.value : { ok: false, error: 'notify crashed' }

  return NextResponse.json({
    ok: true,
    ticketId: saved.id,
    notifications: { email: settle(emailRes), sms: settle(smsRes) },
  })
}
