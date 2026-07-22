import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getAuthContext } from "@/lib/auth";
import { buildDnaBrief, type DnaInput } from "@/lib/ai/generate";
import { buildBrandBrainBrief } from "@/lib/brand-brain";
import { generatePlatformCaptions } from "@/lib/ai/captions";
import { scriptToPlainText } from "@/lib/film-session/assemble";
import type { GeneratedFilmScript } from "@/lib/ai/film-session";
import type { BrandBrain } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED = ["instagram", "facebook", "youtube", "tiktok", "x"] as const;
const CONTENT_TYPE: Record<string, string> = {
  instagram: "video",
  facebook: "video",
  youtube: "video",
  tiktok: "video",
  x: "photo",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const context = await getAuthContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user, supabase } = context;

  const body = (await request.json().catch(() => ({}))) as {
    scriptIndex?: number;
    platforms?: string[];
  };
  const scriptIndex = Number(body.scriptIndex ?? -1);
  const platforms = [...new Set((body.platforms ?? []).map((p) => String(p).toLowerCase()))].filter(
    (p): p is (typeof ALLOWED)[number] => (ALLOWED as readonly string[]).includes(p),
  );
  if (platforms.length === 0) {
    return NextResponse.json({ error: "Pick at least one platform." }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("marketing_os_film_sessions")
    .select("id, agent_id, scripts")
    .eq("id", id)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "Film session not found" }, { status: 404 });
  }

  const scripts = (session.scripts as unknown as GeneratedFilmScript[]) ?? [];
  const script = scripts[scriptIndex];
  if (!script) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }
  const agentId = session.agent_id;
  const title = script.title;
  const scriptText = scriptToPlainText(script);

  // Load DNA + Brand Brain for on-voice captions.
  const [v, b, h, s, p, k, brainRes] = await Promise.all([
    supabase.from("marketing_os_voice_profiles").select("*").eq("agent_id", agentId).maybeSingle(),
    supabase.from("marketing_os_belief_profiles").select("*").eq("agent_id", agentId).maybeSingle(),
    supabase.from("marketing_os_hook_libraries").select("*").eq("agent_id", agentId).maybeSingle(),
    supabase.from("marketing_os_story_frameworks").select("*").eq("agent_id", agentId).maybeSingle(),
    supabase.from("marketing_os_phrase_libraries").select("*").eq("agent_id", agentId).maybeSingle(),
    supabase.from("marketing_os_knowledge_graphs").select("*").eq("agent_id", agentId).maybeSingle(),
    supabase.from("marketing_os_brand_brains").select("*").eq("agent_id", agentId).maybeSingle(),
  ]);
  const dna: DnaInput = {
    voice: v.data as unknown as DnaInput["voice"],
    belief: b.data as unknown as DnaInput["belief"],
    hooks: h.data as unknown as DnaInput["hooks"],
    story: s.data as unknown as DnaInput["story"],
    phrase: p.data as unknown as DnaInput["phrase"],
    knowledge: k.data as unknown as DnaInput["knowledge"],
  };

  let captions: Record<string, string> = {};
  try {
    captions = await generatePlatformCaptions({
      title,
      scriptText,
      platforms,
      dnaBrief: buildDnaBrief(dna),
      brandBrief: buildBrandBrainBrief((brainRes.data as BrandBrain) ?? null),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Caption generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Which platforms already have this title queued.
  const { data: existing } = await supabase
    .from("marketing_os_scheduled_posts")
    .select("id, platform")
    .eq("agent_id", agentId)
    .eq("title", title)
    .in("platform", platforms)
    .in("status", ["draft", "scheduled"]);
  const existingByPlatform = new Map((existing ?? []).map((e) => [e.platform, e.id]));

  const { data: accounts } = await supabase
    .from("marketing_os_social_accounts")
    .select("id, platform, status")
    .eq("agent_id", agentId)
    .in("platform", platforms)
    .eq("status", "active");
  const accountByPlatform = new Map((accounts ?? []).map((a) => [a.platform, a.id]));

  const created: string[] = [];
  const updated: string[] = [];

  for (const platform of platforms) {
    const caption = captions[platform] ?? null;
    const existingId = existingByPlatform.get(platform);
    if (existingId) {
      await supabase
        .from("marketing_os_scheduled_posts")
        .update({ caption, script: scriptText })
        .eq("id", existingId);
      updated.push(platform);
      continue;
    }
    const { error } = await supabase.from("marketing_os_scheduled_posts").insert({
      agent_id: agentId,
      owner_id: user.id,
      title,
      platform,
      content_type: CONTENT_TYPE[platform] ?? "video",
      caption,
      script: scriptText,
      status: "draft",
      social_account_id: accountByPlatform.get(platform) ?? null,
    });
    if (!error) created.push(platform);
  }

  revalidatePath("/scheduler");
  revalidatePath("/calendar");

  return NextResponse.json({
    ok: true,
    title,
    created,
    updated,
  });
}
