import { z } from "zod";

import { obj, str, strArr, arr } from "@/lib/schemas/jsonschema";

/**
 * Structured output schema for a batch of scripts generated in one format.
 * Mirrors the ScriptDraft/ScriptBlock model in lib/formats/registry.ts.
 * All fields are required for structured output; emptiness is allowed
 * (label "" = no label, empty bullets/tldr = none).
 */

export const scriptBatch = z.object({
  scripts: z.array(
    z.object({
      title: z.string(),
      tldr: z.array(z.string()),
      blocks: z.array(
        z.object({
          label: z.string(),
          text: z.string(),
          bullets: z.array(z.string()),
        }),
      ),
    }),
  ),
});
export type ScriptBatchData = z.infer<typeof scriptBatch>;

export const scriptBatchJsonSchema = obj({
  scripts: arr(
    obj({
      title: str("the 🎬 title of this script"),
      tldr: strArr("optional TL;DR bullets; empty array if the format has none"),
      blocks: arr(
        obj({
          label: str("prefix label like '1.', 'POINT 1: …', 'Don't Say →', 'HOOK:'; empty string if none"),
          text: str("the main line of this beat"),
          bullets: strArr("sub-bullets: riff prompts, examples, fill-ins; empty array if none"),
        }),
      ),
    }),
  ),
});
