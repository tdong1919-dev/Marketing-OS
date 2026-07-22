"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";

export async function disconnectSocialAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const agentId = String(formData.get("agent_id") ?? "");
  if (!id) return;
  await supabase.from("marketing_os_social_accounts").delete().eq("id", id);
  if (agentId) revalidatePath(`/agents/${agentId}`);
}
