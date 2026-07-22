import { generateStructured } from "@/lib/ai/anthropic";
import {
  voiceSchema,
  beliefSchema,
  hookSchema,
  storySchema,
  phraseSchema,
  knowledgeSchema,
  type VoiceProfileData,
  type BeliefProfileData,
  type HookLibraryData,
  type StoryFrameworksData,
  type PhraseLibraryData,
  type KnowledgeGraphData,
  type ExtractionSchema,
} from "@/lib/schemas/profiles";

/** A single uploaded asset's analyzable text. */
export interface AssetText {
  title: string | null;
  kind: string;
  text: string;
}

const MAX_CORPUS_CHARS = 120_000;

/** Combine assets into one labelled corpus, capped for cost/latency. */
export function buildCorpus(assets: AssetText[]): string {
  const parts: string[] = [];
  let total = 0;
  for (const a of assets) {
    const header = `\n\n===== ${a.kind.toUpperCase()}: ${a.title ?? "Untitled"} =====\n`;
    const piece = header + a.text;
    if (total + piece.length > MAX_CORPUS_CHARS) {
      parts.push(piece.slice(0, MAX_CORPUS_CHARS - total));
      break;
    }
    parts.push(piece);
    total += piece.length;
  }
  return parts.join("").trim();
}

const SYSTEM_PREAMBLE =
  "You are a forensic writing analyst for an agency intelligence platform. " +
  "You study a creator's content and extract a precise, evidence-based model of " +
  "how they write, think, and persuade. Base every field strictly on the provided " +
  "content. Do not invent facts. When a category is absent, return empty arrays or " +
  'empty strings rather than guessing. Numeric scores are 0-100.';

const ENGINE_PROMPTS: Record<string, string> = {
  voice_dna:
    "Extract the creator's Writing DNA: tone mix, syntax tendencies, formatting habits, " +
    "emotional profile, recurring quirks/phrases, and a compact fingerprint.",
  belief_model:
    "Extract the creator's worldview: core beliefs, contrarian beliefs, industry opinions " +
    "(with stance), personal philosophies, and decision frameworks. Cite supporting phrasing.",
  hook_dna:
    "Identify the creator's hook patterns (opening lines/attention grabbers). For each, give " +
    "the pattern type, a representative example, and a relative usage frequency.",
  storytelling_dna:
    "Identify recurring storytelling structures and the emotional arcs the creator uses, " +
    "each with a relative usage frequency.",
  phrase_memory:
    "Build the creator's phrase memory: favorite words, phrases, openers, closers, transitions, " +
    "metaphors, CTAs, and analogies actually used in the content.",
  knowledge_graph:
    "Extract the business knowledge present: company mission/vision/values/positioning, products, " +
    "customer personas, competitors, objections, and testimonials.",
};

async function run<T>(schema: ExtractionSchema<T>, corpus: string): Promise<T> {
  return generateStructured<T>({
    system: SYSTEM_PREAMBLE,
    prompt: `${ENGINE_PROMPTS[schema.schemaName]}\n\n--- CONTENT START ---\n${corpus}\n--- CONTENT END ---`,
    jsonSchema: schema.jsonSchema,
    validator: schema.validator,
  });
}

export interface VoiceAnalysisResult {
  voice: VoiceProfileData;
  belief: BeliefProfileData;
  hooks: HookLibraryData;
  story: StoryFrameworksData;
  phrase: PhraseLibraryData;
  knowledge: KnowledgeGraphData;
}

/** Run all six intelligence engines over the corpus in parallel. */
export async function runVoiceAnalysis(
  corpus: string,
): Promise<VoiceAnalysisResult> {
  const [voice, belief, hooks, story, phrase, knowledge] = await Promise.all([
    run(voiceSchema, corpus),
    run(beliefSchema, corpus),
    run(hookSchema, corpus),
    run(storySchema, corpus),
    run(phraseSchema, corpus),
    run(knowledgeSchema, corpus),
  ]);
  return { voice, belief, hooks, story, phrase, knowledge };
}
