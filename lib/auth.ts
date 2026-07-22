import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_SESSION_ERROR, LOGIN_DISABLED } from "@/lib/auth-mode";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type AdminSupabaseClient = ReturnType<typeof createAdminClient>;
type AuthSupabaseClient = ServerSupabaseClient | AdminSupabaseClient;

function demoUserFromId(id: string): User {
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email:
      process.env.JIDOKA_DEMO_EMAIL ??
      process.env.BRKFREE_DEMO_EMAIL ??
      "demo@jidoka.local",
    app_metadata: {},
    user_metadata: { full_name: "Demo" },
    created_at: new Date(0).toISOString(),
  } as User;
}

async function resolveDemoUser(admin: AdminSupabaseClient): Promise<User> {
  const demoOwnerId =
    process.env.JIDOKA_DEMO_OWNER_ID ?? process.env.BRKFREE_DEMO_OWNER_ID;
  if (demoOwnerId) {
    return demoUserFromId(demoOwnerId);
  }

  const { data: latestAgent } = await admin
    .from("marketing_os_writing_agents")
    .select("owner_id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestAgent?.owner_id) return demoUserFromId(latestAgent.owner_id);

  const { data: latestClient } = await admin
    .from("marketing_os_clients")
    .select("owner_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestClient?.owner_id) return demoUserFromId(latestClient.owner_id);

  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });
  if (error) throw error;

  const demoEmail =
    process.env.JIDOKA_DEMO_EMAIL ?? process.env.BRKFREE_DEMO_EMAIL;
  const demoUser = demoEmail
    ? data.users.find((user) => user.email === demoEmail)
    : null;
  const fallbackUser = demoUser ?? data.users[0];
  if (!fallbackUser) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: demoEmail ?? "demo@jidoka.local",
      email_confirm: true,
      password: `JidokaOS-${crypto.randomUUID()}!`,
    });

    if (createError || !created.user) {
      throw new Error(
        `${DEMO_SESSION_ERROR} Supabase could not create a demo Auth user: ${
          createError?.message ?? "No user returned"
        }`,
      );
    }

    return created.user;
  }
  return fallbackUser;
}

async function getPasswordDemoContext(): Promise<{
  user: User;
  supabase: ServerSupabaseClient;
} | null> {
  const email = (
    process.env.JIDOKA_DEMO_EMAIL ?? process.env.BRKFREE_DEMO_EMAIL
  )?.trim();
  const password = (
    process.env.JIDOKA_DEMO_PASSWORD ?? process.env.BRKFREE_DEMO_PASSWORD
  )?.trim();
  if (!email || !password) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    console.error(`Demo sign-in failed: ${error?.message ?? "No user returned"}`);
    return null;
  }

  return { user: data.user, supabase };
}

export async function getAuthContext(): Promise<{
  user: User;
  supabase: AuthSupabaseClient;
} | null> {
  if (LOGIN_DISABLED) {
    const passwordDemo = await getPasswordDemoContext();
    if (passwordDemo) return passwordDemo;

    const admin = createAdminClient();
    const demoUser = await resolveDemoUser(admin);
    return { user: demoUser, supabase: admin };
  }

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (user) return { user, supabase };
  return null;
}

export async function getCurrentUser(supabase: ServerSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Resolve the signed-in user for a Server Component / Server Action / Route
 * Handler. When login is enabled, redirects to /login when there is no session.
 * When login is disabled, creates a quiet demo session for the visitor.
 */
export async function requireUser() {
  const context = await getAuthContext();

  if (!context) {
    if (LOGIN_DISABLED) {
      throw new Error(DEMO_SESSION_ERROR);
    }
    redirect("/login");
  }

  return context;
}
