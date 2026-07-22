import { CheckCircle2 } from "lucide-react";

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
import { updateApprovalStatusAction } from "./actions";

export const metadata = { title: "Approvals · Jidoka Marketing Team OS" };

type ApprovalRow = {
  id: string;
  campaign_id: string | null;
  client_id: string | null;
  reviewer_email: string | null;
  reviewer_name: string | null;
  status: string;
  message: string | null;
  response_note: string | null;
  due_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export default async function ApprovalsPage() {
  const { user, supabase } = await requireUser();
  const [approvalsResult, campaignsResult, clientsResult] = await Promise.all([
    opsTable(supabase, "marketing_os_approval_requests")
      .select("id, campaign_id, client_id, reviewer_email, reviewer_name, status, message, response_note, due_at, reviewed_at, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    opsTable(supabase, "marketing_os_campaigns")
      .select(
        "id, owner_id, client_id, name, campaign_type, status, stage, health, priority, goal, primary_kpi, target_audience, owner_name, budget, actual_spend, expected_revenue, attributed_revenue, lead_goal, leads_count, start_date, end_date, notes, created_at, updated_at",
      )
      .eq("owner_id", user.id),
    supabase
      .from("marketing_os_clients")
      .select("id, name, industry")
      .eq("owner_id", user.id),
  ]);

  const schemaMissing = isOpsSchemaMissing(approvalsResult.error);
  const approvals = schemaMissing
    ? []
    : asRows<ApprovalRow>(approvalsResult.data);
  const campaigns = schemaMissing
    ? []
    : asRows<CampaignRow>(campaignsResult.data);
  const clients = (clientsResult.data ?? []) as ClientOption[];
  const campaignById = new Map(campaigns.map((item) => [item.id, item]));
  const clientById = new Map(clients.map((item) => [item.id, item]));
  const pending = approvals.filter((item) => item.status === "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Review campaign deliverables, capture decision notes, and keep approvals out of chat threads."
      />

      {schemaMissing && <OpsSchemaNotice />}

      {!schemaMissing && approvals.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No approvals in queue"
          description="Approval requests created from generated content or scheduled posts will appear here."
        />
      ) : (
        !schemaMissing && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric label="Pending" value={pending.length} />
              <Metric
                label="Approved"
                value={approvals.filter((item) => item.status === "approved").length}
              />
              <Metric
                label="Needs changes"
                value={
                  approvals.filter((item) => item.status === "changes_requested").length
                }
              />
            </div>

            {approvals.map((approval) => {
              const campaign = approval.campaign_id
                ? campaignById.get(approval.campaign_id)
                : null;
              const client = approval.client_id
                ? clientById.get(approval.client_id)
                : null;
              return (
                <Card key={approval.id}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {campaign?.name ?? client?.name ?? "Campaign deliverable"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Reviewer:{" "}
                          {approval.reviewer_name ??
                            approval.reviewer_email ??
                            "Not assigned"}{" "}
                          · Due {formatDate(approval.due_at)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          approval.status === "changes_requested" ||
                          approval.status === "rejected"
                            ? "destructive"
                            : approval.status === "approved"
                              ? "default"
                              : "outline"
                        }
                      >
                        {titleCase(approval.status)}
                      </Badge>
                    </div>
                    {approval.message && (
                      <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                        {approval.message}
                      </p>
                    )}
                    {approval.response_note && (
                      <p className="text-sm text-muted-foreground">
                        Decision note: {approval.response_note}
                      </p>
                    )}
                    <form
                      action={updateApprovalStatusAction}
                      className="grid gap-2 lg:grid-cols-[1fr_auto_auto_auto_auto]"
                    >
                      <input type="hidden" name="id" value={approval.id} />
                      <input
                        type="hidden"
                        name="campaign_id"
                        value={approval.campaign_id ?? ""}
                      />
                      <Textarea
                        name="response_note"
                        placeholder="Decision note"
                        defaultValue={approval.response_note ?? ""}
                      />
                      {["approved", "changes_requested", "rejected", "cancelled"].map(
                        (status) => (
                          <Button
                            key={status}
                            type="submit"
                            name="status"
                            value={status}
                            variant={
                              status === "approved"
                                ? "default"
                                : status === "rejected"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {titleCase(status)}
                          </Button>
                        ),
                      )}
                    </form>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
