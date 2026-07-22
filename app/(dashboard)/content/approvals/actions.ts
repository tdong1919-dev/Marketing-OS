"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { opsTable } from "@/lib/marketing-os/operations";

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function updateApprovalStatusAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const id = textValue(formData, "id");
  const status = textValue(formData, "status");
  if (!id || !status) return;

  await opsTable(supabase, "marketing_os_approval_requests")
    .update({
      status,
      response_note: textValue(formData, "response_note"),
      reviewed_at: ["approved", "changes_requested", "rejected"].includes(status)
        ? new Date().toISOString()
        : null,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  revalidatePath("/content/approvals");
  revalidatePath("/dashboard");
  const campaignId = textValue(formData, "campaign_id");
  if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
}
