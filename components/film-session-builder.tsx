"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Clapperboard } from "lucide-react";

import { SCRIPT_FORMATS } from "@/lib/formats/registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Row {
  formatId: string;
  count: number;
  topics: string;
}

const MAX = 50;

export function FilmSessionBuilder({
  agents,
}: {
  agents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { formatId: SCRIPT_FORMATS[0].id, count: 5, topics: "" },
  ]);

  const total = useMemo(
    () => rows.reduce((n, r) => n + (Number(r.count) || 0), 0),
    [rows],
  );

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, { formatId: SCRIPT_FORMATS[0].id, count: 3, topics: "" }]);
  }
  function removeRow(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  }

  async function generate() {
    if (!agentId) return toast.error("Pick an agent");
    if (total === 0) return toast.error("Add at least one format with a count");
    if (total > MAX) return toast.error(`Max ${MAX} scripts per session (you have ${total})`);

    const items = rows
      .filter((r) => Number(r.count) > 0)
      .map((r) => ({
        formatId: r.formatId,
        count: Number(r.count),
        topics: r.topics
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
      }));

    setBusy(true);
    toast.info(`Generating ${total} scripts — this can take a minute or two…`);
    try {
      const res = await fetch("/api/film-session/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          title: title.trim() || "Film Session",
          source_material: source,
          items,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Generation failed");
        return;
      }
      toast.success(`Generated ${json.count} scripts`);
      router.push(`/film-session/${json.id}`);
    } catch {
      toast.error("Network error during generation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agent">Agent</Label>
            <select
              id="agent"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Session title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Film Session 5, Sam Patel"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="source">Source material (articles, notes, meeting takeaways)</Label>
            <Textarea
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              rows={6}
              placeholder="Paste articles, bullet points, KPIs, product notes… the writer draws topics and facts from here."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Format mix</CardTitle>
          <span className="text-sm text-muted-foreground">
            {total} / {MAX} scripts
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_90px_2fr_auto]">
              <div className="space-y-1">
                <Label className="text-xs">Format</Label>
                <select
                  value={r.formatId}
                  onChange={(e) => updateRow(i, { formatId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  {SCRIPT_FORMATS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.sectionEmoji} {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Count</Label>
                <Input
                  type="number"
                  min={1}
                  max={MAX}
                  value={r.count}
                  onChange={(e) => updateRow(i, { count: Number(e.target.value) })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Topics (optional, one per line)</Label>
                <Textarea
                  value={r.topics}
                  onChange={(e) => updateRow(i, { topics: e.target.value })}
                  rows={1}
                  placeholder="Leave blank to auto-pick from source material"
                  className="min-h-9"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  onClick={() => removeRow(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" type="button" onClick={addRow}>
            <Plus className="mr-1 h-4 w-4" /> Add format
          </Button>
        </CardContent>
      </Card>

      <Button onClick={generate} disabled={busy}>
        <Clapperboard className="mr-1 h-4 w-4" />
        {busy ? "Generating…" : `Generate ${total} scripts`}
      </Button>
    </div>
  );
}
