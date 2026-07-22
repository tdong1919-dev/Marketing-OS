import Link from "next/link";
import { Fingerprint } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Brand Voice DNA · Jidoka Marketing Team OS" };

export default async function VoiceDnaPage() {
  const { supabase } = await requireUser();

  const { data: profiles } = await supabase
    .from("marketing_os_voice_profiles")
    .select("agent_id, summary, updated_at, writing_agents:marketing_os_writing_agents(name)")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Brand Voice DNA"
        description="Permanent writing fingerprints for every analyzed client agent."
      />

      {!profiles || profiles.length === 0 ? (
        <EmptyState
          icon={Fingerprint}
          title="No Voice DNA yet"
          description="Run Voice Intelligence Analysis on an agent to generate its Writing DNA Profile."
          actionLabel="Go to agents"
          actionHref="/agents"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => {
            const agent = p.writing_agents as unknown as { name: string } | null;
            return (
              <Link key={p.agent_id} href={`/agents/${p.agent_id}?tab=dna`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardContent className="space-y-2 pt-6">
                    <h3 className="font-semibold">{agent?.name ?? "Agent"}</h3>
                    {p.summary && (
                      <p className="line-clamp-4 text-sm text-muted-foreground">
                        {p.summary}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
