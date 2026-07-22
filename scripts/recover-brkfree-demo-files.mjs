import { createClient } from "@supabase/supabase-js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const outDir = path.join(cwd, "recovered-marketing-os-demo-files");
const originalsDir = path.join(outDir, "original-uploads");
const extractedDir = path.join(outDir, "extracted-text");

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function safeName(value, fallback = "marketing-os-upload") {
  return String(value || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140) || fallback;
}

function extFromMime(mimeType) {
  if (!mimeType) return "";
  if (mimeType.includes("pdf")) return ".pdf";
  if (mimeType.includes("wordprocessingml")) return ".docx";
  if (mimeType.includes("msword")) return ".doc";
  if (mimeType.includes("spreadsheetml")) return ".xlsx";
  if (mimeType.includes("csv")) return ".csv";
  if (mimeType.includes("plain")) return ".txt";
  if (mimeType.includes("markdown")) return ".md";
  return "";
}

function extFromPath(storagePath, mimeType) {
  const ext = path.extname(storagePath || "");
  return ext || extFromMime(mimeType) || ".bin";
}

async function uniquePath(dir, fileName) {
  const parsed = path.parse(fileName);
  let candidate = path.join(dir, fileName);
  for (let i = 2; ; i += 1) {
    try {
      await readFile(candidate);
      candidate = path.join(dir, `${parsed.name}-${i}${parsed.ext}`);
    } catch {
      return candidate;
    }
  }
}

async function fetchRows(supabase, table) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return { table, rows: [], error: error.message };
  return { table, rows: data ?? [], error: null };
}

async function listBucketFiles(supabase, bucketId, prefix = "") {
  const { data, error } = await supabase.storage
    .from(bucketId)
    .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
  if (error) return [];

  const files = [];
  for (const item of data ?? []) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    const looksLikeFolder = item.id === null || item.metadata === null;
    if (looksLikeFolder) {
      files.push(...(await listBucketFiles(supabase, bucketId, fullPath)));
    } else {
      files.push({ bucketId, path: fullPath, metadata: item.metadata ?? {} });
    }
  }
  return files;
}

async function downloadObject(supabase, bucketId, objectPath, targetPath) {
  const { data, error } = await supabase.storage.from(bucketId).download(objectPath);
  if (error || !data) return { ok: false, error: error?.message ?? "No data" };
  const bytes = Buffer.from(await data.arrayBuffer());
  await writeFile(targetPath, bytes);
  return { ok: true, bytes: bytes.length };
}

async function main() {
  const env = {
    ...parseEnv(await readFile(path.join(cwd, ".env.local"), "utf8")),
    ...process.env,
  };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase URL or key in .env.local.");
  }

  await mkdir(originalsDir, { recursive: true });
  await mkdir(extractedDir, { recursive: true });

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rowSets = await Promise.all([
    fetchRows(supabase, "marketing_os_uploaded_assets"),
    fetchRows(supabase, "uploaded_assets"),
    fetchRows(supabase, "training_assets"),
  ]);

  const recovered = {
    projectUrl: url,
    tables: rowSets.map((set) => ({
      table: set.table,
      rows: set.rows.length,
      error: set.error,
    })),
    extractedTextFiles: [],
    downloadedOriginals: [],
    storageBuckets: [],
    storageErrors: [],
  };

  const candidateBuckets = new Set();
  const allRows = rowSets.flatMap((set) =>
    set.rows.map((row) => ({ ...row, __table: set.table })),
  );

  for (const row of allRows) {
    if (row.storage_path) {
      candidateBuckets.add(row.bucket_id || "marketing-os-assets");
      candidateBuckets.add("assets");
      candidateBuckets.add("uploads");
    }

    const text = row.extracted_text || row.content || row.raw_text;
    if (typeof text === "string" && text.trim()) {
      const fileName = `${safeName(row.title || row.name || row.id)}.txt`;
      const target = await uniquePath(extractedDir, fileName);
      await writeFile(
        target,
        [
          `Title: ${row.title || row.name || "Untitled"}`,
          `Source table: ${row.__table}`,
          row.mime_type ? `MIME type: ${row.mime_type}` : null,
          row.created_at ? `Uploaded: ${row.created_at}` : null,
          "",
          text,
        ].filter(Boolean).join("\n"),
        "utf8",
      );
      recovered.extractedTextFiles.push(path.basename(target));
    }
  }

  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    recovered.storageErrors.push(bucketError.message);
  }
  for (const bucket of buckets ?? []) {
    if (
      /brkfree|asset|upload|media|script|training/i.test(bucket.id) ||
      candidateBuckets.has(bucket.id)
    ) {
      recovered.storageBuckets.push(bucket.id);
      candidateBuckets.add(bucket.id);
    }
  }

  for (const row of allRows.filter((item) => item.storage_path)) {
    const fileName = safeName(row.title || path.basename(row.storage_path));
    const ext = extFromPath(row.storage_path, row.mime_type);
    const targetName = `${fileName}${fileName.endsWith(ext) ? "" : ext}`;
    for (const bucketId of candidateBuckets) {
      const target = await uniquePath(originalsDir, targetName);
      const result = await downloadObject(supabase, bucketId, row.storage_path, target);
      if (result.ok) {
        recovered.downloadedOriginals.push({
          bucket: bucketId,
          path: row.storage_path,
          file: path.basename(target),
          bytes: result.bytes,
        });
        break;
      }
    }
  }

  for (const bucketId of candidateBuckets) {
    const files = await listBucketFiles(supabase, bucketId);
    for (const file of files) {
      const nestedDir = path.join(originalsDir, bucketId, path.dirname(file.path));
      await mkdir(nestedDir, { recursive: true });
      const target = path.join(nestedDir, safeName(path.basename(file.path)));
      const alreadyDownloaded = recovered.downloadedOriginals.some(
        (item) => item.bucket === bucketId && item.path === file.path,
      );
      if (alreadyDownloaded) continue;
      const result = await downloadObject(supabase, bucketId, file.path, target);
      if (result.ok) {
        recovered.downloadedOriginals.push({
          bucket: bucketId,
          path: file.path,
          file: path.relative(originalsDir, target),
          bytes: result.bytes,
        });
      }
    }
  }

  await writeFile(
    path.join(outDir, "recovery-summary.json"),
    `${JSON.stringify(recovered, null, 2)}\n`,
    "utf8",
  );

  console.log(`Recovered ${recovered.downloadedOriginals.length} original file(s).`);
  console.log(`Recovered ${recovered.extractedTextFiles.length} extracted text file(s).`);
  console.log(`Output folder: ${outDir}`);
  console.log(`Project URL: ${url}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
