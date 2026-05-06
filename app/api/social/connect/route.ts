import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FB_APP_ID = "1859085634713050"
const N8N_OAUTH_CALLBACK = "https://tdong1919.app.n8n.cloud/webhook/meta/connect/callback"
const SCOPES = [
  "pages_show_list",
  "business_management",
  "instagram_basic",
  "instagram_manage_comments",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_read_user_content",
  "pages_manage_engagement",
  "instagram_manage_contents",
]

// POST /api/social/connect — build Meta OAuth URL and return it to the client
export async function POST(_request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Encode userId + returnUrl in state so n8n can associate the connection
  const state = encodeURIComponent(
    JSON.stringify({
      userId: user.id,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard?social_connected=true`,
    })
  )

  const authUrl = new URL('https://www.facebook.com/v20.0/dialog/oauth')
  authUrl.searchParams.set('client_id', FB_APP_ID)
  authUrl.searchParams.set('redirect_uri', N8N_OAUTH_CALLBACK)
  authUrl.searchParams.set('scope', SCOPES.join(','))
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('state', state)

  return NextResponse.json({ authUrl: authUrl.toString() })
}
