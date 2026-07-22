import { BookOpen } from "lucide-react";

import { requireUser } from "@/lib/auth";
import {
  asRows,
  formatDate,
  isOpsSchemaMissing,
  opsTable,
  titleCase,
} from "@/lib/marketing-os/operations";
import { EmptyState } from "@/components/empty-state";
import { OpsSchemaNotice } from "@/components/ops-schema-notice";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPlaybookAction, updatePlaybookStatusAction } from "./actions";

export const metadata = { title: "Playbooks · Jidoka Marketing Team OS" };

type PlaybookRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  summary: string | null;
  steps: unknown;
  owner_name: string | null;
  last_reviewed_at: string | null;
  created_at: string;
};

function readSteps(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (item && typeof item === "object" && "body" in item) {
      return String(item.body);
    }
    return String(item);
  });
}

export default async function PlaybooksPage() {
  const { user, supabase } = await requireUser();
  const playbooksResult = await opsTable(supabase, "marketing_os_playbooks")
    .select("id, title, category, status, summary, steps, owner_name, last_reviewed_at, created_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  const schemaMissing = isOpsSchemaMissing(playbooksResult.error);
  const playbooks = schemaMissing
    ? []
    : asRows<PlaybookRow>(playbooksResult.data);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Playbooks"
        description="Document SOPs, campaign processes, publishing standards, client handoffs, and lessons learned."
      />

      {schemaMissing && <OpsSchemaNotice />}

      {!schemaMissing && (
        <Card>
          <CardHeader>
            <CardTitle>Create playbook</CardTitle>
            <CardDescription>
              Keep it short, operational, and tied to a repeatable marketing
              workflow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={createPlaybookAction}
              className="grid gap-3 lg:grid-cols-[1fr_180px_160px_auto]"
            >
              <Input name="title" placeholder="Playbook title" required />
              <select
                name="category"
                className="flex h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
              >
                {[
                  "strategy",
                  "campaign",
                  "content",
                  "publishing",
                  "analytics",
                  "client_ops",
                  "sales",
                  "agency_ops",
                ].map((item) => (
                  <option key={item} value={item}>
                    {titleCase(item)}
                  </option>
                ))}
              </select>
              <Input name="owner_name" placeholder="Owner" />
              <Button type="submit">Add</Button>
              <Textarea
                name="summary"
                placeholder="Summary"
                className="lg:col-span-2"
              />
              <Textarea
                name="steps"
                placeholder="Steps, one per line"
                className="lg:col-span-2"
              />
            </form>
          </CardContent>
        </Card>
      )}

      {!schemaMissing && playbooks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No playbooks yet"
          description="Create the first SOP so the team can repeat what works."
        />
      ) : (
        !schemaMissing && (
          <div className="grid gap-4 lg:grid-cols-2">
            {playbooks.map((playbook) => {
              const steps = readSteps(playbook.steps);
              return (
                <Card key={playbook.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{playbook.title}</CardTitle>
                        <CardDescription>
                          {titleCase(playbook.category)} ·{" "}
                          {playbook.owner_name ?? "No owner"} · Reviewed{" "}
                          {formatDate(playbook.last_reviewed_at)}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          playbook.status === "active" ? "default" : "outline"
                        }
                      >
                        {titleCase(playbook.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {playbook.summary && (
                      <p className="text-sm text-muted-foreground">
                        {playbook.summary}
                      </p>
                    )}
                    {steps.length > 0 && (
                      <ol className="space-y-2 text-sm text-muted-foreground">
                        {steps.slice(0, 5).map((step, index) => (
                          <li key={`${playbook.id}-${index}`} className="rounded-lg border p-3">
                            {index + 1}. {step}
                          </li>
                        ))}
                      </ol>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {["active", "draft", "archived"].map((status) => (
                        <form key={status} action={updatePlaybookStatusAction}>
                          <input type="hidden" name="id" value={playbook.id} />
                          <input type="hidden" name="status" value={status} />
                          <Button
                            type="submit"
                            size="xs"
                            variant={
                              playbook.status === status ? "default" : "outline"
                            }
                          >
                            {titleCase(status)}
                          </Button>
                        </form>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
