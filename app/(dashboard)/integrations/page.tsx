import {
  MARKETING_INTEGRATION_CATEGORIES,
  MARKETING_INTEGRATIONS,
  type MarketingIntegrationStatus,
} from "@/lib/marketing-integrations";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Integrations · Jidoka Marketing Team OS" };

function statusLabel(status: MarketingIntegrationStatus, connected: boolean) {
  if (connected) return "Connected";
  switch (status) {
    case "live":
      return "Ready to connect";
    case "api_setup":
      return "API setup";
    case "manual":
      return "Manual option";
    case "planned":
      return "Planned";
  }
}

function statusVariant(status: MarketingIntegrationStatus, connected: boolean) {
  if (connected || status === "live") return "default";
  return "outline";
}

export default async function IntegrationsPage() {
  const { supabase } = await requireUser();
  const [{ data: accounts }, { data: latestAgent }] = await Promise.all([
    supabase.from("marketing_os_social_accounts").select("platform, status"),
    supabase
      .from("marketing_os_writing_agents")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const connected = new Set(
    (accounts ?? [])
      .filter((account) => account.status === "active")
      .map((account) => account.platform),
  );
  const connectionHref = latestAgent?.id
    ? `/agents/${latestAgent.id}?tab=connections`
    : "/agents";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect the tools Jidoka Marketing Team OS already supports, and see which marketing APIs are ready for setup next."
      >
        <ButtonLink href={connectionHref}>Open Connections</ButtonLink>
      </PageHeader>

      {MARKETING_INTEGRATION_CATEGORIES.map((category) => (
        <section key={category} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {category}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {MARKETING_INTEGRATIONS.filter(
              (integration) => integration.category === category,
            ).map((integration) => {
              const isConnected = connected.has(integration.key);
              return (
                <Card key={integration.key}>
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base">
                        {integration.name}
                      </CardTitle>
                      <Badge
                        variant={statusVariant(integration.status, isConnected)}
                        className="shrink-0"
                      >
                        {statusLabel(integration.status, isConnected)}
                      </Badge>
                    </div>
                    <CardDescription>{integration.summary}</CardDescription>
                  </CardHeader>
                  {integration.status === "live" && (
                    <CardContent>
                      <ButtonLink
                        href={connectionHref}
                        variant={isConnected ? "outline" : "default"}
                        size="sm"
                      >
                        {isConnected ? "Manage" : "Connect"}
                      </ButtonLink>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
