import { NextResponse } from "next/server";

import { getAuthContext } from "@/lib/auth";
import { extractFromFile, extractFromUrl } from "@/lib/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB, avoids platform body-size rejection.

export async function POST(request: Request) {
  const context = await getAuthContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { user, supabase } = context;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const agentId = String(form.get("agent_id") ?? "");
  const kind = String(form.get("kind") ?? "paste");
  const title = String(form.get("title") ?? "").trim() || null;
  const sourceUrl = String(form.get("source_url") ?? "").trim() || null;
  const pastedText = String(form.get("text") ?? "");
  const file = form.get("file");

  if (!agentId) {
    return NextResponse.json({ error: "agent_id is required" }, { status: 400 });
  }

  // Ownership check (RLS also enforces this, but fail fast with a clear error).
  const { data: agent } = await supabase
    .from("marketing_os_writing_agents")
    .select("id")
    .eq("id", agentId)
    .maybeSingle();
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  let extractedText = "";
  let storagePath: string | null = null;
  let mimeType: string | null = null;
  let byteSize: number | null = null;
  let resolvedTitle = title;

  try {
    if (file && file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: "File exceeds 4 MB limit" },
          { status: 413 },
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      mimeType = file.type || "application/octet-stream";
      byteSize = file.size;
      resolvedTitle = resolvedTitle ?? file.name;

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      storagePath = `${user.id}/${agentId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage.from("marketing-os-assets")
        .upload(storagePath, buffer, { contentType: mimeType, upsert: false });
      if (uploadError) {
        return NextResponse.json(
          { error: `Upload failed: ${uploadError.message}` },
          { status: 500 },
        );
      }

      extractedText = await extractFromFile(buffer, mimeType, file.name);
    } else if (sourceUrl) {
      extractedText = await extractFromUrl(sourceUrl);
      resolvedTitle = resolvedTitle ?? sourceUrl;
    } else if (pastedText.trim()) {
      extractedText = pastedText.trim();
    } else {
      return NextResponse.json(
        { error: "Provide a file, a URL, or pasted text" },
        { status: 400 },
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    // Record the failure so the user can see and retry.
    await supabase.from("marketing_os_uploaded_assets").insert({
      agent_id: agentId,
      owner_id: user.id,
      kind,
      title: resolvedTitle,
      source_url: sourceUrl,
      storage_path: storagePath,
      mime_type: mimeType,
      byte_size: byteSize,
      status: "error",
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 422 });
  }

  if (!extractedText || extractedText.length < 2) {
    return NextResponse.json(
      { error: "No readable text could be extracted from this asset" },
      { status: 422 },
    );
  }

  const { data: asset, error: insertError } = await supabase
    .from("marketing_os_uploaded_assets")
    .insert({
      agent_id: agentId,
      owner_id: user.id,
      kind,
      title: resolvedTitle,
      source_url: sourceUrl,
      storage_path: storagePath,
      mime_type: mimeType,
      byte_size: byteSize,
      extracted_text: extractedText,
      char_count: extractedText.length,
      status: "extracted",
    })
    .select("id, title, kind, status, char_count")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ asset });
}
