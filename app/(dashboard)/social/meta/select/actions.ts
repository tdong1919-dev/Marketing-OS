"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { decryptToken, encryptToken } from "@/lib/crypto";
import { listMetaConnectionOptions } from "@/lib/social/meta";

type PendingMetaSelection = {
  token: string;
  agent_id: string;
  platform: string;
  uid: string;
};

function parsePendingMetaSelection(raw: string | undefined) {
  if (!raw) return null;

  try {
    return JSON.parse(decryptToken(raw)) as PendingMetaSelection;
  } catch {
    return null;
  }
}

function agentRedirect(agentId: string, connect: string, reason?: string) {
  const params = new URLSearchParams({ tab: "connections", connect });
  if (reason) params.set("reason", reason.slice(0, 220));
  return `/agents/${agentId}?${params.toString()}`;
}

export async function saveSelectedMetaAccountsAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const agentId = String(formData.get("agent_id") ?? "");
  const pageId = String(formData.get("page_id") ?? "");
  const connectFacebook = formData.get("connect_facebook") === "1";
  const connectInstagram = formData.get("connect_instagram") === "1";

  if (!agentId) redirect("/agents?connect=error&reason=Missing%20agent");
  if (!pageId) {
    redirect(agentRedirect(agentId, "error", "Choose a Facebook Page."));
  }
  if (!connectFacebook && !connectInstagram) {
    redirect(
      agentRedirect(agentId, "error", "Choose Facebook, Instagram, or both."),
    );
  }

  const cookieStore = await cookies();
  const pending = parsePendingMetaSelection(
    cookieStore.get("marketing_os_meta_select")?.value,
  );
  if (!pending || pending.agent_id !== agentId || pending.uid !== user.id) {
    redirect(
      agentRedirect(
        agentId,
        "session_error",
        "Meta login expired. Start the connection again.",
      ),
    );
  }

  const { data: agent } = await supabase
    .from("marketing_os_writing_agents")
    .select("id")
    .eq("id", agentId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!agent) redirect("/agents?connect=error&reason=Agent%20not%20found");

  const options = await listMetaConnectionOptions(pending.token);
  const selected = options.find((option) => option.pageId === pageId);
  if (!selected) {
    redirect(
      agentRedirect(agentId, "error", "That Facebook Page is no longer available."),
    );
  }
  if (connectInstagram && !selected.igUserId) {
    redirect(
      agentRedirect(
        agentId,
        "error",
        "This Facebook Page does not have a linked Instagram Business account.",
      ),
    );
  }

  const saveAccount = async (payload: {
    platform: "instagram" | "facebook";
    external_account_id: string;
    username: string | null;
    profile_picture_url?: string | null;
  }) => {
    const row = {
      agent_id: agentId,
      owner_id: user.id,
      platform: payload.platform,
      external_account_id: payload.external_account_id,
      username: payload.username,
      profile_picture_url: payload.profile_picture_url ?? null,
      access_token_encrypted: encryptToken(pending.token),
      page_id: selected.pageId,
      page_token_encrypted: encryptToken(selected.pageToken),
      status: "active",
      connected_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("marketing_os_social_accounts")
      .select("id")
      .eq("agent_id", agentId)
      .eq("platform", payload.platform)
      .maybeSingle();

    const { error } = existing
      ? await supabase
          .from("marketing_os_social_accounts")
          .update(row)
          .eq("id", existing.id)
      : await supabase.from("marketing_os_social_accounts").insert(row);
    if (error) throw error;
  };

  if (connectFacebook) {
    await saveAccount({
      platform: "facebook",
      external_account_id: selected.pageId,
      username: selected.pageName,
    });
  }

  if (connectInstagram && selected.igUserId) {
    await saveAccount({
      platform: "instagram",
      external_account_id: selected.igUserId,
      username: selected.igUsername,
      profile_picture_url: selected.igProfilePictureUrl,
    });
  }

  cookieStore.delete("marketing_os_meta_select");
  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/agents");
  redirect(agentRedirect(agentId, "success"));
}
