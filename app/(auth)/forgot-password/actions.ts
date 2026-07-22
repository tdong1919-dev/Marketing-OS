"use server";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-url";

export type ResetState = { error: string } | { sent: true } | null;

async function originFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  // Reuse the canonical origin logic (forces the production host in prod).
  return getSiteOrigin(new Request(`${proto}://${host}`));
}

export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const origin = await originFromHeaders();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });
  if (error) return { error: error.message };

  // Always report success (don't reveal whether the email exists).
  return { sent: true };
}
