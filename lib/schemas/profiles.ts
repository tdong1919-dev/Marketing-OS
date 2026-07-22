import { z } from "zod";

import { obj, str, num, bool, strArr, arr } from "@/lib/schemas/jsonschema";

/**
 * Extraction schemas for the Voice DNA, Belief, Hook, Story, Phrase, and
 * Knowledge engines. Each export pairs a JSON Schema (for Claude structured
 * output) with a zod validator (for post-parse type-safety). The two are kept
 * in lock-step by hand.
 */

export interface ExtractionSchema<T> {
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  validator: z.ZodType<T>;
}

// ── Voice DNA ───────────────────────────────────────────────────
const toneSchema = z.object({
  professional: z.number(),
  casual: z.number(),
  aggressive: z.number(),
  playful: z.number(),
  authoritative: z.number(),
  educational: z.number(),
  luxury: z.number(),
  technical: z.number(),
});

const emotionalSchema = z.object({
  confidence: z.number(),
  curiosity: z.number(),
  fear: z.number(),
  urgency: z.number(),
  excitement: z.number(),
  authority: z.number(),
  empathy: z.number(),
  humor: z.number(),
});

export const voiceProfile = z.object({
  tone: toneSchema,
  syntax: z.object({
    avg_sentence_length: z.string(),
    fragment_usage: z.string(),
    question_frequency: z.string(),
    exclamation_frequency: z.string(),
    punctuation_notes: z.string(),
  }),
  formatting: z.object({
    paragraph_length: z.string(),
    one_line_paragraphs: z.boolean(),
    uses_lists: z.boolean(),
    capitalization_style: z.string(),
  }),
  emotional_profile: emotionalSchema,
  quirks: z.object({
    repeated_phrases: z.array(z.string()),
    signature_language: z.array(z.string()),
    common_metaphors: z.array(z.string()),
    writing_quirks: z.array(z.string()),
  }),
  fingerprint: z.object({
    vocabulary: z.string(),
    cadence: z.string(),
    hook_style: z.string(),
    cta_style: z.string(),
    storytelling_style: z.string(),
  }),
  summary: z.string(),
});
export type VoiceProfileData = z.infer<typeof voiceProfile>;

export const voiceSchema: ExtractionSchema<VoiceProfileData> = {
  schemaName: "voice_dna",
  validator: voiceProfile,
  jsonSchema: obj({
    tone: obj({
      professional: num("0-100"),
      casual: num("0-100"),
      aggressive: num("0-100"),
      playful: num("0-100"),
      authoritative: num("0-100"),
      educational: num("0-100"),
      luxury: num("0-100"),
      technical: num("0-100"),
    }),
    syntax: obj({
      avg_sentence_length: str("e.g. 'short, punchy' or '~18 words'"),
      fragment_usage: str("low | medium | high, with a note"),
      question_frequency: str("low | medium | high"),
      exclamation_frequency: str("low | medium | high"),
      punctuation_notes: str("dashes, ellipses, parentheses tendencies"),
    }),
    formatting: obj({
      paragraph_length: str("e.g. '1-2 sentences'"),
      one_line_paragraphs: bool(),
      uses_lists: bool(),
      capitalization_style: str("e.g. 'sentence case', 'all lowercase'"),
    }),
    emotional_profile: obj({
      confidence: num("0-100"),
      curiosity: num("0-100"),
      fear: num("0-100"),
      urgency: num("0-100"),
      excitement: num("0-100"),
      authority: num("0-100"),
      empathy: num("0-100"),
      humor: num("0-100"),
    }),
    quirks: obj({
      repeated_phrases: strArr(),
      signature_language: strArr(),
      common_metaphors: strArr(),
      writing_quirks: strArr(),
    }),
    fingerprint: obj({
      vocabulary: str("characteristic word choices"),
      cadence: str("rhythm and pacing"),
      hook_style: str("how they open"),
      cta_style: str("how they call to action"),
      storytelling_style: str("how they structure narrative"),
    }),
    summary: str("2-4 sentence summary of the writing identity"),
  }),
};

// ── Belief & Thought Model ──────────────────────────────────────
const beliefItem = z.object({ belief: z.string(), evidence: z.string() });
const opinionItem = z.object({
  opinion: z.string(),
  stance: z.enum(["agrees", "disagrees", "criticizes"]),
});

export const beliefProfile = z.object({
  core_beliefs: z.array(beliefItem),
  contrarian_beliefs: z.array(beliefItem),
  industry_opinions: z.array(opinionItem),
  philosophies: z.array(z.string()),
  decision_frameworks: z.array(z.string()),
  summary: z.string(),
});
export type BeliefProfileData = z.infer<typeof beliefProfile>;

export const beliefSchema: ExtractionSchema<BeliefProfileData> = {
  schemaName: "belief_model",
  validator: beliefProfile,
  jsonSchema: obj({
    core_beliefs: arr(
      obj({ belief: str(), evidence: str("phrase/quote that supports it") }),
    ),
    contrarian_beliefs: arr(obj({ belief: str(), evidence: str() })),
    industry_opinions: arr(
      obj({
        opinion: str(),
        stance: {
          type: "string",
          enum: ["agrees", "disagrees", "criticizes"],
        },
      }),
    ),
    philosophies: strArr(),
    decision_frameworks: strArr(),
    summary: str("2-4 sentences on the creator's worldview"),
  }),
};

// ── Hook DNA ────────────────────────────────────────────────────
export const hookLibrary = z.object({
  hooks: z.array(
    z.object({
      type: z.string(),
      example: z.string(),
      frequency: z.number(),
    }),
  ),
});
export type HookLibraryData = z.infer<typeof hookLibrary>;

export const hookSchema: ExtractionSchema<HookLibraryData> = {
  schemaName: "hook_dna",
  validator: hookLibrary,
  jsonSchema: obj({
    hooks: arr(
      obj({
        type: str("hook pattern, e.g. 'Nobody talks about…'"),
        example: str("a representative example from the content"),
        frequency: num("relative usage 0-100"),
      }),
    ),
  }),
};

// ── Storytelling + Emotional Arc ────────────────────────────────
export const storyFrameworks = z.object({
  frameworks: z.array(
    z.object({
      name: z.string(),
      structure: z.string(),
      frequency: z.number(),
    }),
  ),
  emotional_arcs: z.array(
    z.object({ arc: z.string(), frequency: z.number() }),
  ),
});
export type StoryFrameworksData = z.infer<typeof storyFrameworks>;

export const storySchema: ExtractionSchema<StoryFrameworksData> = {
  schemaName: "storytelling_dna",
  validator: storyFrameworks,
  jsonSchema: obj({
    frameworks: arr(
      obj({
        name: str("e.g. 'Problem → Solution', 'Failure → Lesson'"),
        structure: str("how the framework unfolds"),
        frequency: num("relative usage 0-100"),
      }),
    ),
    emotional_arcs: arr(
      obj({
        arc: str("e.g. 'Curiosity → Frustration → Hope → Action'"),
        frequency: num("relative usage 0-100"),
      }),
    ),
  }),
};

// ── Phrase Memory ───────────────────────────────────────────────
export const phraseLibrary = z.object({
  favorite_words: z.array(z.string()),
  favorite_phrases: z.array(z.string()),
  openers: z.array(z.string()),
  closers: z.array(z.string()),
  transitions: z.array(z.string()),
  metaphors: z.array(z.string()),
  ctas: z.array(z.string()),
  analogies: z.array(z.string()),
});
export type PhraseLibraryData = z.infer<typeof phraseLibrary>;

export const phraseSchema: ExtractionSchema<PhraseLibraryData> = {
  schemaName: "phrase_memory",
  validator: phraseLibrary,
  jsonSchema: obj({
    favorite_words: strArr(),
    favorite_phrases: strArr(),
    openers: strArr(),
    closers: strArr(),
    transitions: strArr(),
    metaphors: strArr(),
    ctas: strArr(),
    analogies: strArr(),
  }),
};

// ── Knowledge Graph ─────────────────────────────────────────────
export const knowledgeGraph = z.object({
  company: z.object({
    mission: z.string(),
    vision: z.string(),
    values: z.array(z.string()),
    positioning: z.string(),
  }),
  products: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      pricing: z.string(),
    }),
  ),
  customers: z.array(
    z.object({
      persona: z.string(),
      pain_points: z.array(z.string()),
      goals: z.array(z.string()),
    }),
  ),
  competitors: z.array(
    z.object({
      name: z.string(),
      positioning: z.string(),
      advantages: z.array(z.string()),
    }),
  ),
  objections: z.array(
    z.object({ objection: z.string(), response: z.string() }),
  ),
  testimonials: z.array(
    z.object({ summary: z.string(), source: z.string() }),
  ),
  summary: z.string(),
});
export type KnowledgeGraphData = z.infer<typeof knowledgeGraph>;

export const knowledgeSchema: ExtractionSchema<KnowledgeGraphData> = {
  schemaName: "knowledge_graph",
  validator: knowledgeGraph,
  jsonSchema: obj({
    company: obj({
      mission: str("infer if not explicit; empty string if unknown"),
      vision: str(),
      values: strArr(),
      positioning: str(),
    }),
    products: arr(obj({ name: str(), description: str(), pricing: str() })),
    customers: arr(
      obj({ persona: str(), pain_points: strArr(), goals: strArr() }),
    ),
    competitors: arr(
      obj({ name: str(), positioning: str(), advantages: strArr() }),
    ),
    objections: arr(obj({ objection: str(), response: str() })),
    testimonials: arr(obj({ summary: str(), source: str() })),
    summary: str("2-4 sentence business overview"),
  }),
};
