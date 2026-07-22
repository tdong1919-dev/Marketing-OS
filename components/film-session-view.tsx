import { cleanBullet, type AssembledSection } from "@/lib/film-session/assemble";
import { Badge } from "@/components/ui/badge";
import { ScheduleScriptControl } from "@/components/schedule-script-control";

/** Renders a film session in the reference layout (sections → 🎬 scripts). */
export function FilmSessionView({
  sections,
  sessionId,
}: {
  sections: AssembledSection[];
  sessionId: string;
}) {
  return (
    <div className="space-y-10">
      {sections.map((sec) => (
        <section key={sec.section}>
          <h2 className="mb-4 border-b pb-2 text-lg font-bold">
            {sec.emoji} {sec.section}
          </h2>
          <div className="space-y-8">
            {sec.scripts.map((s, i) => (
              <article key={i} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">🎬 {s.title}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {s.formatName}
                  </Badge>
                  <div className="ml-auto">
                    <ScheduleScriptControl
                      sessionId={sessionId}
                      scriptIndex={s.index}
                      title={s.title}
                    />
                  </div>
                </div>

                {s.tldr && s.tldr.length > 0 && (
                  <div className="rounded-md bg-muted/40 p-3 text-sm">
                    <p className="mb-1 font-medium italic">TL;DR</p>
                    <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                      {s.tldr.map((t, j) => (
                        <li key={j}>{cleanBullet(t)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-1.5 text-sm">
                  {s.blocks.map((b, j) => (
                    <div key={j}>
                      <p>
                        {b.label && (
                          <span className="font-medium">{b.label} </span>
                        )}
                        {b.text}
                      </p>
                      {b.bullets && b.bullets.length > 0 && (
                        <ul className="list-disc space-y-0.5 pl-6 text-muted-foreground">
                          {b.bullets.map((bl, k) => (
                            <li key={k}>{cleanBullet(bl)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
