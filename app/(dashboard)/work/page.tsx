import { ListChecks } from "lucide-react";

import { requireUser } from "@/lib/auth";
import {
  asRows,
  formatDate,
  isOpsSchemaMissing,
  opsTable,
  titleCase,
  type CampaignRow,
  type ClientOption,
  type WorkItemRow,
} from "@/lib/marketing-os/operations";
import { EmptyState } from "@/components/empty-state";
import { OpsSchemaNotice } from "@/components/ops-schema-notice";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createWorkItemAction, updateWorkStatusAction } from "./actions";

export const metadata = { title: "Work · Jidoka Marketing Team OS" };

const COLUMNS = [
  { title: "To do", statuses: ["backlog", "not_started"] },
  { title: "In progress", statuses: ["in_progress", "blocked"] },
  { title: "Review", statuses: ["in_review", "approved"] },
  { title: "Done", statuses: ["done"] },
];

export default async function WorkPage() {
  const { user, supabase } = await requireUser();
  const [campaignsResult, workResult, clientsResult] = await Promise.all([
    opsTable(supabase, "marketing_os_campaigns")
      .select(
        "id, owner_id, client_id, name, campaign_type, status, stage, health, priority, goal, primary_kpi, target_audience, owner_name, budget, actual_spend, expected_revenue, attributed_revenue, lead_goal, leads_count, start_date, end_date, notes, created_at, updated_at",
      )
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false }),
    opsTable(supabase, "marketing_os_work_items")
      .select("id, campaign_id, client_id, title, description, work_type, status, priority, assignee_name, due_at, estimate_hours, actual_hours, created_at, updated_at")
      .eq("owner_id", user.id)
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("marketing_os_clients")
      .select("id, name, industry")
      .eq("owner_id", user.id)
      .order("name"),
  ]);

  const schemaMissing = isOpsSchemaMissing(workResult.error);
  const workItems = schemaMissing ? [] : asRows<WorkItemRow>(workResult.data);
  const campaigns = schemaMissing
    ? []
    : asRows<CampaignRow>(campaignsResult.data);
  const clients = (clientsResult.data ?? []) as ClientOption[];
  const campaignById = new Map(campaigns.map((item) => [item.id, item]));
  const clientById = new Map(clients.map((item) => [item.id, item]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Work"
        description="Assign and move strategy, creative, publishing, analytics, and client communication work across campaigns."
      >
        <ButtonLink href="/campaigns" variant="outline">
          Campaigns
        </ButtonLink>
      </PageHeader>

      {schemaMissing && <OpsSchemaNotice />}

      {!schemaMissing && (
        <Card>
          <CardHeader>
            <CardTitle>Create work item</CardTitle>
            <CardDescription>
              Work can stand alone or attach to a campaign and client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={createWorkItemAction}
              className="grid gap-3 lg:grid-cols-[1fr_180px_180px_160px_auto]"
            >
              <Input name="title" placeholder="Task title" required />
              <select
                name="campaign_id"
                className="flex h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
                defaultValue=""
              >
                <option value="">No campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              <select
                name="client_id"
                className="flex h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
                defaultValue=""
              >
                <option value="">No client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <Input name="assignee_name" placeholder="Assignee" />
              <Button type="submit">Add</Button>
              <Textarea
                name="description"
                placeholder="Details"
                className="lg:col-span-2"
              />
              <select
                name="work_type"
                className="flex h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
              >
                {[
                  "strategy",
                  "content",
                  "design",
                  "video",
                  "publishing",
                  "lead_gen",
                  "analytics",
                  "client_comms",
                  "ops",
                ].map((item) => (
                  <option key={item} value={item}>
                    {titleCase(item)}
                  </option>
                ))}
              </select>
              <select
                name="priority"
                className="flex h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
              >
                {["low", "medium", "high", "urgent"].map((item) => (
                  <option key={item} value={item}>
                    {titleCase(item)}
                  </option>
                ))}
              </select>
              <Input name="due_at" type="date" aria-label="Due date" />
            </form>
          </CardContent>
        </Card>
      )}

      {!schemaMissing && workItems.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No work assigned"
          description="Create work from this page, a campaign brief, or an intelligence item."
        />
      ) : (
        !schemaMissing && (
          <div className="grid gap-4 xl:grid-cols-4">
            {COLUMNS.map((column) => {
              const columnItems = workItems.filter((item) =>
                column.statuses.includes(item.status),
              );
              return (
                <Card key={column.title} className="min-h-80">
                  <CardHeader>
                    <CardTitle className="text-base">{column.title}</CardTitle>
                    <CardDescription>{columnItems.length} items</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {columnItems.length === 0 ? (
                      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Nothing here.
                      </p>
                    ) : (
                      columnItems.map((item) => {
                        const campaign = item.campaign_id
                          ? campaignById.get(item.campaign_id)
                          : null;
                        const client = item.client_id
                          ? clientById.get(item.client_id)
                          : null;
                        return (
                          <div key={item.id} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {campaign?.name ?? client?.name ?? "General"} ·{" "}
                                  {formatDate(item.due_at)}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  item.priority === "urgent"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {titleCase(item.priority)}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge variant="secondary">
                                {titleCase(item.work_type)}
                              </Badge>
                              <Badge variant="outline">
                                {item.assignee_name ?? "Unassigned"}
                              </Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {["in_progress", "in_review", "approved", "done"].map(
                                (status) => (
                                  <form
                                    key={status}
                                    action={updateWorkStatusAction}
                                  >
                                    <input type="hidden" name="id" value={item.id} />
                                    <input
                                      type="hidden"
                                      name="campaign_id"
                                      value={item.campaign_id ?? ""}
                                    />
                                    <input
                                      type="hidden"
                                      name="actual_hours"
                                      value={item.actual_hours ?? item.estimate_hours ?? 0}
                                    />
                                    <input
                                      type="hidden"
                                      name="status"
                                      value={status}
                                    />
                                    <Button
                                      type="submit"
                                      size="xs"
                                      variant={
                                        item.status === status
                                          ? "default"
                                          : "outline"
                                      }
                                    >
                                      {titleCase(status)}
                                    </Button>
                                  </form>
                                ),
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
