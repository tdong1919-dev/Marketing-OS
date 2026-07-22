import OpenAI from "openai";

/**
 * OpenAI embeddings for the Script Embedding Search Engine.
 * text-embedding-3-small → 1536 dims, matching `vector(1536)` in the schema.
 */

let _client: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _client = new OpenAI();
  }
  return _client;
}

export const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
export const EMBEDDING_DIMS = 1536;

const BATCH_SIZE = 96;

/** Embed an array of strings, returning one vector per input (order preserved). */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const client = getOpenAI();
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    // API returns items with an `index`; sort to be safe before pushing.
    const sorted = [...res.data].sort((a, b) => a.index - b.index);
    for (const item of sorted) out.push(item.embedding as number[]);
  }

  return out;
}

/** Embed a single query string. */
export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}

/** pgvector accepts a bracketed string literal, e.g. "[0.1,0.2,...]". */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Split text into overlapping chunks suitable for embedding + retrieval.
 * Splits on paragraph boundaries where possible, targeting ~`size` chars.
 */
export function chunkText(
  text: string,
  size = 1500,
  overlap = 200,
): string[] {
  const clean = text.trim();
  if (clean.length <= size) return clean ? [clean] : [];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    // Prefer to break on a paragraph or sentence boundary near the end.
    if (end < clean.length) {
      const slice = clean.slice(start, end);
      const para = slice.lastIndexOf("\n\n");
      const sentence = slice.lastIndexOf(". ");
      const breakAt = Math.max(para, sentence);
      if (breakAt > size * 0.5) {
        end = start + breakAt + 1;
      }
    }
    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= clean.length) break;
    start = end - overlap;
  }
  return chunks;
}
