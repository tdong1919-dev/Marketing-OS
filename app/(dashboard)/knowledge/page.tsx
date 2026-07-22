import Link from "next/link";
import { BookOpen } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Knowledge Base · Jidoka Marketing Team OS" };

export default async function KnowledgePage() {
  const { supabase } = await requireUser();

  const { data: graphs } = await supabase
    .from("marketing_os_knowledge_graphs")
    .select("agent_id, summary, updated_at, writing_agents:marketing_os_writing_agents(name)")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Business context powering every agent's writing."
      />

      {!graphs || graphs.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No knowledge graphs yet"
          description="Analysis extracts company, products, customers, competitors, objections, and testimonials into a knowledge graph."
          actionLabel="Go to agents"
          actionHref="/agents"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {graphs.map((g) => {
            const agent = g.writing_agents as unknown as { name: string } | null;
            return (
              <Link key={g.agent_id} href={`/agents/${g.agent_id}`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardContent className="space-y-2 pt-6">
                    <h3 className="font-semibold">{agent?.name ?? "Agent"}</h3>
                    {g.summary && (
                      <p className="line-clamp-4 text-sm text-muted-foreground">
                        {g.summary}
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
