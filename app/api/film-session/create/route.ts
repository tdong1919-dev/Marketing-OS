import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { generateFilmSession, type FormatRequestItem } from "@/lib/ai/film-session";
import { getFormat } from "@/lib/formats/registry";
import type { DnaInput } from "@/lib/ai/generate";
import type { BrandBrain } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Body {
  agent_id?: string;
  title?: string;
  source_material?: string;
  items?: FormatRequestItem[];
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const agentId = String(body.agent_id ?? "");
  const title = String(body.title ?? "").trim() || "Untitled Film Session";

  // Validate the format mix.
  const items = (body.items ?? [])
    .filter((i) => getFormat(i.formatId) && Number(i.count) > 0)
    .map((i) => ({
      formatId: i.formatId,
      count: Math.max(1, Math.min(Number(i.count), 50)),
      topics: Array.isArray(i.topics)
        ? i.topics.map((t) => String(t)).filter(Boolean)
        : undefined,
    }));
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Choose at least one format with a count." },
      { status: 400 },
    );
  }

  const { data: agent } = await supabase
    .from("marketing_os_writing_agents")
    .select("id, name, marketing_os_clients(name)")
    .eq("id", agentId)
    .maybeSingle();
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const client = agent.marketing_os_clients as unknown as { name: string } | null;

  try {
    // DNA profiles.
    const [v, b, h, s, p, k, brainRes, scriptsRes] = await Promise.all([
      supabase.from("marketing_os_voice_profiles").select("*").eq("agent_id", agentId).maybeSingle(),
      supabase.from("marketing_os_belief_profiles").select("*").eq("agent_id", agentId).maybeSingle(),
      supabase.from("marketing_os_hook_libraries").select("*").eq("agent_id", agentId).maybeSingle(),
      supabase.from("marketing_os_story_frameworks").select("*").eq("agent_id", agentId).maybeSingle(),
      supabase.from("marketing_os_phrase_libraries").select("*").eq("agent_id", agentId).maybeSingle(),
      supabase.from("marketing_os_knowledge_graphs").select("*").eq("agent_id", agentId).maybeSingle(),
      supabase.from("marketing_os_brand_brains").select("*").eq("agent_id", agentId).maybeSingle(),
      supabase
        .from("marketing_os_uploaded_scripts")
        .select("content")
        .eq("agent_id", agentId)
        .limit(8),
    ]);

    const dna: DnaInput = {
      voice: v.data as unknown as DnaInput["voice"],
      belief: b.data as unknown as DnaInput["belief"],
      hooks: h.data as unknown as DnaInput["hooks"],
      story: s.data as unknown as DnaInput["story"],
      phrase: p.data as unknown as DnaInput["phrase"],
      knowledge: k.data as unknown as DnaInput["knowledge"],
    };
    const exemplars = (scriptsRes.data ?? []).map((r) => r.content as string);

    const scripts = await generateFilmSession({
      dna,
      brand: (brainRes.data as BrandBrain) ?? null,
      exemplars,
      sourceMaterial: body.source_material ?? "",
      items,
    });

    if (scripts.length === 0) {
      return NextResponse.json(
        { error: "Generation produced no scripts. Try again or adjust the mix." },
        { status: 502 },
      );
    }

    const { data: session, error } = await supabase
      .from("marketing_os_film_sessions")
      .insert({
        owner_id: user.id,
        agent_id: agentId,
        title,
        client_name: client?.name ?? null,
        source_material: body.source_material ?? null,
        format_mix: items as unknown as never,
        scripts: scripts as unknown as never,
        script_count: scripts.length,
        status: "ready",
      })
      .select("id")
      .single();

    if (error || !session) {
      throw new Error(error?.message ?? "Could not save session");
    }

    return NextResponse.json({ id: session.id, count: scripts.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
