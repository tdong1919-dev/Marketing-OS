import { Inbox } from "lucide-react";

import { requireUser } from "@/lib/auth";
import {
  asRows,
  formatDate,
  isOpsSchemaMissing,
  opsTable,
  titleCase,
  type CampaignRow,
  type ClientOption,
} from "@/lib/marketing-os/operations";
import { EmptyState } from "@/components/empty-state";
import { OpsSchemaNotice } from "@/components/ops-schema-notice";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateInboxThreadStatusAction } from "./actions";

export const metadata = { title: "Inbox · Jidoka Marketing Team OS" };

type InboxThread = {
  id: string;
  campaign_id?: string | null;
  client_id: string | null;
  agent_id: string | null;
  platform: string;
  channel: string;
  participant_username: string | null;
  status: string;
  review_reason: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type InboxMessage = {
  id: string;
  thread_id: string;
  role: string;
  body: string;
  status: string;
  created_at: string;
};

export default async function InboxPage() {
  const { user, supabase } = await requireUser();
  const threadsResult = await opsTable(supabase, "marketing_os_inbox_threads")
    .select("id, campaign_id, client_id, agent_id, platform, channel, participant_username, status, review_reason, last_message_at, created_at, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  const schemaMissing = isOpsSchemaMissing(threadsResult.error);

  const [fallbackThreads, campaignsResult, clientsResult] = await Promise.all([
    schemaMissing
      ? opsTable(supabase, "marketing_os_inbox_threads")
          .select("id, client_id, agent_id, platform, channel, participant_username, status, review_reason, last_message_at, created_at, updated_at")
          .eq("owner_id", user.id)
          .order("updated_at", { ascending: false })
      : Promise.resolve({ data: null }),
    schemaMissing
      ? Promise.resolve({ data: null })
      : opsTable(supabase, "marketing_os_campaigns")
          .select(
            "id, owner_id, client_id, name, campaign_type, status, stage, health, priority, goal, primary_kpi, target_audience, owner_name, budget, actual_spend, expected_revenue, attributed_revenue, lead_goal, leads_count, start_date, end_date, notes, created_at, updated_at",
          )
          .eq("owner_id", user.id),
    supabase
      .from("marketing_os_clients")
      .select("id, name, industry")
      .eq("owner_id", user.id),
  ]);

  const threads = schemaMissing
    ? asRows<InboxThread>(fallbackThreads.data)
    : asRows<InboxThread>(threadsResult.data);
  const messagesResult =
    threads.length > 0
      ? await opsTable(supabase, "marketing_os_inbox_messages")
          .select("id, thread_id, role, body, status, created_at")
          .eq("owner_id", user.id)
          .in(
            "thread_id",
            threads.map((thread) => thread.id),
          )
          .order("created_at", { ascending: false })
      : { data: null, error: null };
  const messages = asRows<InboxMessage>(messagesResult.data);
  const latestByThread = new Map<string, InboxMessage>();
  for (const message of messages) {
    if (!latestByThread.has(message.thread_id)) {
      latestByThread.set(message.thread_id, message);
    }
  }
  const campaigns = schemaMissing
    ? []
    : asRows<CampaignRow>(campaignsResult.data);
  const clients = (clientsResult.data ?? []) as ClientOption[];
  const campaignById = new Map(campaigns.map((item) => [item.id, item]));
  const clientById = new Map(clients.map((item) => [item.id, item]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        description="Review inbound comments, DMs, client messages, and AI-drafted replies before they move forward."
      />

      {schemaMissing && <OpsSchemaNotice title="Campaign inbox links need migration 0016" />}

      {threads.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Inbox is clear"
          description="Inbound social review threads and client communication items will appear here."
        />
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const latest = latestByThread.get(thread.id);
            const campaign = thread.campaign_id
              ? campaignById.get(thread.campaign_id)
              : null;
            const client = thread.client_id ? clientById.get(thread.client_id) : null;
            return (
              <Card key={thread.id}>
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {thread.participant_username ??
                          campaign?.name ??
                          client?.name ??
                          "Inbox thread"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {titleCase(thread.platform)} · {titleCase(thread.channel)} ·{" "}
                        {campaign?.name ?? client?.name ?? "No campaign"} ·{" "}
                        {formatDate(thread.last_message_at ?? thread.updated_at)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        thread.status === "needs_review"
                          ? "destructive"
                          : thread.status === "resolved"
                            ? "default"
                            : "outline"
                      }
                    >
                      {titleCase(thread.status)}
                    </Badge>
                  </div>
                  {thread.review_reason && (
                    <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                      {thread.review_reason}
                    </p>
                  )}
                  {latest && (
                    <p className="text-sm text-muted-foreground">
                      Latest {titleCase(latest.role)}: {latest.body}
                    </p>
                  )}
                  <form
                    action={updateInboxThreadStatusAction}
                    className="grid gap-2 lg:grid-cols-[1fr_auto_auto_auto_auto]"
                  >
                    <input type="hidden" name="id" value={thread.id} />
                    <input
                      type="hidden"
                      name="campaign_id"
                      value={thread.campaign_id ?? ""}
                    />
                    <Textarea name="note" placeholder="Review note" />
                    {["approved", "rejected", "posted", "resolved"].map((status) => (
                      <Button
                        key={status}
                        type="submit"
                        name="status"
                        value={status}
                        variant={
                          status === "rejected"
                            ? "destructive"
                            : status === "approved"
                              ? "default"
                              : "outline"
                        }
                      >
                        {titleCase(status)}
                      </Button>
                    ))}
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
