"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { opsTable } from "@/lib/marketing-os/operations";

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function numberValue(formData: FormData, key: string) {
  const value = Number(formData.get(key) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export async function createWorkItemAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const title = textValue(formData, "title");
  if (!title) return;

  await opsTable(supabase, "marketing_os_work_items").insert({
    owner_id: user.id,
    organization_id: user.id,
    campaign_id: textValue(formData, "campaign_id"),
    client_id: textValue(formData, "client_id"),
    title,
    description: textValue(formData, "description"),
    work_type: textValue(formData, "work_type") ?? "content",
    status: textValue(formData, "status") ?? "not_started",
    priority: textValue(formData, "priority") ?? "medium",
    assignee_name: textValue(formData, "assignee_name"),
    due_at: textValue(formData, "due_at"),
    estimate_hours: numberValue(formData, "estimate_hours"),
    created_by: user.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/work");
  const campaignId = textValue(formData, "campaign_id");
  if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
}

export async function updateWorkStatusAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const id = textValue(formData, "id");
  const status = textValue(formData, "status");
  if (!id || !status) return;

  await opsTable(supabase, "marketing_os_work_items")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
      actual_hours: numberValue(formData, "actual_hours"),
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/work");
  const campaignId = textValue(formData, "campaign_id");
  if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
}
