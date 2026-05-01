import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /auth/callback
 * Handles the OAuth redirect and email confirmation from Supabase Auth.
 * Exchanges the auth code for a session, then:
 *  - New users (no brand profile) → /onboarding
 *  - Returning users → next param or /dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check whether this user has completed onboarding
        const { data: brand } = await supabase
          .from('brand_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!brand) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Auth code exchange error:', error.message)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
