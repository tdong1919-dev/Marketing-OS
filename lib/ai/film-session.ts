import { generateStructured } from "@/lib/ai/anthropic";
import {
  scriptBatch,
  scriptBatchJsonSchema,
  type ScriptBatchData,
} from "@/lib/schemas/film-session";
import { getFormat, type ScriptDraft } from "@/lib/formats/registry";
import { buildDnaBrief, type DnaInput } from "@/lib/ai/generate";
import { buildBrandBrainBrief } from "@/lib/brand-brain";
import type { BrandBrain } from "@/lib/supabase/types";

/**
 * Master prompt for the Jidoka Marketing Team OS script writer.
 *
 * Voice fidelity first (co-written), plus filming-template discipline and strict
 * adherence to the requested script format's structure.
 */
export const FILM_SESSION_SYSTEM = `You are the ghostwriter for ONE specific creator. Your job is to write filming scripts that are indistinguishable from what that creator would write themselves — same voice, same instincts, same fingerprints. If the creator read your script, their reaction should be "I wrote that."

VOICE FIDELITY IS THE HIGHEST PRIORITY — above cleverness, polish, or what a "good marketer" would do. Reproduce the creator; do not improve on them.

You are given: a WRITING DNA BRIEF (obey it), a BRAND BRAIN of authoritative business facts (ground truth — never contradict or invent beyond it), EXAMPLES of the creator's real writing (your reference for HOW they write — mirror patterns, never copy verbatim), SOURCE MATERIAL to draw topics from, and a FORMAT with strict structural RULES.

Match precisely: their sentence rhythm and length; how they open and close; punctuation, casing, and formatting habits; vocabulary and signature phrases (at their real frequency, never stuffed); their beliefs and stances, including contrarian ones; and their emotional cadence.

Never: slip into generic creator/AI phrasing they wouldn't use ("in today's world", "let's dive in", "game-changer", "unlock", "elevate") unless it's genuinely theirs; sanitize their edge; invent facts, stats, prices, or links beyond the Brand Brain; or turn the piece into a caricature of their tics.

THESE ARE FILMING SCRIPTS, not blog posts. They are spoken on camera. Keep lines short and sayable. Where the talent is meant to riff or answer, leave a talent PROMPT or FILL-IN exactly as the format's rules specify (e.g. "My honest thoughts are ___", "○ Give your answer", "[Speaker fills in: …]") — never answer those yourself.

FORMAT ADHERENCE IS MANDATORY. Each format has a distinct structure (Do/Don't pairs, Yes-No-Maybe statements, Hook + 3 Points, TL;DR + 5 lines, etc.). Follow the given format's rules exactly using the block model: each block has an optional label (e.g. "1.", "POINT 1: …", "Don't Say →", "HOOK:"), a text line, and optional sub-bullets. Use tldr only when the format calls for it.

Every script must independently pass one test: would the creator actually film this?`;

export interface FormatRequestItem {
  formatId: string;
  count: number;
  topics?: string[];
}

export interface FilmSessionInput {
  dna: DnaInput;
  brand: BrandBrain | null;
  exemplars: string[];
  sourceMaterial?: string;
  items: FormatRequestItem[];
  maxScripts?: number;
}

export interface GeneratedFilmScript extends ScriptDraft {
  formatId: string;
}

const MAX_TOTAL = 50;
const MAX_PER_CALL = 12;
const MAX_EXEMPLARS = 4;
const MAX_EXEMPLAR_CHARS = 1400;
const MAX_SOURCE_CHARS = 12_000;

function compactExemplars(exemplars: string[]): string {
  const items = exemplars
    .map((e) => e.trim())
    .filter(Boolean)
    .slice(0, MAX_EXEMPLARS)
    .map((e, i) => {
      const clipped =
        e.length > MAX_EXEMPLAR_CHARS ? `${e.slice(0, MAX_EXEMPLAR_CHARS)}…` : e;
      return `EXAMPLE ${i + 1}:\n${clipped}`;
    });
  return items.length ? items.join("\n\n") : "(no example scripts available)";
}

async function generateFormatBatch(
  formatId: string,
  count: number,
  topics: string[] | undefined,
  brief: string,
  brandBrief: string,
  exemplarsBlock: string,
  source: string,
): Promise<GeneratedFilmScript[]> {
  const format = getFormat(formatId);
  if (!format || count < 1) return [];

  const topicLine =
    topics && topics.length
      ? `TOPICS (write one script per topic, ${count} total):\n${topics
          .slice(0, count)
          .map((t, i) => `${i + 1}. ${t}`)
          .join("\n")}`
      : `Propose ${count} distinct, on-brand topics from the SOURCE MATERIAL and Brand Brain, then write one script each.`;

  const prompt = [
    `FORMAT: ${format.name} — ${format.description}`,
    `FORMAT RULES (follow exactly):`,
    format.rules,
    "",
    `Write ${count} distinct scripts in THIS format for one filming session.`,
    "",
    "WRITING DNA BRIEF:",
    brief || "(no DNA yet — infer voice from examples)",
    brandBrief ? `\n${brandBrief}` : "",
    "",
    "CLOSEST MATCHING EXAMPLES FROM THE CREATOR (voice reference — never copy verbatim):",
    exemplarsBlock,
    "",
    "SOURCE MATERIAL:",
    source || "(none provided — draw on the Brand Brain and DNA)",
    "",
    topicLine,
    "",
    `Return exactly ${count} scripts in the scripts array. Each must obey the FORMAT RULES structurally and sound exactly like the creator.`,
  ].join("\n");

  const data = await generateStructured<ScriptBatchData>({
    system: FILM_SESSION_SYSTEM,
    prompt,
    jsonSchema: scriptBatchJsonSchema,
    validator: scriptBatch,
    maxTokens: 12_000,
    timeoutMs: 180_000,
  });

  return data.scripts.map((s) => ({
    formatId: format.id,
    title: s.title,
    tldr: s.tldr,
    blocks: s.blocks,
  }));
}

/** Clamp requested counts so the total never exceeds the session cap. */
function allocate(
  items: FormatRequestItem[],
  cap: number,
): FormatRequestItem[] {
  const out: FormatRequestItem[] = [];
  let remaining = cap;
  for (const item of items) {
    if (remaining <= 0) break;
    const count = Math.min(item.count, remaining);
    if (count > 0) out.push({ ...item, count });
    remaining -= count;
  }
  return out;
}

/**
 * Generate a full film session: up to `maxScripts` scripts across the requested
 * format mix. Each format is generated in chunked, parallel Claude calls.
 */
export async function generateFilmSession(
  input: FilmSessionInput,
): Promise<GeneratedFilmScript[]> {
  const cap = Math.min(input.maxScripts ?? MAX_TOTAL, MAX_TOTAL);
  const brief = buildDnaBrief(input.dna);
  const brandBrief = buildBrandBrainBrief(input.brand);
  const exemplarsBlock = compactExemplars(input.exemplars);
  const source = (input.sourceMaterial ?? "").slice(0, MAX_SOURCE_CHARS);

  // Split each format request into chunks of <= MAX_PER_CALL, respecting the cap.
  const allocated = allocate(input.items, cap);
  const calls: { formatId: string; count: number; topics?: string[] }[] = [];
  for (const item of allocated) {
    let done = 0;
    while (done < item.count) {
      const chunk = Math.min(MAX_PER_CALL, item.count - done);
      const topics = item.topics?.slice(done, done + chunk);
      calls.push({ formatId: item.formatId, count: chunk, topics });
      done += chunk;
    }
  }

  const results = await Promise.all(
    calls.map((c) =>
      generateFormatBatch(
        c.formatId,
        c.count,
        c.topics,
        brief,
        brandBrief,
        exemplarsBlock,
        source,
      ).catch(() => [] as GeneratedFilmScript[]),
    ),
  );

  return results.flat().slice(0, cap);
}
