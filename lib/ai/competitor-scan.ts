import { z } from "zod";

import { generateStructured } from "@/lib/ai/anthropic";
import { extractFromUrl } from "@/lib/extract";

/**
 * Competitor scan agent: reads competitor websites and produces a
 * client-specific intelligence report (topics, hooks, content formats).
 */

const MAX_SITES = 4;
const MAX_SITE_CHARS = 6000;
const SITE_FETCH_TIMEOUT_MS = 8000;

export type ScanClient = {
  name: string;
  industry: string | null;
  notes: string | null;
} | null;

export type CompetitorScanResult = {
  trending_topics: string[];
  hooks: string[];
  content_opportunities: string[];
  positioning: string[];
  summary: string;
};

const scanValidator = z.object({
  trending_topics: z.array(z.string()).min(1),
  hooks: z.array(z.string()).min(1),
  content_opportunities: z.array(z.string()).min(1),
  positioning: z.array(z.string()).min(1),
  summary: z.string().min(20),
});

const scanJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "trending_topics",
    "hooks",
    "content_opportunities",
    "positioning",
    "summary",
  ],
  properties: {
    // Note: the structured-output API only supports minItems of 0 or 1, so
    // item counts are steered via descriptions and the prompt instead.
    trending_topics: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
      description:
        "Exactly 5-6 topic ideas the client should post about, informed by competitor positioning.",
    },
    hooks: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
      description: "Exactly 4-6 scroll-stopping opening lines the client can adapt.",
    },
    content_opportunities: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
      description:
        "Exactly 4-6 content formats or angles competitors use well or leave open.",
    },
    positioning: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
      description:
        "Exactly 3-5 statements on how the client should position against these competitors: unique angles, differentiators, and messaging stances the competitors leave open.",
    },
    summary: {
      type: "string",
      description: "2-3 sentence brief on what competitors emphasize and where the client can win.",
    },
  },
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timed out")), ms),
    ),
  ]);
}

async function fetchSiteExcerpts(websites: string[]) {
  const urls = websites
    .filter((site) => site.startsWith("http://") || site.startsWith("https://"))
    .slice(0, MAX_SITES);

  const settled = await Promise.allSettled(
    urls.map((url) => withTimeout(extractFromUrl(url), SITE_FETCH_TIMEOUT_MS)),
  );

  return urls.map((url, index) => {
    const result = settled[index];
    return result.status === "fulfilled"
      ? { url, text: result.value.slice(0, MAX_SITE_CHARS) }
      : { url, text: "" };
  });
}

export async function runCompetitorScan({
  client,
  websites,
}: {
  client: ScanClient;
  websites: string[];
}): Promise<CompetitorScanResult> {
  const excerpts = await fetchSiteExcerpts(websites);
  const fetched = excerpts.filter((excerpt) => excerpt.text);

  const clientBlock = client
    ? `CLIENT: ${client.name}${client.industry ? ` — industry: ${client.industry}` : ""}${
        client.notes ? `\nNotes: ${client.notes}` : ""
      }`
    : "CLIENT: a marketing client (no specific client selected).";

  const competitorBlock = fetched.length
    ? fetched
        .map((excerpt) => `--- COMPETITOR SITE: ${excerpt.url} ---\n${excerpt.text}`)
        .join("\n\n")
    : `No competitor site content could be fetched. Watchlist entries:\n${websites.join("\n")}`;

  return generateStructured({
    system:
      "You are a social media competitor analyst for a marketing agency. " +
      "You study competitor websites and produce concrete, education-first content " +
      "ideas the agency's client can post across Instagram, Facebook, YouTube, X, " +
      "TikTok, and email. Health-related ideas must stay compliance-safe: no " +
      "medical claims, no promises of outcomes. Every idea must be specific enough " +
      "to write a post from, and tailored to the client — not generic marketing advice.",
    prompt:
      `${clientBlock}\n\n` +
      `COMPETITOR RESEARCH MATERIAL:\n${competitorBlock}\n\n` +
      "Produce the intelligence report: 5-6 trending topics the client should " +
      "cover, 4-6 hooks to adapt, 4-6 content format opportunities, 3-5 " +
      "positioning statements that differentiate the client from these " +
      "competitors, and a short summary of what competitors emphasize and " +
      "where this client can stand out.",
    jsonSchema: scanJsonSchema,
    validator: scanValidator,
    maxTokens: 2500,
    timeoutMs: 45_000,
  });
}
