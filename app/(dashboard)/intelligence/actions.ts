"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { runCompetitorScan, type ScanClient } from "@/lib/ai/competitor-scan";
import { asRow, opsTable, type CampaignRow } from "@/lib/marketing-os/operations";

const BASELINE_TOPICS = [
  "Problem-aware education posts",
  "Customer objection breakdowns",
  "Founder or practitioner point-of-view clips",
  "Before-and-after process stories",
  "Offer education with clear proof points",
];

const BASELINE_HOOKS = [
  "Most brands explain this backwards.",
  "If your audience keeps asking this, make it a post.",
  "Here is the part competitors skip.",
  "Three signs your customer is ready for the next step.",
];

const BASELINE_TRENDS = [
  "Short teaching clips with one visual framework",
  "Carousel myth breakdowns",
  "Comment keyword to DM lead magnets",
  "Expert POV responses to trending industry claims",
];

const BASELINE_POSITIONING = [
  "Own the specific problem competitors mention but rarely explain step by step.",
  "Translate expert work into plain English while competitors stay generic.",
  "Lead with real POV content where competitors rely on stock-style posts.",
  "Use education-first proof to build trust where competitors overpromise.",
];

export async function saveCompetitorsAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const competitorWebsites = String(formData.get("competitor_websites") ?? "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) =>
      item.startsWith("http://") || item.startsWith("https://") || item.startsWith("@")
        ? item
        : `https://${item}`,
    );

  const clientId = String(formData.get("client_id") ?? "").trim();
  let client: ScanClient = null;
  if (clientId) {
    const { data } = await supabase
      .from("marketing_os_clients")
      .select("name, industry, notes")
      .eq("id", clientId)
      .maybeSingle();
    client = data ?? null;
  }

  const { data: accounts } = await supabase
    .from("marketing_os_social_accounts")
    .select("platform, status")
    .eq("status", "active");
  const platforms = [...new Set((accounts ?? []).map((account) => account.platform))];

  let topics: string[] = BASELINE_TOPICS;
  let hooks: string[] = BASELINE_HOOKS;
  let opportunities: string[] = BASELINE_TRENDS;
  let positioning: string[] = BASELINE_POSITIONING;
  let summary: string;

  if (competitorWebsites.length) {
    try {
      const scan = await runCompetitorScan({ client, websites: competitorWebsites });
      topics = scan.trending_topics;
      hooks = scan.hooks;
      opportunities = scan.content_opportunities;
      positioning = scan.positioning;
      summary = scan.summary;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "scan failed";
      summary =
        `Competitor website watchlist saved, but the live scan could not run (${reason}). ` +
        "Baseline guidance is shown below — save again to retry.";
    }
  } else {
    summary =
      "Watchlist cleared. Add competitor websites and save to generate a fresh scan.";
  }

  await supabase.from("marketing_os_social_intelligence_reports").insert({
    owner_id: user.id,
    // The industry column doubles as the client-focus label for the report.
    industry: client?.name ?? "general marketing",
    platforms,
    competitor_accounts: competitorWebsites,
    trending_topics: topics,
    hooks,
    audios: [
      "Connect Instagram and YouTube to collect live audio trends. TikTok is paused while API setup is in progress.",
    ],
    // Stored as an object so positioning rides along without a schema change;
    // the Intelligence page reads both this shape and the legacy plain array.
    content_opportunities: { items: opportunities, positioning },
    summary,
    scanned_at: new Date().toISOString(),
  });

  revalidatePath("/intelligence");
}

function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function insightPayload(formData: FormData) {
  return {
    title: textValue(formData, "insight_title") ?? "Intelligence item",
    body: textValue(formData, "insight_body") ?? "",
    type: textValue(formData, "insight_type") ?? "opportunity",
    source: textValue(formData, "insight_source") ?? "intelligence",
  };
}

async function latestOrCreatedCampaign(
  supabase: unknown,
  ownerId: string,
  insight: ReturnType<typeof insightPayload>,
  campaignId?: string | null,
) {
  if (campaignId) return campaignId;

  const latest = await opsTable(supabase, "marketing_os_campaigns")
    .select(
      "id, owner_id, client_id, name, campaign_type, status, stage, health, priority, goal, primary_kpi, target_audience, owner_name, budget, actual_spend, expected_revenue, attributed_revenue, lead_goal, leads_count, start_date, end_date, notes, created_at, updated_at",
    )
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latestCampaign = asRow<CampaignRow>(latest.data);
  if (latestCampaign?.id) return latestCampaign.id;

  const created = await opsTable(supabase, "marketing_os_campaigns")
    .insert({
      owner_id: ownerId,
      organization_id: ownerId,
      name: `Intelligence campaign: ${insight.title}`,
      campaign_type: "intelligence-led",
      status: "planning",
      stage: "strategy",
      goal: insight.body,
      notes: `Created from ${insight.source}.`,
    })
    .select("id")
    .single();
  return (created.data as { id?: string } | null)?.id ?? null;
}

export async function createCampaignFromInsightAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const insight = insightPayload(formData);

  await opsTable(supabase, "marketing_os_campaigns").insert({
    owner_id: user.id,
    organization_id: user.id,
    client_id: textValue(formData, "client_id"),
    name: insight.title,
    campaign_type: "intelligence-led",
    status: "planning",
    stage: "strategy",
    goal: insight.body,
    notes: `Created from ${insight.source}.`,
  });

  await recordInsight(supabase, user.id, formData, "converted");
  revalidateOps();
}

export async function createContentIdeaFromInsightAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const insight = insightPayload(formData);

  await opsTable(supabase, "marketing_os_content_ideas").insert({
    owner_id: user.id,
    organization_id: user.id,
    campaign_id: textValue(formData, "campaign_id"),
    client_id: textValue(formData, "client_id"),
    title: insight.title,
    description: insight.body,
    source: insight.source,
    format: textValue(formData, "format"),
    platform: textValue(formData, "platform"),
    funnel_stage: "awareness",
    status: "idea",
    insight_payload: insight,
  });

  await recordInsight(supabase, user.id, formData, "converted");
  revalidateOps();
}

export async function addInsightToBriefAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const insight = insightPayload(formData);
  const campaignId = await latestOrCreatedCampaign(
    supabase,
    user.id,
    insight,
    textValue(formData, "campaign_id"),
  );
  if (!campaignId) return;

  const existing = await opsTable(supabase, "marketing_os_campaign_briefs")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("owner_id", user.id)
    .maybeSingle();
  const existingRow = asRow<{ source_insights?: unknown; strategy_summary?: string | null }>(
    existing.data,
  );
  const sourceInsights = Array.isArray(existingRow?.source_insights)
    ? [...existingRow.source_insights, insight]
    : [insight];

  await opsTable(supabase, "marketing_os_campaign_briefs")
    .upsert(
      {
        owner_id: user.id,
        organization_id: user.id,
        campaign_id: campaignId,
        strategy_summary: existingRow?.strategy_summary ?? insight.body,
        source_insights: sourceInsights,
      },
      { onConflict: "campaign_id" },
    )
    .select("id")
    .maybeSingle();

  await recordInsight(supabase, user.id, formData, "converted", campaignId);
  revalidateOps(campaignId);
}

export async function createTaskFromInsightAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const insight = insightPayload(formData);

  await opsTable(supabase, "marketing_os_work_items").insert({
    owner_id: user.id,
    organization_id: user.id,
    campaign_id: textValue(formData, "campaign_id"),
    client_id: textValue(formData, "client_id"),
    title: insight.title,
    description: insight.body,
    work_type: "strategy",
    status: "not_started",
    priority: "medium",
    source_type: "intelligence",
    created_by: user.id,
  });

  await recordInsight(supabase, user.id, formData, "converted");
  revalidateOps();
}

export async function assignInsightToTeamAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  const insight = insightPayload(formData);

  await opsTable(supabase, "marketing_os_work_items").insert({
    owner_id: user.id,
    organization_id: user.id,
    campaign_id: textValue(formData, "campaign_id"),
    client_id: textValue(formData, "client_id"),
    title: insight.title,
    description: insight.body,
    work_type: "strategy",
    status: "in_progress",
    priority: "high",
    assignee_name: textValue(formData, "assignee_name") ?? "Marketing team",
    source_type: "intelligence",
    created_by: user.id,
  });

  await recordInsight(supabase, user.id, formData, "converted");
  revalidateOps();
}

export async function saveInsightForLaterAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  await recordInsight(supabase, user.id, formData, "saved");
  revalidatePath("/intelligence");
}

export async function dismissInsightAction(formData: FormData) {
  const { user, supabase } = await requireUser();
  await recordInsight(supabase, user.id, formData, "dismissed");
  revalidatePath("/intelligence");
}

async function recordInsight(
  supabase: unknown,
  ownerId: string,
  formData: FormData,
  status: "saved" | "dismissed" | "converted",
  campaignId = textValue(formData, "campaign_id"),
) {
  const insight = insightPayload(formData);
  await opsTable(supabase, "marketing_os_saved_insights").insert({
    owner_id: ownerId,
    organization_id: ownerId,
    report_id: textValue(formData, "report_id"),
    campaign_id: campaignId,
    client_id: textValue(formData, "client_id"),
    title: insight.title,
    insight_type: insight.type,
    body: insight.body,
    source: insight.source,
    status,
    action_log: [
      {
        status,
        at: new Date().toISOString(),
      },
    ],
  });
}

function revalidateOps(campaignId?: string | null) {
  revalidatePath("/intelligence");
  revalidatePath("/dashboard");
  revalidatePath("/campaigns");
  revalidatePath("/work");
  revalidatePath("/content/ideas");
  if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
}
