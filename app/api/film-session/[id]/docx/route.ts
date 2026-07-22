import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { assembleSession } from "@/lib/film-session/assemble";
import { buildFilmSessionDocx } from "@/lib/film-session/docx";
import type { GeneratedFilmScript } from "@/lib/ai/film-session";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: session } = await supabase
    .from("marketing_os_film_sessions")
    .select("title, client_name, scripts")
    .eq("id", id)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const scripts = (session.scripts as unknown as GeneratedFilmScript[]) ?? [];
  const sections = assembleSession(scripts);
  const buffer = await buildFilmSessionDocx(
    session.title,
    session.client_name,
    sections,
  );

  const safe = session.title.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safe || "film-session"}.docx"`,
    },
  });
}
