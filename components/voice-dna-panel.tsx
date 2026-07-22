import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  VoiceProfileData,
  BeliefProfileData,
  HookLibraryData,
  StoryFrameworksData,
  PhraseLibraryData,
  KnowledgeGraphData,
} from "@/lib/schemas/profiles";

export interface DnaData {
  voice?: VoiceProfileData | null;
  belief?: BeliefProfileData | null;
  hooks?: HookLibraryData | null;
  story?: StoryFrameworksData | null;
  phrase?: PhraseLibraryData | null;
  knowledge?: KnowledgeGraphData | null;
}

function ScoreBars({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="space-y-2">
      {Object.entries(scores).map(([k, v]) => (
        <div key={k} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-xs capitalize text-muted-foreground">
            {k.replace(/_/g, " ")}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(0, Math.min(100, v))}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-xs tabular-nums">
            {Math.round(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  if (!items?.length) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t, i) => (
        <Badge key={`${t}-${i}`} variant="secondary" className="font-normal">
          {t}
        </Badge>
      ))}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}

export function VoiceDnaPanel({ data }: { data: DnaData }) {
  const { voice, belief, hooks, story, phrase, knowledge } = data;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {voice && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Tone</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreBars scores={voice.tone} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Emotional profile</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreBars scores={voice.emotional_profile} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Writing DNA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{voice.summary}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cadence" value={voice.fingerprint.cadence} />
                <Field label="Vocabulary" value={voice.fingerprint.vocabulary} />
                <Field label="Hook style" value={voice.fingerprint.hook_style} />
                <Field label="CTA style" value={voice.fingerprint.cta_style} />
                <Field
                  label="Sentence length"
                  value={voice.syntax.avg_sentence_length}
                />
                <Field
                  label="Paragraphs"
                  value={voice.formatting.paragraph_length}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Signature language
                </p>
                <Tags items={voice.quirks.signature_language} />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Repeated phrases
                </p>
                <Tags items={voice.quirks.repeated_phrases} />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {belief && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Beliefs &amp; worldview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{belief.summary}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Core beliefs
                </p>
                <ul className="space-y-1 text-sm">
                  {belief.core_beliefs.map((b, i) => (
                    <li key={i}>• {b.belief}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Contrarian beliefs
                </p>
                <ul className="space-y-1 text-sm">
                  {belief.contrarian_beliefs.map((b, i) => (
                    <li key={i}>• {b.belief}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hooks && hooks.hooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hook library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hooks.hooks.slice(0, 8).map((h, i) => (
              <div key={i} className="border-l-2 border-primary/40 pl-3">
                <p className="text-sm font-medium">{h.type}</p>
                <p className="text-sm text-muted-foreground">“{h.example}”</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {story && story.frameworks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Storytelling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {story.frameworks.slice(0, 6).map((f, i) => (
              <div key={i}>
                <p className="text-sm font-medium">{f.name}</p>
                <p className="text-sm text-muted-foreground">{f.structure}</p>
              </div>
            ))}
            {story.emotional_arcs.length > 0 && (
              <div className="pt-2">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Emotional arcs
                </p>
                <Tags items={story.emotional_arcs.map((a) => a.arc)} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {phrase && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Phrase memory</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Favorite phrases
              </p>
              <Tags items={phrase.favorite_phrases} />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                CTAs
              </p>
              <Tags items={phrase.ctas} />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Openers
              </p>
              <Tags items={phrase.openers} />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Transitions
              </p>
              <Tags items={phrase.transitions} />
            </div>
          </CardContent>
        </Card>
      )}

      {knowledge && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Knowledge graph</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{knowledge.summary}</p>
            {knowledge.products.length > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Products / offers
                </p>
                <Tags items={knowledge.products.map((p) => p.name)} />
              </div>
            )}
            {knowledge.customers.length > 0 && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Personas
                </p>
                <Tags items={knowledge.customers.map((c) => c.persona)} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
