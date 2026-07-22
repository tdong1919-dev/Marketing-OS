"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";

export type FormState = { error: string } | null;

export async function createClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, supabase } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) {
    return { error: "Client name is required." };
  }

  const { error } = await supabase
    .from("marketing_os_clients")
    .insert({ owner_id: user.id, name, industry, notes });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/clients");
  redirect("/clients");
}

export async function deleteClientAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await supabase.from("marketing_os_clients").delete().eq("id", id);
    revalidatePath("/clients");
  }
}
