import { NextResponse } from "next/server";

import { encryptToken } from "@/lib/crypto";
import { getAuthContext } from "@/lib/auth";
import { LOGIN_DISABLED } from "@/lib/auth-mode";
import { getSiteOrigin } from "@/lib/site-url";

export const runtime = "nodejs";

function redirectToAgent(origin: string, agentId: string, reason: string) {
  return NextResponse.redirect(
    `${origin}/agents/${agentId}?tab=connections&connect=${reason}`,
  );
}

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
      `${origin}/agents?tab=connections&connect=error&reason=${encodeURIComponent(errorParam)}`,
    );
  }
  if (!code || !stateRaw) {
    return NextResponse.redirect(`${origin}/agents?connect=error`);
  }

  let state: { agent_id: string; uid: string };
  try {
    state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8"));
  } catch {
    return NextResponse.redirect(`${origin}/agents?connect=error`);
  }
  if (state.uid !== user.id) {
    return redirectToAgent(origin, state.agent_id, "error");
  }

  const { data: agent } = await supabase
    .from("marketing_os_writing_agents")
    .select("id")
    .eq("id", state.agent_id)
    .maybeSingle();
  if (!agent) return redirectToAgent(origin, state.agent_id, "error");

  try {
    const redirectUri = `${origin}/api/social/youtube/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(tokens.error_description ?? "Google token exchange failed");
    }
    if (!tokens.refresh_token) {
      throw new Error("Google did not return a refresh token. Try connecting again.");
    }

    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    const channelJson = await channelRes.json();
    const channel = channelJson.items?.[0];
    const channelId = channel?.id ?? null;
    const channelTitle = channel?.snippet?.title ?? null;
    const profilePictureUrl =
      channel?.snippet?.thumbnails?.default?.url ??
      channel?.snippet?.thumbnails?.medium?.url ??
      null;

    const row = {
      agent_id: state.agent_id,
      owner_id: user.id,
      platform: "youtube",
      external_account_id: channelId,
      username: channelTitle,
      profile_picture_url: profilePictureUrl,
      access_token_encrypted: encryptToken(tokens.access_token),
      page_token_encrypted: encryptToken(tokens.refresh_token),
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString()
        : null,
      status: "active",
      connected_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("marketing_os_social_accounts")
      .select("id")
      .eq("agent_id", state.agent_id)
      .eq("platform", "youtube")
      .maybeSingle();
    const { error } = existing
      ? await supabase
          .from("marketing_os_social_accounts")
          .update(row)
          .eq("id", existing.id)
      : await supabase.from("marketing_os_social_accounts").insert(row);
    if (error) throw error;

    return redirectToAgent(origin, state.agent_id, "success");
  } catch (err) {
    const message = err instanceof Error ? err.message : "youtube_connect_failed";
    return NextResponse.redirect(
      `${origin}/agents/${state.agent_id}?tab=connections&connect=error&reason=${encodeURIComponent(message)}`,
    );
  }
}
