"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";

export async function deleteAssetAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const agentId = String(formData.get("agent_id") ?? "");
  if (!id) return;

  // Fetch storage path so we can clean up the stored file too.
  const { data: asset } = await supabase
    .from("marketing_os_uploaded_assets")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (asset?.storage_path) {
    await supabase.storage.from("marketing-os-assets").remove([asset.storage_path]);
  }

  // Cascades to uploaded_scripts via FK on delete cascade.
  await supabase.from("marketing_os_uploaded_assets").delete().eq("id", id);

  if (agentId) revalidatePath(`/agents/${agentId}`);
}
