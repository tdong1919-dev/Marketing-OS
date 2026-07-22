"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { opsTable } from "@/lib/marketing-os/operations";

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function actionForStatus(status: string) {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "posted") return "posted";
  return "resolved";
}

export async function updateInboxThreadStatusAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const id = textValue(formData, "id");
  const status = textValue(formData, "status");
  if (!id || !status) return;

  await opsTable(supabase, "marketing_os_inbox_threads")
    .update({ status })
    .eq("id", id)
    .eq("owner_id", user.id);

  await opsTable(supabase, "marketing_os_inbox_reviews").insert({
    owner_id: user.id,
    thread_id: id,
    reviewer_id: user.id,
    action: actionForStatus(status),
    note: textValue(formData, "note"),
  });

  revalidatePath("/inbox");
  revalidatePath("/dashboard");
  const campaignId = textValue(formData, "campaign_id");
  if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
}
