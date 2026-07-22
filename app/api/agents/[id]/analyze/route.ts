import { NextResponse } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { buildCorpus, runVoiceAnalysis, type AssetText } from "@/lib/ai/analysis";
import { chunkText, embedTexts, toVectorLiteral } from "@/lib/ai/embeddings";
import type { BrandBrain } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function joinList(values: string[]) {
  return values.filter(Boolean).join(", ");
}

function keepExisting<T>(existing: T | null | undefined, fallback: T) {
  if (Array.isArray(existing)) return existing.length ? existing : fallback;
  if (typeof existing === "string") return existing.trim() ? existing : fallback;
  return existing ?? fallback;
}

function isMissingOffersColumn(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === "PGRST204" ||
        error.message?.includes("schema cache")) &&
      error.message?.includes("'offers'"),
  );
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: agentId } = await params;
  const context = await getAuthContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user, supabase } = context;

  // Ownership + load assets.
  const { data: agent } = await supabase
    .from("marketing_os_writing_agents")
    .select("id, name, industry")
    .eq("id", agentId)
    .maybeSingle();
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const { data: assets } = await supabase
    .from("marketing_os_uploaded_assets")
    .select("id, title, kind, extracted_text")
    .eq("agent_id", agentId)
    .eq("status", "extracted");

  const usable = (assets ?? []).filter(
    (a) => (a.extracted_text ?? "").trim().length > 0,
  );
  if (usable.length === 0) {
    return NextResponse.json(
      { error: "Upload at least one asset with text before analyzing." },
      { status: 400 },
    );
  }

  await supabase
    .from("marketing_os_writing_agents")
    .update({ status: "analyzing" })
    .eq("id", agentId);

  try {
    // 1) Voice Intelligence Analysis (6 engines in parallel).
    const corpus = buildCorpus(
      usable.map(
        (a): AssetText => ({
          title: a.title,
          kind: a.kind,
          text: a.extracted_text ?? "",
        }),
      ),
    );
    const result = await runVoiceAnalysis(corpus);

    // 2) Persist profiles (one row per agent; upsert on agent_id).
    const base = { agent_id: agentId, owner_id: user.id };
    const writes = await Promise.all([
      supabase.from("marketing_os_voice_profiles").upsert(
        {
          ...base,
          tone: result.voice.tone,
          syntax: result.voice.syntax,
          formatting: result.voice.formatting,
          emotional_profile: result.voice.emotional_profile,
          quirks: result.voice.quirks,
          fingerprint: result.voice.fingerprint,
          summary: result.voice.summary,
        },
        { onConflict: "agent_id" },
      ),
      supabase.from("marketing_os_belief_profiles").upsert(
        {
          ...base,
          core_beliefs: result.belief.core_beliefs,
          contrarian_beliefs: result.belief.contrarian_beliefs,
          industry_opinions: result.belief.industry_opinions,
          philosophies: result.belief.philosophies,
          decision_frameworks: result.belief.decision_frameworks,
          summary: result.belief.summary,
        },
        { onConflict: "agent_id" },
      ),
      supabase
        .from("marketing_os_hook_libraries")
        .upsert({ ...base, hooks: result.hooks.hooks }, { onConflict: "agent_id" }),
      supabase.from("marketing_os_story_frameworks").upsert(
        {
          ...base,
          frameworks: result.story.frameworks,
          emotional_arcs: result.story.emotional_arcs,
        },
        { onConflict: "agent_id" },
      ),
      supabase.from("marketing_os_phrase_libraries").upsert(
        { ...base, ...result.phrase },
        { onConflict: "agent_id" },
      ),
      supabase.from("marketing_os_knowledge_graphs").upsert(
        {
          ...base,
          company: result.knowledge.company,
          products: result.knowledge.products,
          customers: result.knowledge.customers,
          competitors: result.knowledge.competitors,
          objections: result.knowledge.objections,
          testimonials: result.knowledge.testimonials,
          summary: result.knowledge.summary,
        },
        { onConflict: "agent_id" },
      ),
    ]);
    const writeError = writes.find((w) => w.error)?.error;
    if (writeError) throw new Error(writeError.message);

    const { data: existingBrain } = await supabase
      .from("marketing_os_brand_brains")
      .select("*")
      .eq("agent_id", agentId)
      .maybeSingle();
    const brain = existingBrain as BrandBrain | null;
    const toneEntries = Object.entries(result.voice.tone)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 4)
      .map(([tone]) => tone.replaceAll("_", " "));
    const products = result.knowledge.products
      .map((item) =>
        [item.name, item.description].filter(Boolean).join(": "),
      )
      .filter(Boolean);
    const offers = result.knowledge.products
      .map((item) =>
        [item.name, item.pricing].filter(Boolean).join(" - "),
      )
      .filter(Boolean);
    const pricing = result.knowledge.products
      .map((item) => item.pricing)
      .filter(Boolean);
    const faqs = result.knowledge.objections.slice(0, 3).map((item) => ({
      q: item.objection,
      a: item.response,
    }));

    const brainPayload = {
      agent_id: agentId,
      owner_id: user.id,
      business_name: keepExisting(brain?.business_name, agent.name),
      industry: keepExisting(brain?.industry, agent.industry ?? ""),
      description: keepExisting(brain?.description, result.knowledge.summary),
      language: keepExisting(brain?.language, "English"),
      tone: keepExisting(brain?.tone, toneEntries),
      tone_notes: keepExisting(brain?.tone_notes, result.voice.summary),
      offers: keepExisting(brain?.offers, offers.join("\n")),
      services_products: keepExisting(
        brain?.services_products,
        products.join("\n"),
      ),
      pricing: keepExisting(brain?.pricing, joinList(pricing)),
      brand_voice_examples: keepExisting(
        brain?.brand_voice_examples,
        [
          result.voice.fingerprint.hook_style,
          result.voice.fingerprint.cta_style,
          result.voice.fingerprint.cadence,
        ]
          .filter(Boolean)
          .join("\n"),
      ),
      allowed_ctas: keepExisting(brain?.allowed_ctas, joinList(result.phrase.ctas)),
      cta_keywords: keepExisting(brain?.cta_keywords, result.phrase.ctas.slice(0, 8)),
      faqs: keepExisting(brain?.faqs, faqs) as never,
      emoji_allowed: brain?.emoji_allowed ?? true,
      formality_level: brain?.formality_level ?? 50,
      web_link: brain?.web_link ?? null,
      booking_link: brain?.booking_link ?? null,
      cta_links: brain?.cta_links ?? [],
      location: brain?.location ?? null,
      hours: brain?.hours ?? null,
      phone: brain?.phone ?? null,
    };

    const { error: brainError } = await supabase
      .from("marketing_os_brand_brains")
      .upsert(brainPayload, { onConflict: "agent_id" });
    if (isMissingOffersColumn(brainError)) {
      const { offers: _offers, ...payloadWithoutOffers } = brainPayload;
      void _offers;
      const { error: fallbackError } = await supabase
        .from("marketing_os_brand_brains")
        .upsert(payloadWithoutOffers, { onConflict: "agent_id" });
      if (fallbackError) throw new Error(fallbackError.message);
    } else if (brainError) {
      throw new Error(brainError.message);
    }

    // 3) Embed script chunks for retrieval (rebuild from scratch).
    await supabase.from("marketing_os_uploaded_scripts").delete().eq("agent_id", agentId);

    const chunkRows: { asset_id: string; chunk_index: number; content: string }[] =
      [];
    for (const a of usable) {
      const chunks = chunkText(a.extracted_text ?? "");
      chunks.forEach((content, i) =>
        chunkRows.push({ asset_id: a.id, chunk_index: i, content }),
      );
    }

    if (chunkRows.length > 0) {
      const vectors = await embedTexts(chunkRows.map((c) => c.content));
      const rows = chunkRows.map((c, i) => ({
        agent_id: agentId,
        owner_id: user.id,
        asset_id: c.asset_id,
        chunk_index: c.chunk_index,
        content: c.content,
        token_count: Math.ceil(c.content.length / 4),
        embedding: toVectorLiteral(vectors[i]),
      }));
      // Insert in batches to keep payloads reasonable.
      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await supabase
          .from("marketing_os_uploaded_scripts")
          .insert(rows.slice(i, i + 100));
        if (error) throw new Error(error.message);
      }
    }

    await supabase
      .from("marketing_os_writing_agents")
      .update({ status: "ready", last_analyzed_at: new Date().toISOString() })
      .eq("id", agentId);

    return NextResponse.json({ ok: true, scripts: chunkRows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    await supabase
      .from("marketing_os_writing_agents")
      .update({ status: "error" })
      .eq("id", agentId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
