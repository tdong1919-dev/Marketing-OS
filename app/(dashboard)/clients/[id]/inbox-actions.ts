"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { ensureCommentDmInboxDraft } from "@/lib/inbox";

type ReviewDecision = "approve" | "reject";

function text(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function reviewStatus(decision: ReviewDecision) {
  return decision === "approve" ? "approved" : "rejected";
}

async function updateOrInsertMessage({
  supabase,
  threadId,
  ownerId,
  messageType,
  body,
  status,
}: {
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"];
  threadId: string;
  ownerId: string;
  messageType: "public_reply" | "dm";
  body: string;
  status: string;
}) {
  const cleanBody = body.trim();
  if (!cleanBody) return;

  const { data: existing } = await supabase
    .from("marketing_os_inbox_messages")
    .select("id")
    .eq("thread_id", threadId)
    .eq("message_type", messageType)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("marketing_os_inbox_messages")
      .update({ body: cleanBody, status })
      .eq("id", existing.id)
      .eq("owner_id", ownerId);
    return;
  }

  await supabase.from("marketing_os_inbox_messages").insert({
    thread_id: threadId,
    owner_id: ownerId,
    role: "assistant",
    message_type: messageType,
    body: cleanBody,
    ai_generated: true,
    status,
  });
}

export async function reviewInboxThreadAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const clientId = text(formData.get("client_id"));
  const threadIdFromForm = text(formData.get("thread_id"));
  const scheduledPostId = text(formData.get("scheduled_post_id"));
  const rawDecision = text(formData.get("action"));
  const publicReply = text(formData.get("public_reply"));
  const dmSequence = text(formData.get("dm_sequence"));
  const note = text(formData.get("note"));

  if (rawDecision !== "approve" && rawDecision !== "reject") return;
  const decision = rawDecision as ReviewDecision;
  const nextStatus = reviewStatus(decision);
  let threadId = threadIdFromForm || null;

  if (!threadId && scheduledPostId) {
    const { data: post } = await supabase
      .from("marketing_os_scheduled_posts")
      .select(
        "id, owner_id, agent_id, social_account_id, platform, title, caption, comment_auto_reply, dm_sequence",
      )
      .eq("id", scheduledPostId)
      .maybeSingle();

    if (!post || post.owner_id !== user.id) return;

    const { data: agent } = await supabase
      .from("marketing_os_writing_agents")
      .select("client_id")
      .eq("id", post.agent_id)
      .maybeSingle();

    threadId = await ensureCommentDmInboxDraft({
      supabase,
      post,
      clientId: agent?.client_id ?? (clientId || null),
    });
  }

  if (!threadId) return;

  const { data: thread } = await supabase
    .from("marketing_os_inbox_threads")
    .select("id, owner_id, client_id, scheduled_post_id")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread || thread.owner_id !== user.id) return;

  await Promise.all([
    updateOrInsertMessage({
      supabase,
      threadId,
      ownerId: user.id,
      messageType: "public_reply",
      body: publicReply,
      status: nextStatus,
    }),
    updateOrInsertMessage({
      supabase,
      threadId,
      ownerId: user.id,
      messageType: "dm",
      body: dmSequence,
      status: nextStatus,
    }),
  ]);

  await supabase
    .from("marketing_os_inbox_threads")
    .update({
      status: nextStatus,
      review_reason: note || null,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", threadId)
    .eq("owner_id", user.id);

  const scheduledId = thread.scheduled_post_id ?? (scheduledPostId || null);
  if (scheduledId && (publicReply || dmSequence)) {
    await supabase
      .from("marketing_os_scheduled_posts")
      .update({
        ...(publicReply ? { comment_auto_reply: publicReply } : {}),
        ...(dmSequence ? { dm_sequence: dmSequence } : {}),
      })
      .eq("id", scheduledId)
      .eq("owner_id", user.id);
  }

  await supabase.from("marketing_os_inbox_reviews").insert({
    thread_id: threadId,
    owner_id: user.id,
    reviewer_id: user.id,
    action: nextStatus,
    edited_body: [publicReply, dmSequence].filter(Boolean).join("\n\n") || null,
    note: note || null,
    metadata: {
      source: "client_inbox",
      scheduled_post_id: scheduledId,
      client_id: clientId || thread.client_id,
    },
  });

  if (clientId) revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/scheduler");
  revalidatePath("/calendar");
}
