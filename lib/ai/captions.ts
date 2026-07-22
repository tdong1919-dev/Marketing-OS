import { z } from "zod";

import { generateStructured } from "@/lib/ai/anthropic";
import { obj, str, arr } from "@/lib/schemas/jsonschema";

/**
 * Platform-optimized caption writer. The agent turns one script into a caption
 * tuned to each platform's norms — same creator voice, different shape.
 */

export const PLATFORM_CAPTION_RULES: Record<string, string> = {
  instagram:
    "Instagram: a scroll-stopping first line, then 2–4 short lines with line breaks that deliver the value, and a clear CTA. End with 3–6 relevant, specific hashtags on their own line. Conversational, no fluff.",
  facebook:
    "Facebook: slightly longer and more story-driven than IG. Give a little context, land the point, end with a question or CTA. Few or no hashtags.",
  youtube:
    "YouTube: start with a strong, search-friendly title-style first line. Then a short description of what the video covers and why it matters, and a CTA (subscribe / link). Add a few keyword hashtags at the end.",
  tiktok:
    "TikTok: very short, punchy, native and curiosity-driven. One idea, casual tone, 1–3 trend-relevant hashtags max.",
  x:
    "X: 280 characters max. One sharp idea in the creator's voice. Punchy, no filler. At most one hashtag.",
  facebook_reel: "Facebook: short, hooky, conversational.",
};

const captionResult = z.object({
  captions: z.array(z.object({ platform: z.string(), caption: z.string() })),
});
export type CaptionResult = z.infer<typeof captionResult>;

const captionJsonSchema = obj({
  captions: arr(
    obj({
      platform: str("the platform key this caption is for"),
      caption: str("the platform-optimized caption in the creator's voice"),
    }),
  ),
});

const CAPTION_SYSTEM =
  "You write social captions in a specific creator's voice with the highest fidelity — " +
  "same tone, cadence, phrases, and beliefs as their Writing DNA and Brand Brain. You adapt " +
  "the SHAPE of the caption to each platform's norms, but never the voice. Never invent facts, " +
  "offers, prices, or links beyond the Brand Brain. Return one caption per requested platform.";

/**
 * Generate one caption per platform for a script, each optimized for that
 * platform and written in the creator's voice.
 */
export async function generatePlatformCaptions(opts: {
  title: string;
  scriptText: string;
  platforms: string[];
  dnaBrief: string;
  brandBrief: string;
}): Promise<Record<string, string>> {
  const platforms = [...new Set(opts.platforms)];
  if (platforms.length === 0) return {};

  const rulesBlock = platforms
    .map((p) => `- ${p}: ${PLATFORM_CAPTION_RULES[p] ?? "Native, on-voice caption."}`)
    .join("\n");

  const prompt = [
    "WRITING DNA BRIEF:",
    opts.dnaBrief || "(infer voice from the script)",
    opts.brandBrief ? `\n${opts.brandBrief}` : "",
    "",
    "SCRIPT (the on-camera content this caption supports):",
    `Title: ${opts.title}`,
    opts.scriptText,
    "",
    "Write ONE caption for EACH of these platforms, each optimized for it:",
    rulesBlock,
    "",
    "Every caption must sound like the same creator. Return one entry per platform.",
  ].join("\n");

  const data = await generateStructured<CaptionResult>({
    system: CAPTION_SYSTEM,
    prompt,
    jsonSchema: captionJsonSchema,
    validator: captionResult,
    maxTokens: 4000,
    timeoutMs: 90_000,
  });

  const out: Record<string, string> = {};
  for (const c of data.captions) {
    if (c.platform && c.caption) out[c.platform.toLowerCase()] = c.caption.trim();
  }
  return out;
}
