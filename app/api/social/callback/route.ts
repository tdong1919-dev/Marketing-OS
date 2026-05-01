import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/social/callback — handle Meta OAuth callback
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.redirect(
      new URL('/login', process.env.NEXT_PUBLIC_APP_URL!)
    )
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    // User denied OAuth or Meta returned an error
    return NextResponse.redirect(
      new URL(
        `/dashboard?social_error=${encodeURIComponent(errorParam)}`,
        process.env.NEXT_PUBLIC_APP_URL!
      )
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard?social_error=missing_code', process.env.NEXT_PUBLIC_APP_URL!)
    )
  }

  // TODO: Exchange `code` for a long-lived access token via Meta Graph API:
  // 1. POST to https://graph.facebook.com/v18.0/oauth/access_token
  //    with client_id, client_secret, redirect_uri, code
  // 2. Exchange short-lived token for long-lived token
  // 3. Encrypt the token before storing
  // 4. Upsert into social_accounts table:
  //    await supabase.from('social_accounts').upsert({
  //      user_id: user.id,
  //      platform: 'instagram',
  //      external_account_id: igUserId,
  //      access_token_encrypted: encryptedToken,
  //      connected_at: new Date().toISOString(),
  //      status: 'active',
  //    }, { onConflict: 'user_id,platform' })
  // 5. Validate state === user.id to prevent CSRF

  if (process.env.NODE_ENV === 'development') console.log('Meta OAuth callback received', { code: !!code, state, userId: user.id })

  return NextResponse.redirect(
    new URL('/dashboard?social_connected=true', process.env.NEXT_PUBLIC_APP_URL!)
  )
}
