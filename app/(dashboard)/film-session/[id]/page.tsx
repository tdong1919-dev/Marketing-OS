import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { FilmSessionView } from "@/components/film-session-view";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { assembleSession, countScripts } from "@/lib/film-session/assemble";
import type { GeneratedFilmScript } from "@/lib/ai/film-session";

export default async function FilmSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: session } = await supabase
    .from("marketing_os_film_sessions")
    .select("id, title, client_name, scripts, marketing_os_writing_agents(name)")
    .eq("id", id)
    .maybeSingle();
  if (!session) notFound();

  const agent = session.marketing_os_writing_agents as unknown as { name: string } | null;
  const scripts = (session.scripts as unknown as GeneratedFilmScript[]) ?? [];
  const sections = assembleSession(scripts);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/film-session"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All film sessions
        </Link>
      </div>

      <PageHeader title={session.title} description={agent?.name ?? undefined}>
        <a
          href={`/api/film-session/${session.id}/docx`}
          className={buttonVariants()}
          download
        >
          <Download className="mr-1 h-4 w-4" /> Download .docx
        </a>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {session.client_name && <Badge variant="outline">{session.client_name}</Badge>}
        <Badge variant="secondary">{countScripts(sections)} scripts</Badge>
      </div>

      <FilmSessionView sections={sections} sessionId={session.id} />
    </div>
  );
}
