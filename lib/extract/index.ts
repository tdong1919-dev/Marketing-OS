import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Text extraction for uploaded assets. Runs in the Node.js runtime only
 * (pdf-parse / mammoth need Node APIs). Returns plain text we can analyze
 * and embed.
 */

const nodeRequire = createRequire(import.meta.url);

export type AssetKind =
  | "pdf"
  | "docx"
  | "txt"
  | "csv"
  | "url"
  | "paste"
  | "transcript"
  | "caption"
  | "script"
  | "email"
  | "vsl";

const MAX_TEXT_CHARS = 500_000; // guardrail against pathological inputs

type CanvasModule = {
  DOMMatrix?: typeof DOMMatrix;
  ImageData?: typeof ImageData;
  Path2D?: typeof Path2D;
};

type PdfParseClass = typeof import("pdf-parse").PDFParse;
type PdfJsWorkerGlobal = typeof globalThis & {
  pdfjsWorker?: { WorkerMessageHandler?: unknown };
};

type MatrixValues = {
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  e?: number;
  f?: number;
};

class TextExtractionDOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: MatrixValues | number[]) {
    if (Array.isArray(init)) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = [
        init[0] ?? 1,
        init[1] ?? 0,
        init[2] ?? 0,
        init[3] ?? 1,
        init[4] ?? 0,
        init[5] ?? 0,
      ];
      return;
    }

    if (init) {
      this.a = init.a ?? this.a;
      this.b = init.b ?? this.b;
      this.c = init.c ?? this.c;
      this.d = init.d ?? this.d;
      this.e = init.e ?? this.e;
      this.f = init.f ?? this.f;
    }
  }

  multiplySelf(other: MatrixValues): this {
    const next = {
      a: this.a * (other.a ?? 1) + this.c * (other.b ?? 0),
      b: this.b * (other.a ?? 1) + this.d * (other.b ?? 0),
      c: this.a * (other.c ?? 0) + this.c * (other.d ?? 1),
      d: this.b * (other.c ?? 0) + this.d * (other.d ?? 1),
      e: this.a * (other.e ?? 0) + this.c * (other.f ?? 0) + this.e,
      f: this.b * (other.e ?? 0) + this.d * (other.f ?? 0) + this.f,
    };
    Object.assign(this, next);
    return this;
  }

  preMultiplySelf(other: MatrixValues): this {
    const matrix = new TextExtractionDOMMatrix(other);
    matrix.multiplySelf(this);
    Object.assign(this, matrix);
    return this;
  }

  translate(tx = 0, ty = 0): this {
    return this.multiplySelf({ e: tx, f: ty });
  }

  scale(scaleX = 1, scaleY = scaleX): this {
    return this.multiplySelf({ a: scaleX, d: scaleY });
  }

  invertSelf(): this {
    const det = this.a * this.d - this.b * this.c;
    if (!det) {
      this.a = this.b = this.c = this.d = this.e = this.f = Number.NaN;
      return this;
    }

    const { a, b, c, d, e, f } = this;
    this.a = d / det;
    this.b = -b / det;
    this.c = -c / det;
    this.d = a / det;
    this.e = (c * f - d * e) / det;
    this.f = (b * e - a * f) / det;
    return this;
  }
}

class TextExtractionPath2D {
  addPath(): void {
    // Text-only PDF extraction never renders paths; this keeps pdf.js import-safe.
  }
}

function clamp(text: string): string {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalized.length > MAX_TEXT_CHARS
    ? normalized.slice(0, MAX_TEXT_CHARS)
    : normalized;
}

function ensurePdfDomGlobals(): void {
  if (globalThis.DOMMatrix && globalThis.ImageData && globalThis.Path2D) {
    return;
  }

  let canvas: CanvasModule | null = null;
  try {
    canvas = nodeRequire("@napi-rs/canvas") as CanvasModule;
  } catch {
    canvas = null;
  }

  globalThis.DOMMatrix ??=
    (canvas?.DOMMatrix as typeof DOMMatrix | undefined) ??
    (TextExtractionDOMMatrix as unknown as typeof DOMMatrix);
  if (canvas?.ImageData) {
    globalThis.ImageData ??= canvas.ImageData as typeof ImageData;
  }
  globalThis.Path2D ??=
    (canvas?.Path2D as typeof Path2D | undefined) ??
    (TextExtractionPath2D as unknown as typeof Path2D);
}

async function ensurePdfWorker(PDFParse: PdfParseClass): Promise<void> {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs",
  );
  const workerUrl = pathToFileURL(workerPath).href;
  PDFParse.setWorker(workerUrl);

  const pdfGlobal = globalThis as PdfJsWorkerGlobal;
  if (!pdfGlobal.pdfjsWorker?.WorkerMessageHandler) {
    await import(/* webpackIgnore: true */ workerUrl);
  }
}

/** Extract readable text from a PDF buffer. */
async function extractPdf(buffer: Buffer): Promise<string> {
  ensurePdfDomGlobals();

  const { PDFParse } = nodeRequire("pdf-parse") as typeof import("pdf-parse");
  await ensurePdfWorker(PDFParse);

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

/** Extract raw text from a .docx buffer. */
async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value ?? "";
}

/** Naively strip an HTML document down to its visible text. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|br|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Extract text from an uploaded file based on its mime type / filename.
 */
export async function extractFromFile(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<string> {
  const name = filename.toLowerCase();
  const isPdf = mimeType.includes("pdf") || name.endsWith(".pdf");
  const isDocx =
    mimeType.includes("officedocument.wordprocessingml") ||
    name.endsWith(".docx");

  if (isPdf) return clamp(await extractPdf(buffer));
  if (isDocx) return clamp(await extractDocx(buffer));

  // txt, csv, md, json, html, or anything else: treat as UTF-8 text.
  const text = buffer.toString("utf8");
  if (name.endsWith(".html") || name.endsWith(".htm")) {
    return clamp(htmlToText(text));
  }
  return clamp(text);
}

/** Fetch a URL and extract its readable text. */
export async function extractFromUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": "JidokaOSBot/1.0 (+content-ingest)" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch URL (${res.status})`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  const body = await res.text();
  if (contentType.includes("text/html") || /<html/i.test(body)) {
    return clamp(htmlToText(body));
  }
  return clamp(body);
}
