import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getAuthContext } from "@/lib/auth";
import { LOGIN_DISABLED } from "@/lib/auth-mode";
import { exchangeMetaCodeForLongLivedToken } from "@/lib/social/meta";
import { encryptToken } from "@/lib/crypto";
import { getSiteOrigin } from "@/lib/site-url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = getSiteOrigin(request);
  const context = await getAuthContext();
  if (!context) {
    return NextResponse.redirect(
      `${origin}${LOGIN_DISABLED ? "/dashboard?connect=session_error" : "/login"}`,
    );
  }
  const { user, supabase } = context;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/agents?connect=error&reason=${encodeURIComponent(errorParam)}`,
    );
  }
  if (!code || !stateRaw) {
    return NextResponse.redirect(`${origin}/agents?connect=error`);
  }

  let state: { agent_id: string; platform: string; uid: string };
  try {
    state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8"));
  } catch {
    return NextResponse.redirect(`${origin}/agents?connect=error`);
  }

  // CSRF: state must belong to the signed-in user.
  if (state.uid !== user.id) {
    return NextResponse.redirect(`${origin}/agents?connect=error`);
  }

  // Verify agent ownership.
  const { data: agent } = await supabase
    .from("marketing_os_writing_agents")
    .select("id")
    .eq("id", state.agent_id)
    .maybeSingle();
  if (!agent) return NextResponse.redirect(`${origin}/agents?connect=error`);

  try {
    const longLivedUserToken = await exchangeMetaCodeForLongLivedToken(
      code,
      `${origin}/api/social/callback`,
    );
    const cookieStore = await cookies();
    cookieStore.set(
      "marketing_os_meta_select",
      encryptToken(
        JSON.stringify({
          token: longLivedUserToken,
          agent_id: state.agent_id,
          platform: state.platform,
          uid: user.id,
        }),
      ),
      {
        httpOnly: true,
        secure: origin.startsWith("https://"),
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      },
    );

    return NextResponse.redirect(
      `${origin}/social/meta/select?agent_id=${encodeURIComponent(
        state.agent_id,
      )}&platform=${encodeURIComponent(state.platform)}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "connect_failed";
    return NextResponse.redirect(
      `${origin}/agents/${state.agent_id}?tab=connections&connect=error&reason=${encodeURIComponent(message)}`,
    );
  }
}
