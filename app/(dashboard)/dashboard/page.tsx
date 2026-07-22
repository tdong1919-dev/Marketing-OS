import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  DollarSign,
  Lightbulb,
  ListChecks,
  Target,
  Users,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import {
  asRows,
  formatDate,
  formatMoney,
  isOpsSchemaMissing,
  opsTable,
  progressPercent,
  titleCase,
  type CampaignRow,
  type LeadRow,
  type RevenueEventRow,
  type WorkItemRow,
} from "@/lib/marketing-os/operations";
import { PageHeader } from "@/components/page-header";
import {
  DashboardChecklist,
  type DashboardChecklistStep,
} from "@/components/dashboard-checklist";
import { OpsSchemaNotice } from "@/components/ops-schema-notice";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Command Center · Jidoka Marketing Team OS" };

type ApprovalCount = { id: string };

async function getDashboardData() {
  const { user, supabase } = await requireUser();

  const [
    agents,
    clients,
    content,
    assets,
    scheduledPosts,
    latestAgent,
    analytics,
    pendingApprovals,
    campaignsResult,
    briefsResult,
    workResult,
    leadsResult,
    revenueResult,
  ] = await Promise.all([
    supabase
      .from("marketing_os_writing_agents")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("marketing_os_clients")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("marketing_os_generated_content")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("marketing_os_uploaded_assets")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("marketing_os_scheduled_posts")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    supabase
      .from("marketing_os_writing_agents")
      .select("id, last_analyzed_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("marketing_os_platform_analytics")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    opsTable(supabase, "marketing_os_approval_requests")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "pending"),
    opsTable(supabase, "marketing_os_campaigns")
      .select(
        "id, owner_id, client_id, name, campaign_type, status, stage, health, priority, goal, primary_kpi, target_audience, owner_name, budget, actual_spend, expected_revenue, attributed_revenue, lead_goal, leads_count, start_date, end_date, notes, created_at, updated_at",
      )
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(6),
    opsTable(supabase, "marketing_os_campaign_briefs")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id),
    opsTable(supabase, "marketing_os_work_items")
      .select("id, campaign_id, client_id, title, description, work_type, status, priority, assignee_name, due_at, estimate_hours, actual_hours, created_at, updated_at")
      .eq("owner_id", user.id)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(8),
    opsTable(supabase, "marketing_os_leads")
      .select("id, campaign_id, client_id, lead_name, email, status, estimated_value, actual_value, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),
    opsTable(supabase, "marketing_os_revenue_events")
      .select("id, campaign_id, client_id, amount, event_type, occurred_at")
      .eq("owner_id", user.id)
      .order("occurred_at", { ascending: false })
      .limit(25),
  ]);

  const opsSchemaReady = !isOpsSchemaMissing(campaignsResult.error);
  const campaigns = opsSchemaReady
    ? asRows<CampaignRow>(campaignsResult.data)
    : [];
  const workItems = opsSchemaReady ? asRows<WorkItemRow>(workResult.data) : [];
  const leads = opsSchemaReady ? asRows<LeadRow>(leadsResult.data) : [];
  const revenueEvents = opsSchemaReady
    ? asRows<RevenueEventRow>(revenueResult.data)
    : [];

  return {
    user,
    opsSchemaReady,
    agents: agents.count ?? 0,
    clients: clients.count ?? 0,
    content: content.count ?? 0,
    assets: assets.count ?? 0,
    scheduledPosts: scheduledPosts.count ?? 0,
    latestAgent: latestAgent.data,
    analytics: analytics.count ?? 0,
    pendingApprovals: asRows<ApprovalCount>(pendingApprovals.data).length,
    campaigns,
    briefCount: briefsResult.count ?? 0,
    workItems,
    leads,
    revenueEvents,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const name =
    data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0];
  const generateHref = data.latestAgent
    ? `/agents/${data.latestAgent.id}?tab=generate`
    : "/agents";
  const activeCampaigns = data.campaigns.filter((item) =>
    ["planning", "active"].includes(item.status),
  );
  const completedWork = data.workItems.filter((item) => item.status === "done");
  const openWork = data.workItems.filter(
    (item) => !["done", "cancelled"].includes(item.status),
  );
  const revenueTotal =
    data.campaigns.reduce(
      (sum, item) => sum + Number(item.attributed_revenue ?? 0),
      0,
    ) +
    data.revenueEvents.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const leadValue = data.leads.reduce(
    (sum, item) =>
      sum + Number(item.actual_value || item.estimated_value || 0),
    0,
  );

  const checklist: DashboardChecklistStep[] = [
    {
      id: "client",
      label: "Create or choose a client",
      autoDone: data.clients > 0,
      href: data.clients > 0 ? "/clients" : "/clients/new",
    },
    {
      id: "campaign",
      label: "Create a campaign",
      autoDone: data.campaigns.length > 0,
      href: "/campaigns",
    },
    {
      id: "strategy",
      label: "Build the campaign strategy brief",
      autoDone: data.briefCount > 0,
      href: data.campaigns[0] ? `/campaigns/${data.campaigns[0].id}` : "/campaigns",
    },
    {
      id: "work",
      label: "Assign strategy, content, and publishing work",
      autoDone: data.workItems.length > 0,
      href: "/work",
    },
    {
      id: "generate",
      label: "Generate campaign content",
      autoDone: data.content > 0,
      href: generateHref,
    },
    {
      id: "approval",
      label: "Review and approve deliverables",
      autoDone: data.content > 0 && data.pendingApprovals === 0,
      href: "/content/approvals",
    },
    {
      id: "schedule",
      label: "Schedule and publish content",
      autoDone: data.scheduledPosts > 0,
      href: "/publishing",
    },
    {
      id: "insights",
      label: "Review leads, revenue, and next improvements",
      autoDone: data.analytics > 0 || data.leads.length > 0,
      href: "/analytics",
    },
  ];

  const stats = [
    {
      label: "Clients",
      value: data.clients,
      icon: Users,
      href: "/clients",
      detail: "Active workspaces",
    },
    {
      label: "Campaigns",
      value: activeCampaigns.length,
      icon: Target,
      href: "/campaigns",
      detail: "Planning or active",
    },
    {
      label: "Open Work",
      value: openWork.length,
      icon: ListChecks,
      href: "/work",
      detail: `${completedWork.length} completed`,
    },
    {
      label: "Pending Approvals",
      value: data.pendingApprovals,
      icon: CheckCircle2,
      href: "/content/approvals",
      detail: "Client/internal review",
    },
    {
      label: "Scheduled Posts",
      value: data.scheduledPosts,
      icon: CalendarClock,
      href: "/publishing",
      detail: "Publishing queue",
    },
    {
      label: "Attributed Revenue",
      value: formatMoney(revenueTotal || leadValue),
      icon: DollarSign,
      href: "/analytics",
      detail: revenueTotal ? "Closed revenue" : "Pipeline value",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Command Center${name ? ` · ${name}` : ""}`}
        description="Campaign → strategy → work → content → approval → publishing → leads → revenue → insights → improvement."
      >
        <ButtonLink href="/campaigns">
          <Target className="mr-1 h-4 w-4" />
          New campaign
        </ButtonLink>
      </PageHeader>

      {!data.opsSchemaReady && <OpsSchemaNotice />}

      <DashboardChecklist steps={checklist} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.detail}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Campaign pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.campaigns.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Campaigns will appear here after migration 0016 is applied and
                the first campaign is created.
              </div>
            ) : (
              data.campaigns.map((campaign) => {
                const stageIndex = [
                  "strategy",
                  "work",
                  "content",
                  "approval",
                  "publishing",
                  "leads",
                  "revenue",
                  "insights",
                  "improvement",
                ].indexOf(campaign.stage);
                const percent = progressPercent(stageIndex + 1, 9);
                return (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="block rounded-lg border p-4 transition-colors hover:border-primary/50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {campaign.goal ?? "No campaign goal entered yet"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{titleCase(campaign.stage)}</Badge>
                        <Badge
                          variant={
                            campaign.health === "blocked"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {titleCase(campaign.health)}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {openWork.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No open work is due. Create campaign tasks from Work or from
                Intelligence items.
              </div>
            ) : (
              openWork.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href="/work"
                  className="block rounded-lg border p-3 transition-colors hover:border-primary/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.assignee_name ?? "Unassigned"} ·{" "}
                        {formatDate(item.due_at)}
                      </p>
                    </div>
                    <Badge variant="outline">{titleCase(item.status)}</Badge>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Improvement loop
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="font-medium text-foreground">Insights</p>
            <p className="mt-1">
              Use Intelligence to save opportunities, add them to campaign
              briefs, and convert them into work.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium text-foreground">Revenue attribution</p>
            <p className="mt-1">
              Leads and revenue events roll up by campaign so the team can see
              what work created pipeline.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium text-foreground">Playbooks</p>
            <p className="mt-1">
              Winning campaign patterns become SOPs for the next client or
              internal launch.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
