"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { matchGeneratedByTitle } from "@/lib/scheduler";

export async function scheduleAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const when = String(formData.get("scheduled_time") ?? "");
  if (!id || !when) return;

  const { data: post } = await supabase
    .from("marketing_os_scheduled_posts")
    .select("social_account_id")
    .eq("id", id)
    .maybeSingle();

  await supabase
    .from("marketing_os_scheduled_posts")
    .update({
      scheduled_time: new Date(when).toISOString(),
      status: post?.social_account_id ? "scheduled" : "draft",
    })
    .eq("id", id);
  revalidatePath("/scheduler");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/generated");
}

export async function unscheduleAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase
    .from("marketing_os_scheduled_posts")
    .update({ status: "draft", scheduled_time: null })
    .eq("id", id);
  revalidatePath("/scheduler");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/generated");
}

/** Re-run the TITLE match (useful after generating content post-upload). */
export async function rematchAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: post } = await supabase
    .from("marketing_os_scheduled_posts")
    .select("id, agent_id, title")
    .eq("id", id)
    .maybeSingle();
  if (!post?.title) return;

  const match = await matchGeneratedByTitle(supabase, post.agent_id, post.title);
  await supabase
    .from("marketing_os_scheduled_posts")
    .update({
      generated_content_id: match?.generated_content_id ?? null,
      caption: match?.caption ?? null,
      script: match?.script ?? null,
    })
    .eq("id", id);
  revalidatePath("/scheduler");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/generated");
}

export async function updateCaptionAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const caption = String(formData.get("caption") ?? "").trim();
  if (!id) return;

  await supabase
    .from("marketing_os_scheduled_posts")
    .update({ caption: caption || null })
    .eq("id", id);
  revalidatePath("/scheduler");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/generated");
}

export async function duplicatePostAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: post } = await supabase
    .from("marketing_os_scheduled_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!post) return;

  await supabase.from("marketing_os_scheduled_posts").insert({
    agent_id: post.agent_id,
    owner_id: user.id,
    generated_content_id: post.generated_content_id,
    social_account_id: post.social_account_id,
    platform: post.platform,
    title: `Copy of ${post.title || "scheduled post"}`,
    caption: post.caption,
    script: post.script,
    media_url: post.media_url,
    media_path: post.media_path,
    content_type: post.content_type,
    status: "draft",
    scheduled_time: null,
    best_posting_window: post.best_posting_window,
    ideal_days: post.ideal_days,
    confidence_score: post.confidence_score,
    schedule_reason: post.schedule_reason,
    comment_dm_enabled: post.comment_dm_enabled,
    comment_auto_reply: post.comment_auto_reply,
    dm_sequence: post.dm_sequence,
    source_import: post.source_import,
    media_file_name: post.media_file_name,
  });

  revalidatePath("/scheduler");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/generated");
}

export async function deletePostAction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data: post } = await supabase
    .from("marketing_os_scheduled_posts")
    .select("media_path")
    .eq("id", id)
    .maybeSingle();
  if (post?.media_path) {
    const { count } = await supabase
      .from("marketing_os_scheduled_posts")
      .select("id", { count: "exact", head: true })
      .eq("media_path", post.media_path)
      .neq("id", id);
    if (!count) {
      await supabase.storage.from("marketing-os-media").remove([post.media_path]);
    }
  }
  await supabase.from("marketing_os_scheduled_posts").delete().eq("id", id);
  revalidatePath("/scheduler");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/generated");
}
