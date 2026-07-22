import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

const BASELINE_REPORT = {
  trending_topics: [
    "Problem-aware education posts",
    "Customer objection breakdowns",
    "Founder or practitioner point-of-view clips",
    "Before-and-after process stories",
    "Offer education with clear proof points",
  ],
  hooks: [
    "Most brands explain this backwards.",
    "If your audience keeps asking this, make it a post.",
    "Here is the part competitors skip.",
    "Three signs your customer is ready for the next step.",
  ],
  audios: [
    "Connect Instagram and YouTube APIs to collect live audio trends. TikTok is paused while API setup is in progress.",
  ],
  content_opportunities: [
    "Short teaching clips with one visual framework",
    "Carousel myth breakdowns",
    "Comment keyword to DM lead magnets",
    "Expert POV responses to trending industry claims",
  ],
  summary:
    "Marketing baseline: prioritize educational posts that turn complex customer problems into simple frameworks, pair carousels with comment-to-DM resources, and watch competitor hooks that challenge generic advice with proof.",
};

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: owners } = await admin
    .from("marketing_os_writing_agents")
    .select("owner_id")
    .order("created_at", { ascending: false });

  const ownerIds = [...new Set((owners ?? []).map((owner) => owner.owner_id))];
  let inserted = 0;

  for (const ownerId of ownerIds) {
    const [{ data: accounts }, { data: previousReport }] = await Promise.all([
      admin
        .from("marketing_os_social_accounts")
        .select("platform, status")
        .eq("owner_id", ownerId)
        .eq("status", "active"),
      admin
        .from("marketing_os_social_intelligence_reports")
        .select(
          "competitor_accounts, industry, trending_topics, hooks, content_opportunities, summary",
        )
        .eq("owner_id", ownerId)
        .order("scanned_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const platforms = [...new Set((accounts ?? []).map((account) => account.platform))];

    // Carry the previous report forward (watchlist, client focus, and the
    // latest scan results) so weekly runs never wipe what the user saved or
    // what the competitor scan generated.
    await admin.from("marketing_os_social_intelligence_reports").insert({
      owner_id: ownerId,
      industry: previousReport?.industry ?? "general marketing",
      platforms,
      competitor_accounts: previousReport?.competitor_accounts ?? [],
      trending_topics:
        previousReport?.trending_topics ?? BASELINE_REPORT.trending_topics,
      hooks: previousReport?.hooks ?? BASELINE_REPORT.hooks,
      audios: BASELINE_REPORT.audios,
      content_opportunities:
        previousReport?.content_opportunities ??
        BASELINE_REPORT.content_opportunities,
      summary: previousReport?.summary ?? BASELINE_REPORT.summary,
      scanned_at: new Date().toISOString(),
    });
    inserted += 1;
  }

  return NextResponse.json({ ok: true, inserted });
}
