import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Reads/writes the auth session via Next.js cookies.
 * Access is governed by RLS (acts as the signed-in user).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if middleware refreshes sessions.
          }
        },
      },
    },
  );
}
