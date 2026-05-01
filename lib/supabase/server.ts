import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client.
 * Use this in Server Components, Route Handlers, and Server Actions.
 * Reads and writes cookies to keep the session refreshed.
 *
 * Note: we intentionally omit the Database generic here. Our hand-written
 * Database interface uses named interfaces for Row/Insert/Update types, which
 * causes supabase-js to widen all table types to `never` via the TablesAndViews
 * intersection. Action files cast query results to our types explicitly instead.
 * To restore full generics, regenerate types with: npx supabase gen types typescript
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — cookies can't be set,
            // but session refresh still works if middleware handles it.
          }
        },
      },
    }
  )
}
