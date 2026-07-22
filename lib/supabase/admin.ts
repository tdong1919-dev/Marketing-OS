import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Privileged Supabase client using the service-role key.
 *
 * SERVER-ONLY. This client BYPASSES Row Level Security, so callers must
 * enforce ownership/authorization themselves before reading or writing.
 * Never import this into a Client Component or expose the key to the browser.
 */
export function createAdminClient() {
  const serviceKey = supabaseServiceRoleKey();
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createSupabaseClient<Database>(supabaseUrl(), serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
