import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Camera, Globe2 } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { decryptToken } from "@/lib/crypto";
import { listMetaConnectionOptions } from "@/lib/social/meta";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { saveSelectedMetaAccountsAction } from "./actions";

type PendingMetaSelection = {
  token: string;
  agent_id: string;
  platform: string;
  uid: string;
};

function parsePendingMetaSelection(raw: string | undefined) {
  if (!raw) return null;

  try {
    return JSON.parse(decryptToken(raw)) as PendingMetaSelection;
  } catch {
    return null;
  }
}

export const metadata = { title: "Choose Meta account · Jidoka Marketing Team OS" };

export default async function MetaSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ agent_id?: string; platform?: string }>;
}) {
  const { agent_id: agentId = "", platform = "instagram" } = await searchParams;
  if (!agentId) redirect("/agents?connect=error&reason=Missing%20agent");

  const { user, supabase } = await requireUser();
  const cookieStore = await cookies();
  const pending = parsePendingMetaSelection(
    cookieStore.get("marketing_os_meta_select")?.value,
  );

  if (!pending || pending.agent_id !== agentId || pending.uid !== user.id) {
    redirect(
      `/agents/${agentId}?tab=connections&connect=session_error&reason=Meta%20login%20expired.%20Start%20again.`,
    );
  }

  const { data: agent } = await supabase
    .from("marketing_os_writing_agents")
    .select("id, name")
    .eq("id", agentId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!agent) redirect("/agents?connect=error&reason=Agent%20not%20found");

  let options = await listMetaConnectionOptions(pending.token);
  options = options.sort((a, b) =>
    (a.pageName ?? "").localeCompare(b.pageName ?? ""),
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Choose Meta Account"
        description={`Select the Facebook Page and linked Instagram account for ${agent.name}.`}
      />

      <div className="mb-5 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Facebook and Instagram use the same Meta login. Choose the Page that
        belongs to this client, then connect Facebook, Instagram, or both.
      </div>

      {options.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-6">
            <p className="font-medium">No Facebook Pages found</p>
            <p className="text-sm text-muted-foreground">
              The Meta account must have access to a Facebook Page. Instagram
              requires that Page to be connected to an Instagram Professional
              account.
            </p>
            <Link
              href={`/agents/${agentId}?tab=connections`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Back to Connections
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {options.map((option) => {
            const hasInstagram = Boolean(option.igUserId);
            const defaultInstagram = platform === "instagram" && hasInstagram;

            return (
              <Card key={option.pageId}>
                <CardHeader className="border-b">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{option.pageName ?? "Untitled Page"}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Facebook Page ID: {option.pageId}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <Globe2 className="h-3 w-3" />
                        Facebook Page
                      </Badge>
                      {hasInstagram ? (
                        <Badge variant="outline">
                          <Camera className="h-3 w-3" />
                          @{option.igUsername ?? "Instagram"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No Instagram linked</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 py-4">
                  <form action={saveSelectedMetaAccountsAction} className="space-y-4">
                    <input type="hidden" name="agent_id" value={agentId} />
                    <input type="hidden" name="page_id" value={option.pageId} />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                        <input
                          type="checkbox"
                          name="connect_facebook"
                          value="1"
                          defaultChecked
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-medium">Connect Facebook</span>
                          <span className="block text-xs text-muted-foreground">
                            Use this Page for Facebook scheduling and analytics.
                          </span>
                        </span>
                      </label>

                      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                        <input
                          type="checkbox"
                          name="connect_instagram"
                          value="1"
                          defaultChecked={defaultInstagram}
                          disabled={!hasInstagram}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-medium">Connect Instagram</span>
                          <span className="block text-xs text-muted-foreground">
                            {hasInstagram
                              ? `Use @${option.igUsername ?? "this Instagram account"}.`
                              : "Link an Instagram Professional account to this Page first."}
                          </span>
                        </span>
                      </label>
                    </div>

                    <Button type="submit">Connect selected accounts</Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
