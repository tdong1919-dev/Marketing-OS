/**
 * GET /api/social/youtube/callback
 * Exchanges the Google OAuth code for tokens, looks up the channel, and stores
 * the refresh token in social_accounts (platform 'youtube') for the publisher.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get('host')}`
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(new URL(`/scheduler?yt_error=${encodeURIComponent(errorParam)}`, appUrl))
  }
  if (!code) {
    return NextResponse.redirect(new URL('/scheduler?yt_error=missing_code', appUrl))
  }

  // Prefer the logged-in user; fall back to the state we set on connect.
  const sessionSupabase = await createClient()
  const { data: { user } } = await sessionSupabase.auth.getUser()
  const userId = user?.id ?? state
  if (!userId) {
    return NextResponse.redirect(new URL('/scheduler?yt_error=no_user', appUrl))
  }

  try {
    const redirectUri = `${appUrl}/api/social/youtube/callback`

    // 1. Exchange code for tokens.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()
    if (!tokens.refresh_token) {
      // Google only returns a refresh token on first consent; prompt=consent forces it.
      return NextResponse.redirect(new URL('/scheduler?yt_error=no_refresh_token', appUrl))
    }

    // 2. Identify the channel.
    const chanRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    )
    const chan = await chanRes.json()
    const channel = chan.items?.[0]
    const channelId = channel?.id ?? null
    const channelTitle = channel?.snippet?.title ?? null

    // 3. Store the refresh token in social_accounts (platform 'youtube').
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = createServiceClient() as any
    const { data: existing } = await svc
      .from('social_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'youtube')
      .maybeSingle()

    const payload = {
      user_id: userId,
      platform: 'youtube',
      external_account_id: channelId,
      // social_accounts stores tokens in page_token_encrypted (the column that
      // exists in the DB); for YouTube this holds the OAuth refresh token.
      page_token_encrypted: tokens.refresh_token,
      username: channelTitle,
      connected_at: new Date().toISOString(),
      status: 'active',
    }

    if (existing) {
      await svc.from('social_accounts').update(payload).eq('id', existing.id)
    } else {
      await svc.from('social_accounts').insert(payload)
    }

    return NextResponse.redirect(new URL('/scheduler?yt=connected', appUrl))
  } catch (err) {
    console.error('[youtube callback]', err)
    return NextResponse.redirect(new URL('/scheduler?yt_error=exchange_failed', appUrl))
  }
}
