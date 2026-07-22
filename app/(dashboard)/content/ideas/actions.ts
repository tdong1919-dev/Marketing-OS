"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { opsTable } from "@/lib/marketing-os/operations";

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function createContentIdeaAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const title = textValue(formData, "title");
  if (!title) return;

  await opsTable(supabase, "marketing_os_content_ideas").insert({
    owner_id: user.id,
    organization_id: user.id,
    campaign_id: textValue(formData, "campaign_id"),
    client_id: textValue(formData, "client_id"),
    agent_id: textValue(formData, "agent_id"),
    title,
    description: textValue(formData, "description"),
    source: textValue(formData, "source") ?? "manual",
    format: textValue(formData, "format"),
    platform: textValue(formData, "platform"),
    funnel_stage: textValue(formData, "funnel_stage") ?? "awareness",
    status: textValue(formData, "status") ?? "idea",
  });

  revalidatePath("/content/ideas");
  revalidatePath("/dashboard");
  const campaignId = textValue(formData, "campaign_id");
  if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
}

export async function updateContentIdeaStatusAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const id = textValue(formData, "id");
  const status = textValue(formData, "status");
  if (!id || !status) return;

  await opsTable(supabase, "marketing_os_content_ideas")
    .update({ status })
    .eq("id", id)
    .eq("owner_id", user.id);

  revalidatePath("/content/ideas");
  revalidatePath("/dashboard");
  const campaignId = textValue(formData, "campaign_id");
  if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
}
