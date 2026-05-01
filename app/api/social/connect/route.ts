import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/social/connect — initiate Meta (Instagram/Facebook) OAuth flow
export async function POST(_request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Build the real Meta OAuth authorization URL:
  // const metaAuthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
  // metaAuthUrl.searchParams.set('client_id', process.env.META_APP_ID!)
  // metaAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback`)
  // metaAuthUrl.searchParams.set('scope', 'instagram_basic,instagram_manage_comments,pages_read_engagement')
  // metaAuthUrl.searchParams.set('state', user.id) // CSRF token in production
  // return NextResponse.json({ authUrl: metaAuthUrl.toString() })

  // v1 placeholder — Meta App Review pending
  return NextResponse.json({
    status: 'coming_soon',
    message:
      'Instagram connection is coming soon. Join the waitlist to be notified when it launches.',
  })
}
