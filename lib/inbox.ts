import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type JidokaSupabase = SupabaseClient<Database>;

export type ScheduledPostInboxDraft = {
  id: string;
  owner_id: string;
  agent_id: string;
  social_account_id: string | null;
  platform: string;
  title: string | null;
  caption: string | null;
  comment_auto_reply: string | null;
  dm_sequence: string | null;
};

export async function ensureCommentDmInboxDraft({
  supabase,
  post,
  clientId,
}: {
  supabase: JidokaSupabase;
  post: ScheduledPostInboxDraft;
  clientId: string | null;
}) {
  if (post.platform !== "instagram") return null;

  const { data: existing, error: existingError } = await supabase
    .from("marketing_os_inbox_threads")
    .select("id")
    .eq("scheduled_post_id", post.id)
    .maybeSingle();

  if (existing?.id) return existing.id;
  if (existingError && existingError.code !== "PGRST116") {
    console.warn("[inbox] could not check thread", existingError.message);
  }

  const { data: thread, error: threadError } = await supabase
    .from("marketing_os_inbox_threads")
    .insert({
      owner_id: post.owner_id,
      client_id: clientId,
      agent_id: post.agent_id,
      social_account_id: post.social_account_id,
      scheduled_post_id: post.id,
      platform: "instagram",
      channel: "comment",
      status: "needs_review",
      review_reason: "Instagram Comment-to-DM flow needs human review.",
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (threadError || !thread) {
    console.warn(
      "[inbox] could not create thread",
      threadError?.message ?? "No thread returned",
    );
    return null;
  }

  const incoming = post.caption || post.title || "Scheduled Instagram post";
  const publicReply = post.comment_auto_reply || "Needs a public comment reply.";
  const dmSequence = post.dm_sequence || "Needs a DM sequence.";

  const { error: messageError } = await supabase.from("marketing_os_inbox_messages").insert([
    {
      thread_id: thread.id,
      owner_id: post.owner_id,
      role: "commenter",
      message_type: "comment",
      body: incoming,
      ai_generated: false,
      status: "draft",
    },
    {
      thread_id: thread.id,
      owner_id: post.owner_id,
      role: "assistant",
      message_type: "public_reply",
      body: publicReply,
      ai_generated: true,
      status: "draft",
    },
    {
      thread_id: thread.id,
      owner_id: post.owner_id,
      role: "assistant",
      message_type: "dm",
      body: dmSequence,
      ai_generated: true,
      status: "draft",
    },
  ]);

  if (messageError) {
    console.warn("[inbox] could not create messages", messageError.message);
  }

  return thread.id;
}
